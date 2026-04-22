import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	arePayloadsEqual,
	buildDraftLabel,
	clearLocalRecovery,
	contextKey,
	DRAFT_SCHEMA_VERSION,
	deserializePayload,
	localRecoveryKey,
	readLocalRecovery,
	serializeForm,
	writeLocalRecovery,
} from "@/shared/lib/application-draft";

describe("contextKey / localRecoveryKey", () => {
	it("creates stable keys per context", () => {
		expect(contextKey({ mode: "CREATE" })).toBe("create");
		expect(contextKey({ mode: "EDIT", applicationId: "abc" })).toBe("edit:abc");
		expect(localRecoveryKey({ mode: "CREATE" })).toContain("create");
		expect(localRecoveryKey({ mode: "EDIT", applicationId: "abc" })).toContain(
			"edit:abc",
		);
	});
});

describe("serializeForm", () => {
	it("trims strings and drops empty values", () => {
		const out = serializeForm({
			company: "  Acme  ",
			position: "",
			notes: undefined,
		});
		expect(out.company).toBe("Acme");
		expect(out).not.toHaveProperty("position");
		expect(out).not.toHaveProperty("notes");
	});

	it("normalises tagIds to a sorted, trimmed array", () => {
		const out = serializeForm({ tagIds: [" b ", "a", ""] });
		expect(out.tagIds).toEqual(["a", "b"]);
	});

	it("preserves non-tag arrays after trimming empty items", () => {
		const out = serializeForm({
			company: ["  Acme  ", "", null] as unknown as string,
		});
		expect(out.company).toEqual(["Acme"]);
	});

	it("converts dates to ISO strings", () => {
		const date = new Date("2026-04-22T00:00:00Z");
		const out = serializeForm({ appliedAt: date });
		expect(out.appliedAt).toBe(date.toISOString());
	});

	it("drops empty date strings", () => {
		const out = serializeForm({ appliedAt: "" as unknown as Date });
		expect(out).not.toHaveProperty("appliedAt");
	});

	it("ignores invalid Date objects", () => {
		const out = serializeForm({ appliedAt: new Date("invalid") });
		expect(out).not.toHaveProperty("appliedAt");
	});

	it("swallows date coercion errors from unsupported values", () => {
		const out = serializeForm({ appliedAt: Symbol("x") as unknown as Date });
		expect(out).not.toHaveProperty("appliedAt");
	});

	it("ignores non-finite numbers", () => {
		const out = serializeForm({
			salaryMin: Number.NaN as unknown as number,
			salaryMax: 5,
		});
		expect(out).not.toHaveProperty("salaryMin");
		expect(out.salaryMax).toBe(5);
	});
});

describe("deserializePayload", () => {
	it("converts ISO strings back to Date for date fields", () => {
		const out = deserializePayload({
			appliedAt: "2026-04-22T00:00:00.000Z",
			company: "Acme",
		});
		expect(out.appliedAt).toBeInstanceOf(Date);
		expect(out.company).toBe("Acme");
	});

	it("skips unknown fields", () => {
		const out = deserializePayload({ unknownField: "x" });
		expect(out).toEqual({});
	});

	it("ignores invalid stored date strings", () => {
		const out = deserializePayload({ nextStepAt: "garbage" });
		expect(out).toEqual({});
	});
});

describe("arePayloadsEqual", () => {
	it("treats identical payloads as equal", () => {
		expect(arePayloadsEqual({ a: 1, b: "x" }, { b: "x", a: 1 })).toBe(true);
	});

	it("compares arrays element-wise", () => {
		expect(
			arePayloadsEqual({ tagIds: ["a", "b"] }, { tagIds: ["a", "b"] }),
		).toBe(true);
		expect(arePayloadsEqual({ tagIds: ["a"] }, { tagIds: ["a", "b"] })).toBe(
			false,
		);
	});

	it("treats Date and equivalent ISO string as equal", () => {
		const d = new Date("2026-04-22T00:00:00Z");
		expect(
			arePayloadsEqual({ appliedAt: d }, { appliedAt: d.toISOString() }),
		).toBe(true);
	});

	it("returns false on key mismatch", () => {
		expect(arePayloadsEqual({ a: 1 }, { b: 1 })).toBe(false);
	});

	it("returns false when scalar values differ", () => {
		expect(arePayloadsEqual({ a: 1 }, { a: 2 })).toBe(false);
	});
});

describe("buildDraftLabel", () => {
	it("combines position and company when both present", () => {
		expect(buildDraftLabel({ position: "Engineer", company: "Acme" })).toBe(
			"Engineer @ Acme",
		);
	});

	it("falls back to single value or default", () => {
		expect(buildDraftLabel({ company: "Acme" })).toBe("Acme");
		expect(buildDraftLabel({ position: "Engineer" })).toBe("Engineer");
		expect(buildDraftLabel({})).toBe("Untitled draft");
	});
});

function clearStorage() {
	const keys: string[] = [];
	for (let i = 0; i < window.localStorage.length; i++) {
		const k = window.localStorage.key(i);
		if (k) keys.push(k);
	}
	for (const k of keys) window.localStorage.removeItem(k);
}

describe("local recovery storage", () => {
	beforeEach(clearStorage);
	afterEach(clearStorage);

	it("writes, reads, and clears snapshots", () => {
		const ctx = { mode: "CREATE" } as const;
		writeLocalRecovery(ctx, { company: "Acme" });
		const snap = readLocalRecovery(ctx);
		expect(snap?.payload.company).toBe("Acme");
		expect(snap?.schemaVersion).toBe(DRAFT_SCHEMA_VERSION);
		clearLocalRecovery(ctx);
		expect(readLocalRecovery(ctx)).toBeNull();
	});

	it("returns null for malformed json", () => {
		const ctx = { mode: "CREATE" } as const;
		window.localStorage.setItem(localRecoveryKey(ctx), "{not json");
		expect(readLocalRecovery(ctx)).toBeNull();
	});

	it("returns null when schema version mismatches", () => {
		const ctx = { mode: "EDIT", applicationId: "abc" } as const;
		window.localStorage.setItem(
			localRecoveryKey(ctx),
			JSON.stringify({
				payload: { company: "Old" },
				updatedAt: new Date().toISOString(),
				schemaVersion: DRAFT_SCHEMA_VERSION + 99,
			}),
		);
		expect(readLocalRecovery(ctx)).toBeNull();
	});

	it("returns null when payload is missing from parsed storage", () => {
		const ctx = { mode: "CREATE" } as const;
		window.localStorage.setItem(
			localRecoveryKey(ctx),
			JSON.stringify({
				updatedAt: new Date().toISOString(),
				schemaVersion: DRAFT_SCHEMA_VERSION,
			}),
		);
		expect(readLocalRecovery(ctx)).toBeNull();
	});
});
