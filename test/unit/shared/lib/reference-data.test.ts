import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
	sourceOption: {
		upsert: vi.fn(),
		findMany: vi.fn(),
	},
	currencyOption: {
		upsert: vi.fn(),
		findMany: vi.fn(),
		count: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("@/shared/lib/prisma", () => ({ prisma }));

import {
	ensureDefaultReferenceData,
	fetchUsdRateForCurrency,
	getCurrencyOptions,
	getSourceOptions,
} from "@/shared/lib/reference-data";

describe("ensureDefaultReferenceData", () => {
	beforeEach(() => vi.clearAllMocks());

	it("seeds default sources, default currency, and marks USD default when none exists", async () => {
		prisma.currencyOption.count.mockResolvedValueOnce(0);
		await ensureDefaultReferenceData();
		expect(prisma.sourceOption.upsert).toHaveBeenCalledTimes(2);
		const sourceNames = prisma.sourceOption.upsert.mock.calls.map(
			(c) => c[0].where.name,
		);
		expect(sourceNames).toEqual(expect.arrayContaining(["LinkedIn", "Indeed"]));
		expect(prisma.currencyOption.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ where: { code: "USD" } }),
		);
		expect(prisma.currencyOption.update).toHaveBeenCalledWith({
			where: { code: "USD" },
			data: { isDefault: true },
		});
	});

	it("does not promote USD when a default already exists", async () => {
		prisma.currencyOption.count.mockResolvedValueOnce(1);
		await ensureDefaultReferenceData();
		expect(prisma.currencyOption.update).not.toHaveBeenCalled();
	});
});

describe("getSourceOptions", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns sources sorted by name (after ensuring defaults)", async () => {
		prisma.currencyOption.count.mockResolvedValueOnce(1);
		prisma.sourceOption.findMany.mockResolvedValueOnce([
			{ id: "1", name: "Indeed" },
			{ id: "2", name: "LinkedIn" },
		]);
		const out = await getSourceOptions();
		expect(out).toHaveLength(2);
		expect(prisma.sourceOption.findMany).toHaveBeenCalledWith({
			orderBy: { name: "asc" },
		});
	});
});

describe("getCurrencyOptions", () => {
	beforeEach(() => vi.clearAllMocks());

	it("maps decimal usdRate values to numbers and preserves nulls", async () => {
		prisma.currencyOption.count.mockResolvedValueOnce(1);
		prisma.currencyOption.findMany.mockResolvedValueOnce([
			{
				id: "1",
				code: "USD",
				name: "US Dollar",
				symbol: "$",
				isDefault: true,
				usdRate: { toString: () => "1" },
				rateSource: "default",
				lastSyncedAt: null,
			},
			{
				id: "2",
				code: "EUR",
				name: "Euro",
				symbol: "€",
				isDefault: false,
				usdRate: null,
				rateSource: "manual",
				lastSyncedAt: null,
			},
		]);
		const out = await getCurrencyOptions();
		expect(out[0].usdRate).toBe(1);
		expect(out[1].usdRate).toBeNull();
	});
});

describe("fetchUsdRateForCurrency", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllGlobals();
	});

	it("short-circuits to 1 for USD", async () => {
		await expect(fetchUsdRateForCurrency("usd")).resolves.toBe(1);
	});

	it("returns the API rate for non-USD currencies", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ rates: { USD: 1.07 } }),
		});
		vi.stubGlobal("fetch", fetchMock);
		await expect(fetchUsdRateForCurrency("EUR")).resolves.toBe(1.07);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("from=EUR"),
			expect.objectContaining({ cache: "no-store" }),
		);
	});

	it("returns null when the API responds non-OK", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
		);
		await expect(fetchUsdRateForCurrency("EUR")).resolves.toBeNull();
	});

	it("returns null when fetch throws", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
		await expect(fetchUsdRateForCurrency("EUR")).resolves.toBeNull();
	});

	it("returns null when the rate is non-finite or non-positive", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ rates: { USD: 0 } }),
			}),
		);
		await expect(fetchUsdRateForCurrency("EUR")).resolves.toBeNull();
	});
});
