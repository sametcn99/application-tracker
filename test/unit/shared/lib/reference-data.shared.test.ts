import { describe, expect, it } from "vitest";
import {
	convertViaUsd,
	formatCurrencyOptionLabel,
} from "@/shared/lib/reference-data.shared";

describe("convertViaUsd", () => {
	it("returns the same amount when rates are equal", () => {
		expect(convertViaUsd(100, 1, 1)).toBe(100);
	});

	it("scales the amount via USD pivot", () => {
		// 100 EUR at 1.1 USD/EUR -> 110 USD -> 11000 JPY at 100 USD/JPY
		expect(convertViaUsd(100, 1.1, 0.01)).toBeCloseTo(11_000, 2);
	});
});

describe("formatCurrencyOptionLabel", () => {
	it("combines code and name with separator", () => {
		expect(formatCurrencyOptionLabel({ code: "USD", name: "US Dollar" })).toBe(
			"USD - US Dollar",
		);
	});
});
