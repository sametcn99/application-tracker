import { Flex, Heading } from "@radix-ui/themes";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ApplicationForm } from "@/app/(app)/applications/components/ApplicationForm";
import type {
	ApplicationMethod,
	CompanySize,
	EmploymentType,
	NextActionType,
	OutcomeReason,
	Priority,
	RelocationPreference,
	SourceType,
	Status,
	WorkMode,
} from "@/shared/constants/application";
import { getApplication } from "@/shared/lib/applications";
import { listCompanyFormOptions } from "@/shared/lib/companies";
import { prisma } from "@/shared/lib/prisma";
import {
	getCurrencyOptions,
	getSourceOptions,
} from "@/shared/lib/reference-data";
import type { ApplicationFormInput } from "@/shared/schemas/application";

export default async function EditApplicationPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [app, tags, sources, currencies, companies] = await Promise.all([
		getApplication(id),
		prisma.tag.findMany({ orderBy: { name: "asc" } }),
		getSourceOptions(),
		getCurrencyOptions(),
		listCompanyFormOptions(),
	]);
	if (!app) notFound();
	const t = await getTranslations();

	const defaults: Partial<ApplicationFormInput> = {
		company: app.company,
		companyId: app.companyId ?? undefined,
		companyWebsite: app.companyRecord?.website ?? undefined,
		companyCareersUrl: app.companyRecord?.careersUrl ?? undefined,
		companyLinkedinUrl: app.companyRecord?.linkedinUrl ?? undefined,
		companyLocation: app.companyRecord?.location ?? undefined,
		position: app.position,
		listingDetails: app.listingDetails ?? undefined,
		location: app.location ?? undefined,
		workMode: app.workMode as WorkMode,
		employmentType: app.employmentType as EmploymentType,
		priority: app.priority as Priority,
		salaryMin: app.salaryMin ?? undefined,
		salaryMax: app.salaryMax ?? undefined,
		targetSalaryMin: app.targetSalaryMin ?? undefined,
		targetSalaryMax: app.targetSalaryMax ?? undefined,
		currency: app.currency ?? undefined,
		source: app.source ?? undefined,
		sourceType: (app.sourceType as SourceType | null) ?? undefined,
		referralName: app.referralName ?? undefined,
		jobUrl: app.jobUrl ?? undefined,
		appliedAt: app.appliedAt,
		status: app.status as Status,
		outcomeReason: (app.outcomeReason as OutcomeReason | null) ?? undefined,
		contactName: app.contactName ?? undefined,
		contactRole: app.contactRole ?? undefined,
		contactEmail: app.contactEmail ?? undefined,
		contactPhone: app.contactPhone ?? undefined,
		contactProfileUrl: app.contactProfileUrl ?? undefined,
		resumeVersion: app.resumeVersion ?? undefined,
		coverLetterVersion: app.coverLetterVersion ?? undefined,
		portfolioUrl: app.portfolioUrl ?? undefined,
		needsSponsorship: app.needsSponsorship ?? undefined,
		relocationPreference:
			(app.relocationPreference as RelocationPreference | null) ?? undefined,
		workAuthorizationNote: app.workAuthorizationNote ?? undefined,
		team: app.team ?? undefined,
		department: app.department ?? undefined,
		companySize: (app.companySize as CompanySize | null) ?? undefined,
		industry: app.industry ?? undefined,
		applicationMethod:
			(app.applicationMethod as ApplicationMethod | null) ?? undefined,
		timezoneOverlapHours: app.timezoneOverlapHours ?? undefined,
		officeDaysPerWeek: app.officeDaysPerWeek ?? undefined,
		notes: app.notes ?? undefined,
		nextStepAt: app.nextStepAt ?? undefined,
		nextStepNote: app.nextStepNote ?? undefined,
		nextActionType: (app.nextActionType as NextActionType | null) ?? undefined,
	};

	return (
		<Flex direction="column" gap="4">
			<Heading size="6">{t("applicationForm.editTitle")}</Heading>
			<ApplicationForm
				mode="edit"
				applicationId={app.id}
				defaultValues={defaults}
				selectedTagIds={app.tags.map((t) => t.tagId)}
				tags={tags}
				sources={sources}
				currencies={currencies}
				companies={companies}
			/>
		</Flex>
	);
}
