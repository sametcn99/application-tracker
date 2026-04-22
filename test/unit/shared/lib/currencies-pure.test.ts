import { describe, expect, it } from "vitest";
import {
	convertAmountWithUsd,
	formatCurrencyValue,
	normalizeCurrencyCode,
} from "@/shared/lib/currencies";

describe("normalizeCurrencyCode", () => {
	it("trims and uppercases", () => {
		expect(normalizeCurrencyCode("  usd ")).toBe("USD");
		expect(normalizeCurrencyCode("eur")).toBe("EUR");
	});
});

describe("convertAmountWithUsd", () => {
	it("returns the input when target rate is invalid or zero", () => {
		expect(convertAmountWithUsd(100, 1, 0)).toBe(100);
		expect(convertAmountWithUsd(100, 1, Number.POSITIVE_INFINITY)).toBe(100);
		expect(convertAmountWithUsd(100, Number.NaN, 1)).toBe(100);
	});

	it("converts via USD when both rates are valid", () => {
		// 100 EUR (rate 1.1) → USD → TRY (rate 0.05): 100 * 1.1 / 0.05 = 2200
		expect(convertAmountWithUsd(100, 1.1, 0.05)).toBeCloseTo(2200);
	});

	it("returns 0 when amount is 0", () => {
		expect(convertAmountWithUsd(0, 1, 1)).toBe(0);
	});
});

describe("formatCurrencyValue", () => {
	it("formats with the given currency symbol", () => {
		const out = formatCurrencyValue(1500, "USD");
		expect(out).toMatch(/\$/);
		expect(out).toContain("1,500");
	});

	it("falls back to a plain number + code when currency code is invalid", () => {
		const out = formatCurrencyValue(1500, "ZZZ-INVALID");
		expect(out).toContain("1,500");
		expect(out).toContain("ZZZ-INVALID");
	});

	it("respects maximumFractionDigits", () => {
		const out = formatCurrencyValue(1500.456, "USD", 2);
		expect(out).toMatch(/1,500\.46/);
	});
});
