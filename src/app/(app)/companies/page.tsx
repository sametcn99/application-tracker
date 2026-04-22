import { PlusIcon } from "@radix-ui/react-icons";
import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listCompanies } from "@/shared/lib/companies";
import { CompaniesTable } from "./components/CompaniesTable";

export default async function CompaniesPage() {
	const [t, companies] = await Promise.all([
		getTranslations("companies"),
		listCompanies(),
	]);

	return (
		<Flex direction="column" gap="4">
			<Flex justify="between" align="center" gap="3" wrap="wrap">
				<Flex direction="column" gap="1">
					<Heading>{t("title")}</Heading>
					<Text size="2" color="gray">
						{t("subtitle")}
					</Text>
				</Flex>
				<Button asChild>
					<Link href="/companies/new">
						<PlusIcon />
						{t("newCompany")}
					</Link>
				</Button>
			</Flex>
			<CompaniesTable
				companies={companies.map((c) => ({
					id: c.id,
					name: c.name,
					industry: c.industry,
					location: c.location,
					website: c.website,
					applicationsCount: c._count.applications,
				}))}
			/>
		</Flex>
	);
}
