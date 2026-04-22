import { describe, expect, it } from "vitest";
import {
	type AuditEntry,
	decodeValue,
	diffApplication,
	diffTags,
} from "@/shared/lib/audit";

const baseApp = {
	status: "APPLIED",
	company: "Acme",
	position: "Engineer",
	priority: "MEDIUM",
	salaryMin: 50_000,
	salaryMax: 90_000,
	notes: null,
	appliedAt: new Date("2026-04-01T00:00:00Z"),
};

describe("diffApplication", () => {
	it("returns empty array when no fields changed", () => {
		expect(diffApplication(baseApp, { ...baseApp })).toEqual([]);
	});

	it("emits STATUS_CHANGE when status changes", () => {
		const entries = diffApplication(baseApp, { ...baseApp, status: "OFFER" });
		expect(entries).toHaveLength(1);
		const e = entries[0] as AuditEntry;
		expect(e.type).toBe("STATUS_CHANGE");
		expect(e.field).toBe("status");
		expect(e.oldValue).toBe('"APPLIED"');
		expect(e.newValue).toBe('"OFFER"');
	});

	it("emits FIELD_CHANGE for tracked field changes", () => {
		const entries = diffApplication(baseApp, {
			...baseApp,
			company: "Globex",
			salaryMin: 60_000,
		});
		const fields = entries.map((e) => e.field);
		expect(fields).toEqual(expect.arrayContaining(["company", "salaryMin"]));
		expect(entries.every((e) => e.type === "FIELD_CHANGE")).toBe(true);
	});

	it("normalises Date instances via ISO string for comparison", () => {
		const entries = diffApplication(baseApp, {
			...baseApp,
			appliedAt: new Date("2026-04-01T00:00:00Z"),
		});
		expect(entries).toEqual([]);
	});

	it("treats null and undefined as equal (no spurious diff)", () => {
		const entries = diffApplication(
			{ ...baseApp, notes: null },
			{ ...baseApp, notes: undefined },
		);
		expect(entries).toEqual([]);
	});

	it("ignores fields outside the tracked allow-list", () => {
		const entries = diffApplication(
			{ ...baseApp, randomField: "a" } as Record<string, unknown>,
			{ ...baseApp, randomField: "b" } as Record<string, unknown>,
		);
		expect(entries).toEqual([]);
	});
});

describe("diffTags", () => {
	it("returns null when tag sets are equal regardless of order", () => {
		expect(diffTags(["a", "b"], ["b", "a"])).toBeNull();
		expect(diffTags([], [])).toBeNull();
	});

	it("returns FIELD_CHANGE entry with sorted JSON arrays", () => {
		const entry = diffTags(["b", "a"], ["a", "c"]);
		expect(entry).not.toBeNull();
		expect(entry?.field).toBe("tags");
		expect(entry?.oldValue).toBe('["a","b"]');
		expect(entry?.newValue).toBe('["a","c"]');
	});
});

describe("decodeValue", () => {
	it("returns null for null input", () => {
		expect(decodeValue(null)).toBeNull();
	});

	it("decodes JSON-encoded strings", () => {
		expect(decodeValue('"APPLIED"')).toBe("APPLIED");
		expect(decodeValue("123")).toBe(123);
		expect(decodeValue('["a","b"]')).toEqual(["a", "b"]);
	});

	it("falls back to raw string for invalid JSON", () => {
		expect(decodeValue("not-json")).toBe("not-json");
	});
});
