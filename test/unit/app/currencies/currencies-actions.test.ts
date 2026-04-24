import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
	currencyOption: {
		count: vi.fn(),
		upsert: vi.fn(),
		findUnique: vi.fn(),
		updateMany: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
	$transaction: vi.fn(async (ops: unknown[]) =>
		Promise.all(ops as Promise<unknown>[]),
	),
}));
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
const ref = vi.hoisted(() => ({ fetchUsdRateForCurrency: vi.fn() }));

vi.mock("@/shared/lib/prisma", () => ({ prisma }));
vi.mock("next/cache", () => cache);
vi.mock("@/shared/lib/reference-data", () => ref);

import {
	createCurrencyAction,
	deleteCurrencyAction,
	setDefaultCurrencyAction,
} from "@/app/(app)/currencies/actions/currencies";

function fd(values: Record<string, string>) {
	const f = new FormData();
	// Ensure optional string fields are present (FormData.get returns null otherwise,
	// which zod string() rejects). The source schema's preprocess on manualUsdRate
	// already handles "" but symbol does not.
	f.set("symbol", "");
	f.set("manualUsdRate", "");
	for (const [k, v] of Object.entries(values)) f.set(k, v);
	return f;
}

describe("currencies actions", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns validation error on missing fields", async () => {
		const res = await createCurrencyAction(fd({ code: "", name: "" }));
		expect(res.ok).toBe(false);
		expect((res as { error: string }).error).toMatch(/validation/);
	});

	it("creates with USD shortcut and marks as default when none exists", async () => {
		prisma.currencyOption.count.mockResolvedValueOnce(0);
		prisma.currencyOption.upsert.mockResolvedValueOnce({
			id: "1",
			code: "USD",
			name: "US Dollar",
			symbol: null,
			isDefault: true,
			usdRate: 1,
			rateSource: "default",
			lastSyncedAt: null,
		});
		const res = await createCurrencyAction(
			fd({ code: " usd ", name: "US Dollar" }),
		);
		expect(res).toEqual({
			ok: true,
			data: {
				id: "1",
				code: "USD",
				name: "US Dollar",
				symbol: null,
				isDefault: true,
				usdRate: 1,
				rateSource: "default",
				lastSyncedAt: null,
			},
		});
		expect(ref.fetchUsdRateForCurrency).not.toHaveBeenCalled();
		const call = prisma.currencyOption.upsert.mock.calls[0][0];
		expect(call.where).toEqual({ code: "USD" });
		expect(call.create.isDefault).toBe(true);
		expect(call.create.usdRate).toBe(1);
		expect(call.create.rateSource).toBe("default");
	});

	it("uses API rate when available for non-USD currency", async () => {
		prisma.currencyOption.count.mockResolvedValueOnce(1);
		ref.fetchUsdRateForCurrency.mockResolvedValueOnce(1.1);
		prisma.currencyOption.upsert.mockResolvedValueOnce({ id: "2" });
		await createCurrencyAction(fd({ code: "EUR", name: "Euro" }));
		const call = prisma.currencyOption.upsert.mock.calls[0][0];
		expect(call.create.usdRate).toBe(1.1);
		expect(call.create.rateSource).toBe("api");
		expect(call.create.isDefault).toBe(false);
		expect(call.create.lastSyncedAt).toBeInstanceOf(Date);
	});

	it("falls back to manual rate when API returns null", async () => {
		prisma.currencyOption.count.mockResolvedValueOnce(1);
		ref.fetchUsdRateForCurrency.mockResolvedValueOnce(null);
		prisma.currencyOption.upsert.mockResolvedValueOnce({ id: "3" });
		await createCurrencyAction(
			fd({ code: "TRY", name: "Lira", manualUsdRate: "0.03" }),
		);
		const call = prisma.currencyOption.upsert.mock.calls[0][0];
		expect(call.create.usdRate).toBe(0.03);
		expect(call.create.rateSource).toBe("manual");
		expect(call.create.lastSyncedAt).toBeNull();
	});

	it("returns manualRateRequired when no rate is available at all", async () => {
		prisma.currencyOption.count.mockResolvedValueOnce(1);
		ref.fetchUsdRateForCurrency.mockResolvedValueOnce(null);
		const res = await createCurrencyAction(fd({ code: "ZZZ", name: "Zee" }));
		expect(res).toEqual({
			ok: false,
			error: "currencies.manualRateRequired",
		});
		expect(prisma.currencyOption.upsert).not.toHaveBeenCalled();
	});

	it("setDefaultCurrencyAction returns generic error when not found", async () => {
		prisma.currencyOption.findUnique.mockResolvedValueOnce(null);
		const res = await setDefaultCurrencyAction("missing");
		expect(res).toEqual({ ok: false, error: "errors.generic" });
	});

	it("setDefaultCurrencyAction toggles default flag in a transaction", async () => {
		prisma.currencyOption.findUnique.mockResolvedValueOnce({ id: "x" });
		prisma.currencyOption.updateMany.mockResolvedValueOnce({});
		prisma.currencyOption.update.mockResolvedValueOnce({});
		const res = await setDefaultCurrencyAction("x");
		expect(res).toEqual({ ok: true });
		expect(prisma.$transaction).toHaveBeenCalled();
	});

	it("deleteCurrencyAction calls prisma.delete and revalidates", async () => {
		prisma.currencyOption.delete.mockResolvedValueOnce({});
		await deleteCurrencyAction("id1");
		expect(prisma.currencyOption.delete).toHaveBeenCalledWith({
			where: { id: "id1" },
		});
		expect(cache.revalidatePath).toHaveBeenCalledWith("/currencies");
	});
});
