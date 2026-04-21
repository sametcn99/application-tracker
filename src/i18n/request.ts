import { getRequestConfig } from "next-intl/server";

export const locales = ["en"] as const;
export const defaultLocale = "en" as const;
export type AppLocale = (typeof locales)[number];

export default getRequestConfig(async () => {
	const locale: AppLocale = defaultLocale;
	const messages = (await import(`../../messages/${locale}.json`)).default;
	return {
		locale,
		messages,
		timeZone: "UTC",
	};
});
