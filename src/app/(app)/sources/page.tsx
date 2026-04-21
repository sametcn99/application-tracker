import { Container, Flex, Heading, Text } from "@radix-ui/themes";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/shared/lib/prisma";
import { getSourceOptions } from "@/shared/lib/reference-data";
import { SourceManager } from "./components/SourceManager";

export default async function SourcesPage() {
	const [t, sources, applicationCounts] = await Promise.all([
		getTranslations("sources"),
		getSourceOptions(),
		prisma.application.groupBy({
			by: ["source"],
			where: { source: { not: null } },
			_count: { _all: true },
		}),
	]);

	const countsBySource = new Map(
		applicationCounts.map((entry) => [entry.source ?? "", entry._count._all]),
	);

	const items = sources.map((source) => ({
		id: source.id,
		name: source.name,
		applicationsCount: countsBySource.get(source.name) ?? 0,
	}));

	return (
		<Container size="3">
			<Flex direction="column" gap="4">
				<Flex direction="column" gap="1">
					<Heading>{t("title")}</Heading>
					<Text size="2" color="gray">
						{t("subtitle")}
					</Text>
				</Flex>
				<SourceManager sources={items} />
			</Flex>
		</Container>
	);
}
