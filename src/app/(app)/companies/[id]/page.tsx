import { Pencil1Icon } from "@radix-ui/react-icons";
import { Badge, Box, Button, Flex, Heading, Tabs } from "@radix-ui/themes";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCompany } from "@/shared/lib/companies";
import { CompanyActivityTimeline } from "./components/CompanyActivityTimeline";
import { CompanyApplicationsList } from "./components/CompanyApplicationsList";
import { CompanyDetails } from "./components/CompanyDetails";
import { DeleteCompanyButton } from "./components/DeleteCompanyButton";

export default async function CompanyDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const company = await getCompany(id);
	if (!company) notFound();

	const [t, tCommon, tAll] = await Promise.all([
		getTranslations("companies"),
		getTranslations("common"),
		getTranslations(),
	]);

	return (
		<Flex direction="column" gap="4">
			<Flex justify="between" align="start" gap="3" wrap="wrap">
				<Flex direction="column" gap="1">
					<Heading>{company.name}</Heading>
					<Flex gap="2" wrap="wrap">
						{company.industry && (
							<Badge variant="soft">{company.industry}</Badge>
						)}
						{company.location && (
							<Badge variant="soft" color="gray">
								{company.location}
							</Badge>
						)}
						{company.companySize && (
							<Badge variant="soft" color="indigo">
								{tAll(("companySize." + company.companySize) as never)}
							</Badge>
						)}
						{company.companyType && (
							<Badge variant="soft" color="amber">
								{tAll(("companyType." + company.companyType) as never)}
							</Badge>
						)}
					</Flex>
				</Flex>
				<Flex gap="2">
					<Button asChild variant="soft">
						<Link href={`/companies/${company.id}/edit`}>
							<Pencil1Icon />
							{tCommon("edit")}
						</Link>
					</Button>
					<DeleteCompanyButton id={company.id} name={company.name} />
				</Flex>
			</Flex>

			<Tabs.Root defaultValue="overview">
				<Tabs.List>
					<Tabs.Trigger value="overview">{t("tabs.overview")}</Tabs.Trigger>
					<Tabs.Trigger value="applications">
						{t("tabs.applications")} ({company.applications.length})
					</Tabs.Trigger>
					<Tabs.Trigger value="activity">{t("tabs.activity")}</Tabs.Trigger>
				</Tabs.List>

				<Box pt="4">
					<Tabs.Content value="overview">
						<CompanyDetails company={company} />
					</Tabs.Content>

					<Tabs.Content value="applications">
						<CompanyApplicationsList
							applications={company.applications.map((a) => ({
								id: a.id,
								position: a.position,
								status: a.status,
								appliedAt: a.appliedAt.toISOString(),
								location: a.location,
							}))}
						/>
					</Tabs.Content>

					<Tabs.Content value="activity">
						<CompanyActivityTimeline
							companyId={company.id}
							activities={company.activities.map((a) => ({
								id: a.id,
								type: a.type,
								field: a.field,
								oldValue: a.oldValue,
								newValue: a.newValue,
								comment: a.comment,
								createdAt: a.createdAt.toISOString(),
							}))}
						/>
					</Tabs.Content>
				</Box>
			</Tabs.Root>
		</Flex>
	);
}
