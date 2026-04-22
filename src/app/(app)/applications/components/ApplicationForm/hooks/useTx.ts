"use client";

import { useTranslations } from "next-intl";

/**
 * Translates a key when it looks like an i18n key (contains a dot),
 * otherwise returns the input as-is. Mirrors the behavior of the
 * original ApplicationForm `tx` helper.
 */
export function useTx() {
	const t = useTranslations();
	const tx = (key: string | undefined): string | undefined => {
		if (!key) return undefined;
		if (key.includes(".")) return t(key as never);
		return key;
	};
	return { t, tx };
}
