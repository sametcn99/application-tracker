import { describe, expect, it } from "vitest";
import {
	formatCurrencyAmount,
	formatDate,
	formatDateTime,
	formatRelative,
	formatSalary,
	toDateInput,
	toDateTimeInput,
} from "@/shared/lib/format";

describe("format helpers", () => {
	describe("formatDate", () => {
		it("returns em dash for nullish input", () => {
			expect(formatDate(null)).toBe("—");
			expect(formatDate(undefined)).toBe("—");
		});

		it("formats Date objects in en-US style", () => {
			expect(formatDate(new Date("2026-04-22T00:00:00Z"))).toMatch(
				/22 Apr 2026/,
			);
		});

		it("formats ISO strings", () => {
			expect(formatDate("2026-01-05T12:00:00Z")).toMatch(/05 Jan 2026/);
		});
	});

	describe("formatDateTime", () => {
		it("returns em dash for nullish input", () => {
			expect(formatDateTime(null)).toBe("—");
		});

		it("includes hours and minutes", () => {
			expect(formatDateTime("2026-04-22T09:30:00Z")).toMatch(
				/\d{2} \w{3} 2026 \d{2}:\d{2}/,
			);
		});
	});

	describe("formatRelative", () => {
		it("returns em dash for nullish input", () => {
			expect(formatRelative(null)).toBe("—");
		});

		it("returns a human friendly distance string", () => {
			const result = formatRelative(new Date(Date.now() - 60_000));
			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
			expect(result).not.toBe("—");
		});
	});

	describe("formatSalary", () => {
		it("returns em dash when both values missing", () => {
			expect(formatSalary(null, null, "USD")).toBe("—");
			expect(formatSalary(undefined, undefined, undefined)).toBe("—");
		});

		it("formats range when both bounds set", () => {
			expect(formatSalary(50_000, 90_000, "USD")).toBe("50,000 – 90,000 USD");
		});

		it("formats lower-only with plus suffix", () => {
			expect(formatSalary(50_000, null, "EUR")).toBe("50,000+ EUR");
		});

		it("formats upper-only with leq prefix", () => {
			expect(formatSalary(null, 90_000, "USD")).toBe("≤ 90,000 USD");
		});

		it("trims trailing space when currency missing", () => {
			expect(formatSalary(50_000, 90_000, null)).toBe("50,000 – 90,000");
		});
	});

	describe("formatCurrencyAmount", () => {
		it("returns em dash for nullish amount", () => {
			expect(formatCurrencyAmount(null, "USD")).toBe("—");
			expect(formatCurrencyAmount(undefined, "USD")).toBe("—");
		});

		it("formats USD with currency symbol", () => {
			const result = formatCurrencyAmount(1234.5, "USD");
			expect(result).toMatch(/\$/);
			expect(result).toContain("1,234.5");
		});

		it("falls back to plain number when currency code is invalid", () => {
			const result = formatCurrencyAmount(1000, "ZZZZZ");
			expect(result).toContain("1,000");
		});

		it("defaults to USD when currency missing", () => {
			expect(formatCurrencyAmount(10, null)).toMatch(/\$/);
		});
	});

	describe("toDateInput / toDateTimeInput", () => {
		it("returns empty string for nullish input", () => {
			expect(toDateInput(null)).toBe("");
			expect(toDateTimeInput(undefined)).toBe("");
		});

		it("toDateInput emits yyyy-MM-dd", () => {
			expect(toDateInput("2026-04-22T15:00:00Z")).toMatch(
				/^\d{4}-\d{2}-\d{2}$/,
			);
		});

		it("toDateTimeInput emits yyyy-MM-ddTHH:mm", () => {
			expect(toDateTimeInput("2026-04-22T15:30:00Z")).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
			);
		});
	});
});
