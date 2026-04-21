import { cache } from "react";
import { normalizeCurrencyCode } from "./currencies";
import { prisma } from "./prisma";

const DEFAULT_SOURCES = ["LinkedIn", "Indeed"] as const;

const DEFAULT_CURRENCIES = [
	{
		code: "USD",
		name: "US Dollar",
		symbol: "$",
		usdRate: 1,
		rateSource: "default",
	},
] as const;

export type SourceOptionRecord = {
	id: string;
	name: string;
};

export type CurrencyOptionRecord = {
	id: string;
	code: string;
	name: string;
	symbol: string | null;
	usdRate: number | null;
	rateSource: string | null;
	lastSyncedAt: Date | null;
};

export async function ensureDefaultReferenceData(): Promise<void> {
	for (const name of DEFAULT_SOURCES) {
		await prisma.sourceOption.upsert({
			where: { name },
			update: {},
			create: { name },
		});
	}

	for (const currency of DEFAULT_CURRENCIES) {
		await prisma.currencyOption.upsert({
			where: { code: currency.code },
			update: currency,
			create: currency,
		});
	}
}

export const getSourceOptions = cache(
	async (): Promise<SourceOptionRecord[]> => {
		await ensureDefaultReferenceData();

		return prisma.sourceOption.findMany({
			orderBy: { name: "asc" },
		});
	},
);

export const getCurrencyOptions = cache(
	async (): Promise<CurrencyOptionRecord[]> => {
		await ensureDefaultReferenceData();

		const currencies = await prisma.currencyOption.findMany({
			orderBy: { code: "asc" },
		});

		return currencies.map((currency) => ({
			id: currency.id,
			code: currency.code,
			name: currency.name,
			symbol: currency.symbol,
			usdRate: currency.usdRate ? Number(currency.usdRate) : null,
			rateSource: currency.rateSource,
			lastSyncedAt: currency.lastSyncedAt,
		}));
	},
);

export async function fetchUsdRateForCurrency(
	code: string,
): Promise<number | null> {
	const normalizedCode = normalizeCurrencyCode(code);

	if (normalizedCode === "USD") {
		return 1;
	}

	try {
		const response = await fetch(
			`https://api.frankfurter.app/latest?from=${encodeURIComponent(normalizedCode)}&to=USD`,
			{ cache: "no-store" },
		);

		if (!response.ok) {
			return null;
		}

		const payload = (await response.json()) as {
			rates?: Record<string, number>;
		};
		const rate = Number(payload.rates?.USD);
		return Number.isFinite(rate) && rate > 0 ? rate : null;
	} catch {
		return null;
	}
}

export function convertViaUsd(
	amount: number,
	fromUsdRate: number,
	toUsdRate: number,
): number {
	return (amount * fromUsdRate) / toUsdRate;
}

export function formatCurrencyOptionLabel(
	currency: Pick<CurrencyOptionRecord, "code" | "name">,
): string {
	return `${currency.code} - ${currency.name}`;
}
