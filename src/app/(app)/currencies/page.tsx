import { Container, Flex, Heading, Text } from "@radix-ui/themes";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/shared/lib/prisma";
import { getCurrencyOptions } from "@/shared/lib/reference-data";
import { CurrencyManager } from "./components/CurrencyManager";

export default async function CurrenciesPage() {
	const [t, currencies, applicationCounts] = await Promise.all([
		getTranslations("currencies"),
		getCurrencyOptions(),
		prisma.application.groupBy({
			by: ["currency"],
			where: { currency: { not: null } },
			_count: { _all: true },
		}),
	]);

	const countsByCurrency = new Map(
		applicationCounts.map((entry) => [entry.currency ?? "", entry._count._all]),
	);

	const items = currencies.map((currency) => ({
		...currency,
		applicationsCount: countsByCurrency.get(currency.code) ?? 0,
	}));

	return (
		<Flex direction="column" gap="4">
			<Flex direction="column" gap="1">
				<Heading>{t("title")}</Heading>
				<Text size="2" color="gray">
					{t("subtitle")}
				</Text>
			</Flex>
			<CurrencyManager currencies={items} />
		</Flex>
	);
}
