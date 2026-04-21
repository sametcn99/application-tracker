import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

export function formatDate(d: Date | string | null | undefined): string {
	if (!d) return "—";
	const date = typeof d === "string" ? new Date(d) : d;
	return format(date, "dd MMM yyyy", { locale: enUS });
}

export function formatDateTime(d: Date | string | null | undefined): string {
	if (!d) return "—";
	const date = typeof d === "string" ? new Date(d) : d;
	return format(date, "dd MMM yyyy HH:mm", { locale: enUS });
}

export function formatRelative(d: Date | string | null | undefined): string {
	if (!d) return "—";
	const date = typeof d === "string" ? new Date(d) : d;
	return formatDistanceToNow(date, { addSuffix: true, locale: enUS });
}

export function formatSalary(
	min: number | null | undefined,
	max: number | null | undefined,
	currency: string | null | undefined,
): string {
	if (min == null && max == null) return "—";
	const cur = currency ?? "";
	const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
	if (min != null && max != null)
		return `${fmt(min)} – ${fmt(max)} ${cur}`.trim();
	if (min != null) return `${fmt(min)}+ ${cur}`.trim();
	return `≤ ${fmt(max!)} ${cur}`.trim();
}

export function formatCurrencyAmount(
	amount: number | null | undefined,
	currency: string | null | undefined,
): string {
	if (amount == null) return "—";

	try {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency ?? "USD",
			maximumFractionDigits: 2,
		}).format(amount);
	} catch {
		return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)} ${currency ?? ""}`.trim();
	}
}

export function toDateInput(d: Date | string | null | undefined): string {
	if (!d) return "";
	const date = typeof d === "string" ? new Date(d) : d;
	return format(date, "yyyy-MM-dd");
}

export function toDateTimeInput(d: Date | string | null | undefined): string {
	if (!d) return "";
	const date = typeof d === "string" ? new Date(d) : d;
	return format(date, "yyyy-MM-dd'T'HH:mm");
}
