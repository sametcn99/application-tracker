import { Theme } from "@radix-ui/themes";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "@radix-ui/themes/styles.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("metadata");
	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<body>
				<NextIntlClientProvider messages={messages} locale={locale}>
					<Theme
						appearance="dark"
						accentColor="indigo"
						grayColor="slate"
						radius="medium"
						scaling="100%"
					>
						{children}
					</Theme>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
