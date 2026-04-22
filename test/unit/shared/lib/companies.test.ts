import { describe, expect, it } from "vitest";
import { normalizeCompanyName } from "@/shared/lib/companies";

describe("normalizeCompanyName", () => {
	it("lowercases and trims", () => {
		expect(normalizeCompanyName("  Acme Corp ")).toBe("acme corp");
	});

	it("collapses repeated whitespace into a single space", () => {
		expect(normalizeCompanyName("Acme   \t  Corp")).toBe("acme corp");
	});

	it("is idempotent", () => {
		const once = normalizeCompanyName("ACME  CORP");
		expect(normalizeCompanyName(once)).toBe(once);
	});
});
