import { Flex, Heading } from "@radix-ui/themes";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCompany } from "@/shared/lib/companies";
import { CompanyForm } from "../../components/CompanyForm";

export default async function EditCompanyPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const company = await getCompany(id);
	if (!company) notFound();

	const t = await getTranslations("companies");
	const c = company as unknown as Record<string, unknown>;
	const s = (k: string) => (c[k] == null ? "" : String(c[k]));
	const n = (k: string) =>
		c[k] == null || c[k] === "" ? undefined : Number(c[k]);

	return (
		<Flex direction="column" gap="4">
			<Heading>{t("editTitle")}</Heading>
			<CompanyForm
				mode="edit"
				companyId={company.id}
				defaultValues={{
					name: company.name,
					legalName: s("legalName"),
					aliases: s("aliases"),
					description: s("description"),
					tagline: s("tagline"),
					foundedYear: n("foundedYear"),
					companyType: s("companyType") as never,
					industry: s("industry"),
					subIndustry: s("subIndustry"),
					companySize: s("companySize") as never,
					stockSymbol: s("stockSymbol"),
					parentCompany: s("parentCompany"),
					location: s("location"),
					headquarters: s("headquarters"),
					country: s("country"),
					timezone: s("timezone"),
					officeLocations: s("officeLocations"),
					website: s("website"),
					careersUrl: s("careersUrl"),
					linkedinUrl: s("linkedinUrl"),
					twitterUrl: s("twitterUrl"),
					githubUrl: s("githubUrl"),
					glassdoorUrl: s("glassdoorUrl"),
					crunchbaseUrl: s("crunchbaseUrl"),
					blogUrl: s("blogUrl"),
					youtubeUrl: s("youtubeUrl"),
					revenue: s("revenue"),
					fundingStage: s("fundingStage") as never,
					fundingTotal: s("fundingTotal"),
					valuation: s("valuation"),
					employeeCount: n("employeeCount"),
					ceo: s("ceo"),
					techStack: s("techStack"),
					benefits: s("benefits"),
					workCulture: s("workCulture"),
					remotePolicy: s("remotePolicy") as never,
					hiringStatus: s("hiringStatus") as never,
					glassdoorRating: n("glassdoorRating"),
					mainContactName: s("mainContactName"),
					mainContactRole: s("mainContactRole"),
					mainContactEmail: s("mainContactEmail"),
					mainContactPhone: s("mainContactPhone"),
					mainPhone: s("mainPhone"),
					mainEmail: s("mainEmail"),
					rating: n("rating"),
					priority: s("priority") as never,
					trackingStatus: s("trackingStatus") as never,
					pros: s("pros"),
					cons: s("cons"),
					notes: s("notes"),
				}}
			/>
		</Flex>
	);
}
