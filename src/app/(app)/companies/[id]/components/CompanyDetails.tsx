import { Box, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { getTranslations } from "next-intl/server";
import { formatDateTime } from "@/shared/lib/format";

type Company = {
	name: string;
	legalName: string | null;
	aliases: string | null;
	description: string | null;
	tagline: string | null;
	foundedYear: number | null;
	companyType: string | null;
	industry: string | null;
	subIndustry: string | null;
	companySize: string | null;
	stockSymbol: string | null;
	parentCompany: string | null;
	location: string | null;
	headquarters: string | null;
	country: string | null;
	timezone: string | null;
	officeLocations: string | null;
	website: string | null;
	careersUrl: string | null;
	linkedinUrl: string | null;
	twitterUrl: string | null;
	githubUrl: string | null;
	glassdoorUrl: string | null;
	crunchbaseUrl: string | null;
	blogUrl: string | null;
	youtubeUrl: string | null;
	revenue: string | null;
	fundingStage: string | null;
	fundingTotal: string | null;
	valuation: string | null;
	employeeCount: number | null;
	ceo: string | null;
	techStack: string | null;
	benefits: string | null;
	workCulture: string | null;
	remotePolicy: string | null;
	hiringStatus: string | null;
	glassdoorRating: number | null;
	mainContactName: string | null;
	mainContactRole: string | null;
	mainContactEmail: string | null;
	mainContactPhone: string | null;
	mainPhone: string | null;
	mainEmail: string | null;
	rating: number | null;
	priority: string | null;
	trackingStatus: string | null;
	pros: string | null;
	cons: string | null;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
};

function renderLink(url: string | null) {
	if (!url) return "—";
	return (
		<a href={url} target="_blank" rel="noreferrer">
			{url}
		</a>
	);
}

function renderMultiline(value: string | null) {
	if (!value) return "—";
	return <Text style={{ whiteSpace: "pre-wrap" }}>{value}</Text>;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<Box>
			<Text size="1" color="gray">
				{label}
			</Text>
			<Text size="2" style={{ display: "block" }}>
				{value}
			</Text>
		</Box>
	);
}

export async function CompanyDetails({ company }: { company: Company }) {
	const t = await getTranslations();
	const enumValue = (namespace: string, value: string | null) => {
		if (!value) return "—";
		try {
			return t(`${namespace}.${value}` as never);
		} catch {
			return value;
		}
	};

	return (
		<Flex direction="column" gap="4">
			<Card>
				<Heading size="3" mb="2">
					{t("companyForm.sections.identity")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field label={t("fields.company")} value={company.name} />
					<Field
						label={t("fields.legalName")}
						value={company.legalName ?? "—"}
					/>
					<Field label={t("fields.aliases")} value={company.aliases ?? "—"} />
					<Field label={t("fields.tagline")} value={company.tagline ?? "—"} />
					<Field
						label={t("fields.foundedYear")}
						value={
							company.foundedYear == null ? "—" : String(company.foundedYear)
						}
					/>
					<Field
						label={t("fields.companyType")}
						value={enumValue("companyType", company.companyType)}
					/>
					<Field label={t("fields.industry")} value={company.industry ?? "—"} />
					<Field
						label={t("fields.subIndustry")}
						value={company.subIndustry ?? "—"}
					/>
					<Field
						label={t("fields.companySize")}
						value={enumValue("companySize", company.companySize)}
					/>
					<Field
						label={t("fields.stockSymbol")}
						value={company.stockSymbol ?? "—"}
					/>
					<Field
						label={t("fields.parentCompany")}
						value={company.parentCompany ?? "—"}
					/>
					<Field label={t("fields.ceo")} value={company.ceo ?? "—"} />
					<Field
						label={t("fields.description")}
						value={renderMultiline(company.description)}
					/>
				</Grid>
			</Card>

			<Card>
				<Heading size="3" mb="2">
					{t("companyForm.sections.location")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field
						label={t("fields.companyLocation")}
						value={company.location ?? "—"}
					/>
					<Field
						label={t("fields.headquarters")}
						value={company.headquarters ?? "—"}
					/>
					<Field label={t("fields.country")} value={company.country ?? "—"} />
					<Field label={t("fields.timezone")} value={company.timezone ?? "—"} />
					<Field
						label={t("fields.officeLocations")}
						value={renderMultiline(company.officeLocations)}
					/>
				</Grid>
			</Card>

			<Card>
				<Heading size="3" mb="2">
					{t("companyForm.sections.links")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "2" }} gap="3">
					<Field
						label={t("fields.companyWebsite")}
						value={renderLink(company.website)}
					/>
					<Field
						label={t("fields.companyCareersUrl")}
						value={renderLink(company.careersUrl)}
					/>
					<Field
						label={t("fields.companyLinkedinUrl")}
						value={renderLink(company.linkedinUrl)}
					/>
					<Field
						label={t("fields.twitterUrl")}
						value={renderLink(company.twitterUrl)}
					/>
					<Field
						label={t("fields.githubUrl")}
						value={renderLink(company.githubUrl)}
					/>
					<Field
						label={t("fields.glassdoorUrl")}
						value={renderLink(company.glassdoorUrl)}
					/>
					<Field
						label={t("fields.crunchbaseUrl")}
						value={renderLink(company.crunchbaseUrl)}
					/>
					<Field
						label={t("fields.blogUrl")}
						value={renderLink(company.blogUrl)}
					/>
					<Field
						label={t("fields.youtubeUrl")}
						value={renderLink(company.youtubeUrl)}
					/>
				</Grid>
			</Card>

			<Card>
				<Heading size="3" mb="2">
					{t("companyForm.sections.business")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field label={t("fields.revenue")} value={company.revenue ?? "—"} />
					<Field
						label={t("fields.fundingStage")}
						value={enumValue("fundingStage", company.fundingStage)}
					/>
					<Field
						label={t("fields.fundingTotal")}
						value={company.fundingTotal ?? "—"}
					/>
					<Field
						label={t("fields.valuation")}
						value={company.valuation ?? "—"}
					/>
					<Field
						label={t("fields.employeeCount")}
						value={
							company.employeeCount == null
								? "—"
								: String(company.employeeCount)
						}
					/>
				</Grid>
			</Card>

			<Card>
				<Heading size="3" mb="2">
					{t("companyForm.sections.culture")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field
						label={t("fields.remotePolicy")}
						value={enumValue("remotePolicy", company.remotePolicy)}
					/>
					<Field
						label={t("fields.hiringStatus")}
						value={enumValue("hiringStatus", company.hiringStatus)}
					/>
					<Field
						label={t("fields.glassdoorRating")}
						value={
							company.glassdoorRating == null
								? "—"
								: String(company.glassdoorRating)
						}
					/>
					<Field
						label={t("fields.techStack")}
						value={renderMultiline(company.techStack)}
					/>
					<Field
						label={t("fields.benefits")}
						value={renderMultiline(company.benefits)}
					/>
					<Field
						label={t("fields.workCulture")}
						value={renderMultiline(company.workCulture)}
					/>
				</Grid>
			</Card>

			<Card>
				<Heading size="3" mb="2">
					{t("companyForm.sections.contact")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field
						label={t("fields.mainContactName")}
						value={company.mainContactName ?? "—"}
					/>
					<Field
						label={t("fields.mainContactRole")}
						value={company.mainContactRole ?? "—"}
					/>
					<Field
						label={t("fields.mainContactEmail")}
						value={company.mainContactEmail ?? "—"}
					/>
					<Field
						label={t("fields.mainContactPhone")}
						value={company.mainContactPhone ?? "—"}
					/>
					<Field
						label={t("fields.mainPhone")}
						value={company.mainPhone ?? "—"}
					/>
					<Field
						label={t("fields.mainEmail")}
						value={company.mainEmail ?? "—"}
					/>
				</Grid>
			</Card>

			<Card>
				<Heading size="3" mb="2">
					{t("companyForm.sections.tracking")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field
						label={t("fields.rating")}
						value={company.rating == null ? "—" : String(company.rating)}
					/>
					<Field
						label={t("fields.priority")}
						value={enumValue("priority", company.priority)}
					/>
					<Field
						label={t("fields.trackingStatus")}
						value={enumValue("trackingStatus", company.trackingStatus)}
					/>
					<Field
						label={t("fields.pros")}
						value={renderMultiline(company.pros)}
					/>
					<Field
						label={t("fields.cons")}
						value={renderMultiline(company.cons)}
					/>
				</Grid>
			</Card>

			<Card>
				<Heading size="3" mb="2">
					{t("companyForm.sections.notes")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "2" }} gap="3">
					<Field
						label={t("fields.notes")}
						value={renderMultiline(company.notes)}
					/>
					<Field
						label={t("fields.createdAt")}
						value={formatDateTime(company.createdAt)}
					/>
					<Field
						label={t("fields.updatedAt")}
						value={formatDateTime(company.updatedAt)}
					/>
				</Grid>
			</Card>
		</Flex>
	);
}
