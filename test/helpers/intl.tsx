import { Theme } from "@radix-ui/themes";
import { type RenderOptions, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import messages from "../../messages/en.json";

type ProvidersProps = {
	children: ReactNode;
	locale?: "en";
};

export function TestProviders({ children, locale = "en" }: ProvidersProps) {
	return (
		<NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
			<Theme>{children}</Theme>
		</NextIntlClientProvider>
	);
}

export function renderWithProviders(
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
) {
	return render(ui, { wrapper: TestProviders, ...options });
}

export { messages };
