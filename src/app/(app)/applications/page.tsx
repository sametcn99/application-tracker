import { PlusIcon } from "@radix-ui/react-icons";
import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buildWhere, listApplications } from "@/shared/lib/applications";
import { parseFilters } from "@/shared/lib/parseFilters";
import { prisma } from "@/shared/lib/prisma";
import { ApplicationsTable } from "./components/ApplicationsTable";
import { FiltersBar } from "./components/FiltersBar";

export default async function ApplicationsPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const t = await getTranslations();
	const sp = await searchParams;
	const filters = parseFilters(sp);

	const where = buildWhere(filters);
	const [items, totalCount, tags] = await Promise.all([
		listApplications(filters),
		prisma.application.count({ where }),
		prisma.tag.findMany({ orderBy: { name: "asc" } }),
	]);

	return (
		<Flex direction="column" gap="4">
			<Flex justify="between" align="center">
				<Flex direction="column">
					<Heading size="6">{t("applications.title")}</Heading>
					<Text size="2" color="gray">
						{t("applications.recordCount", { count: totalCount })}
					</Text>
				</Flex>
				<Button asChild>
					<Link href="/applications/new">
						<PlusIcon /> {t("applications.newApplication")}
					</Link>
				</Button>
			</Flex>

			<FiltersBar tags={tags} />
			<ApplicationsTable initialItems={items} filters={filters} />
		</Flex>
	);
}
