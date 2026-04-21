export function normalizeCurrencyCode(code: string): string {
	return code.trim().toUpperCase();
}

export function convertAmountWithUsd(
	amount: number,
	fromUsdRate: number,
	toUsdRate: number,
): number {
	if (
		!Number.isFinite(fromUsdRate) ||
		!Number.isFinite(toUsdRate) ||
		toUsdRate <= 0
	) {
		return amount;
	}

	return (amount * fromUsdRate) / toUsdRate;
}

export function formatCurrencyValue(
	amount: number,
	currencyCode: string,
	maximumFractionDigits = 0,
): string {
	const code = normalizeCurrencyCode(currencyCode);

	try {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: code,
			maximumFractionDigits,
		}).format(amount);
	} catch {
		return `${new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(amount)} ${code}`.trim();
	}
}
