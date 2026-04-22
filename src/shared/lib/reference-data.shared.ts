export type SourceOptionRecord = {
	id: string;
	name: string;
};

export type CurrencyOptionRecord = {
	id: string;
	code: string;
	name: string;
	symbol: string | null;
	isDefault: boolean;
	usdRate: number | null;
	rateSource: string | null;
	lastSyncedAt: Date | null;
};

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
