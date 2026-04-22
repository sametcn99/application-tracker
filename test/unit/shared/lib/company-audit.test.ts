import { describe, expect, it, vi } from "vitest";
import {
	decodeCompanyValue,
	diffCompany,
	TRACKED_FIELDS,
	writeCompanyActivityEntries,
} from "@/shared/lib/company-audit";

describe("diffCompany", () => {
	it("returns no entries when records are equal", () => {
		const a = { name: "Acme", industry: "Tech" };
		expect(diffCompany(a, { ...a })).toEqual([]);
	});

	it("emits FIELD_CHANGE entries with encoded values", () => {
		const entries = diffCompany({ name: "Acme" }, { name: "Acme Inc" });
		expect(entries).toHaveLength(1);
		const [e] = entries;
		expect(e.type).toBe("FIELD_CHANGE");
		expect(e.field).toBe("name");
		expect(e.oldValue).toBe('"Acme"');
		expect(e.newValue).toBe('"Acme Inc"');
	});

	it("treats null and undefined as equal", () => {
		expect(diffCompany({ industry: null }, { industry: undefined })).toEqual(
			[],
		);
	});

	it("normalises Date instances when comparing", () => {
		const d = new Date("2024-01-01T00:00:00Z");
		const entries = diffCompany(
			{ foundedYear: d as unknown },
			{ foundedYear: d as unknown },
		);
		expect(entries).toEqual([]);
	});

	it("only diffs known tracked fields", () => {
		const entries = diffCompany(
			{ unknownField: "a" } as Record<string, unknown>,
			{ unknownField: "b" } as Record<string, unknown>,
		);
		expect(entries).toEqual([]);
	});

	it("exposes a stable list of tracked fields", () => {
		expect(TRACKED_FIELDS).toContain("name");
		expect(TRACKED_FIELDS).toContain("industry");
	});
});

describe("decodeCompanyValue", () => {
	it("returns null for null input", () => {
		expect(decodeCompanyValue(null)).toBeNull();
	});

	it("parses valid JSON", () => {
		expect(decodeCompanyValue('"hello"')).toBe("hello");
		expect(decodeCompanyValue("42")).toBe(42);
		expect(decodeCompanyValue('{"x":1}')).toEqual({ x: 1 });
	});

	it("returns the raw string when JSON is malformed", () => {
		expect(decodeCompanyValue("{not json")).toBe("{not json");
	});
});

describe("writeCompanyActivityEntries", () => {
	it("is a no-op when given an empty entries array", async () => {
		const createMany = vi.fn();
		await writeCompanyActivityEntries(
			{ companyActivityEntry: { createMany } } as never,
			"c1",
			[],
		);
		expect(createMany).not.toHaveBeenCalled();
	});

	it("maps entries with sensible defaults for missing optional fields", async () => {
		const createMany = vi.fn();
		await writeCompanyActivityEntries(
			{ companyActivityEntry: { createMany } } as never,
			"c1",
			[{ type: "CREATED" }, { type: "NOTE_ADDED", comment: "hi" }],
		);
		expect(createMany).toHaveBeenCalledWith({
			data: [
				{
					companyId: "c1",
					type: "CREATED",
					field: null,
					oldValue: null,
					newValue: null,
					comment: null,
				},
				{
					companyId: "c1",
					type: "NOTE_ADDED",
					field: null,
					oldValue: null,
					newValue: null,
					comment: "hi",
				},
			],
		});
	});
});
