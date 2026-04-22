"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import {
	Box,
	Button,
	Callout,
	Card,
	Flex,
	Grid,
	Heading,
	Select,
	Text,
	TextArea,
	TextField,
} from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { createCompanyAction, updateCompanyAction } from "../actions/companies";
import type { CompanyFormInput } from "../actions/companies.schema";

const NONE_VALUE = "__none__";

const COMPANY_SIZES = [
	"STARTUP",
	"SMALL",
	"MID_SIZE",
	"LARGE",
	"ENTERPRISE",
] as const;
const COMPANY_TYPES = [
	"PUBLIC",
	"PRIVATE",
	"NONPROFIT",
	"GOVERNMENT",
	"STARTUP",
	"SUBSIDIARY",
	"OTHER",
] as const;
const FUNDING_STAGES = [
	"SEED",
	"SERIES_A",
	"SERIES_B",
	"SERIES_C",
	"SERIES_D",
	"LATE_STAGE",
	"IPO",
	"BOOTSTRAPPED",
	"ACQUIRED",
	"UNKNOWN",
] as const;
const REMOTE_POLICIES = [
	"FULLY_REMOTE",
	"HYBRID",
	"ONSITE",
	"FLEXIBLE",
	"UNKNOWN",
] as const;
const HIRING_STATUSES = [
	"ACTIVELY_HIRING",
	"LIMITED",
	"FROZEN",
	"UNKNOWN",
] as const;
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
const TRACKING_STATUSES = [
	"INTERESTED",
	"RESEARCHING",
	"APPLIED",
	"TALKING",
	"ARCHIVED",
] as const;

type Props = {
	mode: "create" | "edit";
	companyId?: string;
	defaultValues?: Partial<CompanyFormInput>;
};

function Field({
	label,
	error,
	full,
	children,
}: {
	label: string;
	error?: string;
	full?: boolean;
	children: React.ReactNode;
}) {
	const content = (
		<Flex direction="column" gap="1">
			<Text size="1" color="gray">
				{label}
			</Text>
			{children}
			{error && (
				<Text size="1" color="red">
					{error}
				</Text>
			)}
		</Flex>
	);
	if (full) return <Box style={{ gridColumn: "1 / -1" }}>{content}</Box>;
	return content;
}

function emptyDefaults(): CompanyFormInput {
	return {
		name: "",
		legalName: "",
		aliases: "",
		description: "",
		tagline: "",
		foundedYear: undefined,
		companyType: "",
		industry: "",
		subIndustry: "",
		companySize: "",
		stockSymbol: "",
		parentCompany: "",
		location: "",
		headquarters: "",
		country: "",
		timezone: "",
		officeLocations: "",
		website: "",
		careersUrl: "",
		linkedinUrl: "",
		twitterUrl: "",
		githubUrl: "",
		glassdoorUrl: "",
		crunchbaseUrl: "",
		blogUrl: "",
		youtubeUrl: "",
		revenue: "",
		fundingStage: "",
		fundingTotal: "",
		valuation: "",
		employeeCount: undefined,
		ceo: "",
		techStack: "",
		benefits: "",
		workCulture: "",
		remotePolicy: "",
		hiringStatus: "",
		glassdoorRating: undefined,
		mainContactName: "",
		mainContactRole: "",
		mainContactEmail: "",
		mainContactPhone: "",
		mainPhone: "",
		mainEmail: "",
		rating: undefined,
		priority: "",
		trackingStatus: "",
		pros: "",
		cons: "",
		notes: "",
	};
}

export function CompanyForm({ mode, companyId, defaultValues }: Props) {
	const router = useRouter();
	const t = useTranslations();
	const tCompanies = useTranslations("companies");
	const tForm = useTranslations("companyForm");
	const tFields = useTranslations("fields");
	const [pending, startTransition] = useTransition();
	const [topError, setTopError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<
		Record<string, string | undefined>
	>({});

	const [values, setValues] = useState<CompanyFormInput>({
		...emptyDefaults(),
		...(defaultValues ?? {}),
	});

	const tx = (key?: string) =>
		!key ? undefined : key.includes(".") ? t(key as never) : key;

	const set = <K extends keyof CompanyFormInput>(
		key: K,
		value: CompanyFormInput[K],
	) => setValues((prev) => ({ ...prev, [key]: value }));

	const setNum = (key: keyof CompanyFormInput, raw: string) => {
		if (raw === "") {
			setValues((prev) => ({ ...prev, [key]: undefined }));
			return;
		}
		const n = Number(raw);
		setValues((prev) => ({
			...prev,
			[key]: Number.isFinite(n) ? n : undefined,
		}));
	};

	const submit = () => {
		setTopError(null);
		setFieldErrors({});
		startTransition(async () => {
			const result =
				mode === "edit" && companyId
					? await updateCompanyAction(companyId, values)
					: await createCompanyAction(values);
			if (!result.ok) {
				if (result.error === "company_exists") {
					setTopError(tCompanies("alreadyExists"));
					return;
				}
				if ("fieldErrors" in result && result.fieldErrors) {
					const errs: Record<string, string | undefined> = {};
					for (const [k, v] of Object.entries(result.fieldErrors)) {
						errs[k] = tx((v as string[] | undefined)?.[0]);
					}
					setFieldErrors(errs);
					return;
				}
				setTopError(t("errors.generic"));
				return;
			}
			router.push(`/companies/${result.id}`);
			router.refresh();
		});
	};

	const renderEnumSelect = (
		key: keyof CompanyFormInput,
		options: readonly string[],
		translateKey: (v: string) => string,
	) => (
		<Select.Root
			value={(values[key] as string) || NONE_VALUE}
			onValueChange={(v) =>
				set(key, (v === NONE_VALUE ? "" : v) as CompanyFormInput[typeof key])
			}
		>
			<Select.Trigger />
			<Select.Content>
				<Select.Item value={NONE_VALUE}>
					{t("applicationForm.notSpecified")}
				</Select.Item>
				{options.map((o) => (
					<Select.Item key={o} value={o}>
						{translateKey(o)}
					</Select.Item>
				))}
			</Select.Content>
		</Select.Root>
	);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<Flex direction="column" gap="4">
				{topError && (
					<Callout.Root color="red">
						<Callout.Icon>
							<ExclamationTriangleIcon />
						</Callout.Icon>
						<Callout.Text>{topError}</Callout.Text>
					</Callout.Root>
				)}

				{/* Identity */}
				<Card>
					<Flex direction="column" gap="3">
						<Heading size="4">{tForm("sections.identity")}</Heading>
						<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
							<Field label={`${tFields("company")} *`} error={fieldErrors.name}>
								<TextField.Root
									value={values.name ?? ""}
									onChange={(e) => set("name", e.target.value)}
									placeholder={tForm("placeholders.name")}
									required
								/>
							</Field>
							<Field label={tFields("legalName")} error={fieldErrors.legalName}>
								<TextField.Root
									value={values.legalName ?? ""}
									onChange={(e) => set("legalName", e.target.value)}
									placeholder={tForm("placeholders.legalName")}
								/>
							</Field>
							<Field label={tFields("aliases")} error={fieldErrors.aliases}>
								<TextField.Root
									value={values.aliases ?? ""}
									onChange={(e) => set("aliases", e.target.value)}
									placeholder={tForm("placeholders.aliases")}
								/>
							</Field>
							<Field label={tFields("tagline")} error={fieldErrors.tagline}>
								<TextField.Root
									value={values.tagline ?? ""}
									onChange={(e) => set("tagline", e.target.value)}
									placeholder={tForm("placeholders.tagline")}
								/>
							</Field>
							<Field
								label={tFields("foundedYear")}
								error={fieldErrors.foundedYear}
							>
								<TextField.Root
									type="number"
									value={
										values.foundedYear === undefined ||
										values.foundedYear === null
											? ""
											: String(values.foundedYear)
									}
									onChange={(e) => setNum("foundedYear", e.target.value)}
									placeholder="2010"
								/>
							</Field>
							<Field
								label={tFields("companyType")}
								error={fieldErrors.companyType}
							>
								{renderEnumSelect("companyType", COMPANY_TYPES, (v) =>
									t(`companyType.${v}` as never),
								)}
							</Field>
							<Field label={tFields("industry")} error={fieldErrors.industry}>
								<TextField.Root
									value={values.industry ?? ""}
									onChange={(e) => set("industry", e.target.value)}
									placeholder={tForm("placeholders.industry")}
								/>
							</Field>
							<Field
								label={tFields("subIndustry")}
								error={fieldErrors.subIndustry}
							>
								<TextField.Root
									value={values.subIndustry ?? ""}
									onChange={(e) => set("subIndustry", e.target.value)}
									placeholder={tForm("placeholders.subIndustry")}
								/>
							</Field>
							<Field
								label={tFields("companySize")}
								error={fieldErrors.companySize}
							>
								{renderEnumSelect("companySize", COMPANY_SIZES, (v) =>
									t(`companySize.${v}` as never),
								)}
							</Field>
							<Field
								label={tFields("stockSymbol")}
								error={fieldErrors.stockSymbol}
							>
								<TextField.Root
									value={values.stockSymbol ?? ""}
									onChange={(e) => set("stockSymbol", e.target.value)}
									placeholder="MSFT"
								/>
							</Field>
							<Field
								label={tFields("parentCompany")}
								error={fieldErrors.parentCompany}
							>
								<TextField.Root
									value={values.parentCompany ?? ""}
									onChange={(e) => set("parentCompany", e.target.value)}
									placeholder={tForm("placeholders.parentCompany")}
								/>
							</Field>
							<Field label={tFields("ceo")} error={fieldErrors.ceo}>
								<TextField.Root
									value={values.ceo ?? ""}
									onChange={(e) => set("ceo", e.target.value)}
									placeholder={tForm("placeholders.ceo")}
								/>
							</Field>
							<Field
								label={tFields("description")}
								error={fieldErrors.description}
								full
							>
								<TextArea
									value={values.description ?? ""}
									onChange={(e) => set("description", e.target.value)}
									placeholder={tForm("placeholders.description")}
									rows={3}
								/>
							</Field>
						</Grid>
					</Flex>
				</Card>

				{/* Location */}
				<Card>
					<Flex direction="column" gap="3">
						<Heading size="4">{tForm("sections.location")}</Heading>
						<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
							<Field
								label={tFields("companyLocation")}
								error={fieldErrors.location}
							>
								<TextField.Root
									value={values.location ?? ""}
									onChange={(e) => set("location", e.target.value)}
									placeholder={tForm("placeholders.location")}
								/>
							</Field>
							<Field
								label={tFields("headquarters")}
								error={fieldErrors.headquarters}
							>
								<TextField.Root
									value={values.headquarters ?? ""}
									onChange={(e) => set("headquarters", e.target.value)}
									placeholder={tForm("placeholders.headquarters")}
								/>
							</Field>
							<Field label={tFields("country")} error={fieldErrors.country}>
								<TextField.Root
									value={values.country ?? ""}
									onChange={(e) => set("country", e.target.value)}
									placeholder={tForm("placeholders.country")}
								/>
							</Field>
							<Field label={tFields("timezone")} error={fieldErrors.timezone}>
								<TextField.Root
									value={values.timezone ?? ""}
									onChange={(e) => set("timezone", e.target.value)}
									placeholder="UTC+3"
								/>
							</Field>
							<Field
								label={tFields("officeLocations")}
								error={fieldErrors.officeLocations}
								full
							>
								<TextArea
									value={values.officeLocations ?? ""}
									onChange={(e) => set("officeLocations", e.target.value)}
									placeholder={tForm("placeholders.officeLocations")}
									rows={3}
								/>
							</Field>
						</Grid>
					</Flex>
				</Card>

				{/* Online presence / Links */}
				<Card>
					<Flex direction="column" gap="3">
						<Heading size="4">{tForm("sections.links")}</Heading>
						<Grid columns={{ initial: "1", sm: "2" }} gap="3">
							<Field
								label={tFields("companyWebsite")}
								error={fieldErrors.website}
							>
								<TextField.Root
									value={values.website ?? ""}
									onChange={(e) => set("website", e.target.value)}
									placeholder={tForm("placeholders.website")}
								/>
							</Field>
							<Field
								label={tFields("companyCareersUrl")}
								error={fieldErrors.careersUrl}
							>
								<TextField.Root
									value={values.careersUrl ?? ""}
									onChange={(e) => set("careersUrl", e.target.value)}
									placeholder={tForm("placeholders.careersUrl")}
								/>
							</Field>
							<Field
								label={tFields("companyLinkedinUrl")}
								error={fieldErrors.linkedinUrl}
							>
								<TextField.Root
									value={values.linkedinUrl ?? ""}
									onChange={(e) => set("linkedinUrl", e.target.value)}
									placeholder={tForm("placeholders.linkedinUrl")}
								/>
							</Field>
							<Field
								label={tFields("twitterUrl")}
								error={fieldErrors.twitterUrl}
							>
								<TextField.Root
									value={values.twitterUrl ?? ""}
									onChange={(e) => set("twitterUrl", e.target.value)}
									placeholder="https://x.com/…"
								/>
							</Field>
							<Field label={tFields("githubUrl")} error={fieldErrors.githubUrl}>
								<TextField.Root
									value={values.githubUrl ?? ""}
									onChange={(e) => set("githubUrl", e.target.value)}
									placeholder="https://github.com/…"
								/>
							</Field>
							<Field
								label={tFields("glassdoorUrl")}
								error={fieldErrors.glassdoorUrl}
							>
								<TextField.Root
									value={values.glassdoorUrl ?? ""}
									onChange={(e) => set("glassdoorUrl", e.target.value)}
									placeholder="https://glassdoor.com/…"
								/>
							</Field>
							<Field
								label={tFields("crunchbaseUrl")}
								error={fieldErrors.crunchbaseUrl}
							>
								<TextField.Root
									value={values.crunchbaseUrl ?? ""}
									onChange={(e) => set("crunchbaseUrl", e.target.value)}
									placeholder="https://crunchbase.com/…"
								/>
							</Field>
							<Field label={tFields("blogUrl")} error={fieldErrors.blogUrl}>
								<TextField.Root
									value={values.blogUrl ?? ""}
									onChange={(e) => set("blogUrl", e.target.value)}
									placeholder="https://blog.example.com"
								/>
							</Field>
							<Field
								label={tFields("youtubeUrl")}
								error={fieldErrors.youtubeUrl}
							>
								<TextField.Root
									value={values.youtubeUrl ?? ""}
									onChange={(e) => set("youtubeUrl", e.target.value)}
									placeholder="https://youtube.com/@…"
								/>
							</Field>
						</Grid>
					</Flex>
				</Card>

				{/* Business */}
				<Card>
					<Flex direction="column" gap="3">
						<Heading size="4">{tForm("sections.business")}</Heading>
						<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
							<Field label={tFields("revenue")} error={fieldErrors.revenue}>
								<TextField.Root
									value={values.revenue ?? ""}
									onChange={(e) => set("revenue", e.target.value)}
									placeholder="$10M-$50M"
								/>
							</Field>
							<Field
								label={tFields("fundingStage")}
								error={fieldErrors.fundingStage}
							>
								{renderEnumSelect("fundingStage", FUNDING_STAGES, (v) =>
									t(`fundingStage.${v}` as never),
								)}
							</Field>
							<Field
								label={tFields("fundingTotal")}
								error={fieldErrors.fundingTotal}
							>
								<TextField.Root
									value={values.fundingTotal ?? ""}
									onChange={(e) => set("fundingTotal", e.target.value)}
									placeholder="$120M"
								/>
							</Field>
							<Field label={tFields("valuation")} error={fieldErrors.valuation}>
								<TextField.Root
									value={values.valuation ?? ""}
									onChange={(e) => set("valuation", e.target.value)}
									placeholder="$1B"
								/>
							</Field>
							<Field
								label={tFields("employeeCount")}
								error={fieldErrors.employeeCount}
							>
								<TextField.Root
									type="number"
									value={
										values.employeeCount === undefined ||
										values.employeeCount === null
											? ""
											: String(values.employeeCount)
									}
									onChange={(e) => setNum("employeeCount", e.target.value)}
									placeholder="500"
								/>
							</Field>
						</Grid>
					</Flex>
				</Card>

				{/* Tech / Culture */}
				<Card>
					<Flex direction="column" gap="3">
						<Heading size="4">{tForm("sections.culture")}</Heading>
						<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
							<Field
								label={tFields("remotePolicy")}
								error={fieldErrors.remotePolicy}
							>
								{renderEnumSelect("remotePolicy", REMOTE_POLICIES, (v) =>
									t(`remotePolicy.${v}` as never),
								)}
							</Field>
							<Field
								label={tFields("hiringStatus")}
								error={fieldErrors.hiringStatus}
							>
								{renderEnumSelect("hiringStatus", HIRING_STATUSES, (v) =>
									t(`hiringStatus.${v}` as never),
								)}
							</Field>
							<Field
								label={tFields("glassdoorRating")}
								error={fieldErrors.glassdoorRating}
							>
								<TextField.Root
									type="number"
									step="0.1"
									value={
										values.glassdoorRating === undefined ||
										values.glassdoorRating === null
											? ""
											: String(values.glassdoorRating)
									}
									onChange={(e) => setNum("glassdoorRating", e.target.value)}
									placeholder="4.2"
								/>
							</Field>
							<Field
								label={tFields("techStack")}
								error={fieldErrors.techStack}
								full
							>
								<TextArea
									value={values.techStack ?? ""}
									onChange={(e) => set("techStack", e.target.value)}
									placeholder={tForm("placeholders.techStack")}
									rows={3}
								/>
							</Field>
							<Field
								label={tFields("benefits")}
								error={fieldErrors.benefits}
								full
							>
								<TextArea
									value={values.benefits ?? ""}
									onChange={(e) => set("benefits", e.target.value)}
									placeholder={tForm("placeholders.benefits")}
									rows={3}
								/>
							</Field>
							<Field
								label={tFields("workCulture")}
								error={fieldErrors.workCulture}
								full
							>
								<TextArea
									value={values.workCulture ?? ""}
									onChange={(e) => set("workCulture", e.target.value)}
									placeholder={tForm("placeholders.workCulture")}
									rows={3}
								/>
							</Field>
						</Grid>
					</Flex>
				</Card>

				{/* Contact */}
				<Card>
					<Flex direction="column" gap="3">
						<Heading size="4">{tForm("sections.contact")}</Heading>
						<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
							<Field
								label={tFields("mainContactName")}
								error={fieldErrors.mainContactName}
							>
								<TextField.Root
									value={values.mainContactName ?? ""}
									onChange={(e) => set("mainContactName", e.target.value)}
								/>
							</Field>
							<Field
								label={tFields("mainContactRole")}
								error={fieldErrors.mainContactRole}
							>
								<TextField.Root
									value={values.mainContactRole ?? ""}
									onChange={(e) => set("mainContactRole", e.target.value)}
								/>
							</Field>
							<Field
								label={tFields("mainContactEmail")}
								error={fieldErrors.mainContactEmail}
							>
								<TextField.Root
									type="email"
									value={values.mainContactEmail ?? ""}
									onChange={(e) => set("mainContactEmail", e.target.value)}
								/>
							</Field>
							<Field
								label={tFields("mainContactPhone")}
								error={fieldErrors.mainContactPhone}
							>
								<TextField.Root
									value={values.mainContactPhone ?? ""}
									onChange={(e) => set("mainContactPhone", e.target.value)}
								/>
							</Field>
							<Field label={tFields("mainPhone")} error={fieldErrors.mainPhone}>
								<TextField.Root
									value={values.mainPhone ?? ""}
									onChange={(e) => set("mainPhone", e.target.value)}
								/>
							</Field>
							<Field label={tFields("mainEmail")} error={fieldErrors.mainEmail}>
								<TextField.Root
									type="email"
									value={values.mainEmail ?? ""}
									onChange={(e) => set("mainEmail", e.target.value)}
								/>
							</Field>
						</Grid>
					</Flex>
				</Card>

				{/* Personal tracking */}
				<Card>
					<Flex direction="column" gap="3">
						<Heading size="4">{tForm("sections.tracking")}</Heading>
						<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
							<Field label={tFields("rating")} error={fieldErrors.rating}>
								<TextField.Root
									type="number"
									min={1}
									max={5}
									value={
										values.rating === undefined || values.rating === null
											? ""
											: String(values.rating)
									}
									onChange={(e) => setNum("rating", e.target.value)}
									placeholder="1-5"
								/>
							</Field>
							<Field label={tFields("priority")} error={fieldErrors.priority}>
								{renderEnumSelect("priority", PRIORITIES, (v) =>
									t(`priority.${v}` as never),
								)}
							</Field>
							<Field
								label={tFields("trackingStatus")}
								error={fieldErrors.trackingStatus}
							>
								{renderEnumSelect("trackingStatus", TRACKING_STATUSES, (v) =>
									t(`trackingStatus.${v}` as never),
								)}
							</Field>
							<Field label={tFields("pros")} error={fieldErrors.pros} full>
								<TextArea
									value={values.pros ?? ""}
									onChange={(e) => set("pros", e.target.value)}
									placeholder={tForm("placeholders.pros")}
									rows={3}
								/>
							</Field>
							<Field label={tFields("cons")} error={fieldErrors.cons} full>
								<TextArea
									value={values.cons ?? ""}
									onChange={(e) => set("cons", e.target.value)}
									placeholder={tForm("placeholders.cons")}
									rows={3}
								/>
							</Field>
						</Grid>
					</Flex>
				</Card>

				{/* Notes */}
				<Card>
					<Flex direction="column" gap="3">
						<Heading size="4">{tForm("sections.notes")}</Heading>
						<Field label={tFields("notes")} error={fieldErrors.notes}>
							<TextArea
								value={values.notes ?? ""}
								onChange={(e) => set("notes", e.target.value)}
								placeholder={tForm("placeholders.notes")}
								rows={6}
							/>
						</Field>
					</Flex>
				</Card>

				<Flex gap="3" justify="end">
					<Button
						type="button"
						variant="soft"
						onClick={() => router.back()}
						disabled={pending}
					>
						{t("common.cancel")}
					</Button>
					<Button type="submit" disabled={pending}>
						{pending
							? t("applicationForm.saving")
							: mode === "edit"
								? t("applicationForm.saveUpdate")
								: t("applicationForm.saveCreate")}
					</Button>
				</Flex>
			</Flex>
		</form>
	);
}
