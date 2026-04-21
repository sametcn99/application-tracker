import { Flex, Heading } from "@radix-ui/themes";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ApplicationForm } from "@/shared/components/ApplicationForm";
import type {
	EmploymentType,
	Status,
	WorkMode,
} from "@/shared/constants/application";
import { getApplication } from "@/shared/lib/applications";
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
	const [app, tags, sources, currencies] = await Promise.all([
		getApplication(id),
		prisma.tag.findMany({ orderBy: { name: "asc" } }),
		getSourceOptions(),
		getCurrencyOptions(),
	]);
	if (!app) notFound();
	const t = await getTranslations();

	const defaults: Partial<ApplicationFormInput> = {
		company: app.company,
		position: app.position,
		listingDetails: app.listingDetails ?? undefined,
		location: app.location ?? undefined,
		workMode: app.workMode as WorkMode,
		employmentType: app.employmentType as EmploymentType,
		salaryMin: app.salaryMin ?? undefined,
		salaryMax: app.salaryMax ?? undefined,
		currency: app.currency ?? undefined,
		source: app.source ?? undefined,
		jobUrl: app.jobUrl ?? undefined,
		appliedAt: app.appliedAt,
		status: app.status as Status,
		contactName: app.contactName ?? undefined,
		contactEmail: app.contactEmail ?? undefined,
		contactPhone: app.contactPhone ?? undefined,
		notes: app.notes ?? undefined,
		nextStepAt: app.nextStepAt ?? undefined,
		nextStepNote: app.nextStepNote ?? undefined,
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
			/>
		</Flex>
	);
}
