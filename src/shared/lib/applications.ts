import type { ApplicationFormValues } from "@/shared/schemas/application";
import {
	type AuditEntry,
	diffApplication,
	diffTags,
	writeActivityEntries,
} from "./audit";
import { prisma } from "./prisma";

export type ListFilters = {
	q?: string;
	status?: string[];
	workMode?: string[];
	priority?: string[];
	source?: string;
	sourceType?: string;
	relocationPreference?: string;
	companySize?: string;
	applicationMethod?: string;
	needsSponsorship?: boolean;
	nextActionType?: string;
	outcomeReason?: string;
	tagIds?: string[];
	from?: Date;
	to?: Date;
	sort?: "appliedAt" | "updatedAt" | "company";
	order?: "asc" | "desc";
};

export function buildWhere(f: ListFilters) {
	const where: Record<string, unknown> = {};
	if (f.q) {
		where.OR = [
			{ company: { contains: f.q } },
			{ position: { contains: f.q } },
			{ location: { contains: f.q } },
			{ source: { contains: f.q } },
			{ referralName: { contains: f.q } },
			{ contactName: { contains: f.q } },
			{ contactRole: { contains: f.q } },
			{ team: { contains: f.q } },
			{ department: { contains: f.q } },
			{ industry: { contains: f.q } },
		];
	}
	if (f.status && f.status.length) where.status = { in: f.status };
	if (f.workMode && f.workMode.length) where.workMode = { in: f.workMode };
	if (f.priority && f.priority.length) where.priority = { in: f.priority };
	if (f.source) where.source = { contains: f.source };
	if (f.sourceType) where.sourceType = f.sourceType;
	if (f.relocationPreference)
		where.relocationPreference = f.relocationPreference;
	if (f.companySize) where.companySize = f.companySize;
	if (f.applicationMethod) where.applicationMethod = f.applicationMethod;
	if (f.needsSponsorship !== undefined)
		where.needsSponsorship = f.needsSponsorship;
	if (f.nextActionType) where.nextActionType = f.nextActionType;
	if (f.outcomeReason) where.outcomeReason = f.outcomeReason;
	if (f.from || f.to) {
		where.appliedAt = {
			...(f.from ? { gte: f.from } : {}),
			...(f.to ? { lte: f.to } : {}),
		};
	}
	if (f.tagIds && f.tagIds.length) {
		where.tags = { some: { tagId: { in: f.tagIds } } };
	}
	return where;
}

export async function listApplications(filters: ListFilters = {}) {
	const where = buildWhere(filters);
	const sort = filters.sort ?? "appliedAt";
	const order = filters.order ?? "desc";

	return prisma.application.findMany({
		where,
		orderBy: { [sort]: order },
		include: {
			tags: { include: { tag: true } },
			_count: { select: { attachments: true, activities: true } },
		},
	});
}

export async function getApplication(id: string) {
	return prisma.application.findUnique({
		where: { id },
		include: {
			tags: { include: { tag: true } },
			attachments: { orderBy: { createdAt: "desc" } },
			activities: { orderBy: { createdAt: "desc" } },
		},
	});
}

function toDbData(values: ApplicationFormValues) {
	return {
		company: values.company,
		position: values.position,
		listingDetails: values.listingDetails ?? null,
		location: values.location ?? null,
		workMode: values.workMode,
		employmentType: values.employmentType,
		priority: values.priority,
		salaryMin: values.salaryMin ?? null,
		salaryMax: values.salaryMax ?? null,
		targetSalaryMin: values.targetSalaryMin ?? null,
		targetSalaryMax: values.targetSalaryMax ?? null,
		currency: values.currency ?? null,
		source: values.source ?? null,
		sourceType: values.sourceType ?? null,
		referralName: values.referralName ?? null,
		jobUrl: values.jobUrl ?? null,
		appliedAt: values.appliedAt,
		status: values.status,
		outcomeReason: values.outcomeReason ?? null,
		contactName: values.contactName ?? null,
		contactRole: values.contactRole ?? null,
		contactEmail: values.contactEmail ?? null,
		contactPhone: values.contactPhone ?? null,
		contactProfileUrl: values.contactProfileUrl ?? null,
		resumeVersion: values.resumeVersion ?? null,
		coverLetterVersion: values.coverLetterVersion ?? null,
		portfolioUrl: values.portfolioUrl ?? null,
		needsSponsorship: values.needsSponsorship ?? null,
		relocationPreference: values.relocationPreference ?? null,
		workAuthorizationNote: values.workAuthorizationNote ?? null,
		team: values.team ?? null,
		department: values.department ?? null,
		companySize: values.companySize ?? null,
		industry: values.industry ?? null,
		applicationMethod: values.applicationMethod ?? null,
		timezoneOverlapHours: values.timezoneOverlapHours ?? null,
		officeDaysPerWeek: values.officeDaysPerWeek ?? null,
		notes: values.notes ?? null,
		nextStepAt: values.nextStepAt ?? null,
		nextStepNote: values.nextStepNote ?? null,
		nextActionType: values.nextActionType ?? null,
	};
}

export async function createApplication(values: ApplicationFormValues) {
	return prisma.$transaction(async (tx) => {
		const app = await tx.application.create({
			data: {
				...toDbData(values),
				tags: {
					create: (values.tagIds ?? []).map((tagId) => ({ tagId })),
				},
			},
		});

		const entries: AuditEntry[] = [{ type: "CREATED" }];
		await writeActivityEntries(tx, app.id, entries);
		return app;
	});
}

export async function updateApplication(
	id: string,
	values: ApplicationFormValues,
) {
	return prisma.$transaction(async (tx) => {
		const prev = await tx.application.findUnique({
			where: { id },
			include: { tags: true },
		});
		if (!prev) throw new Error("Application not found");

		const data = toDbData(values);
		const next = { ...prev, ...data };
		const fieldEntries = diffApplication(
			prev as unknown as Record<string, unknown>,
			next as Record<string, unknown>,
		);

		const prevTagIds = prev.tags.map((t) => t.tagId);
		const nextTagIds = values.tagIds ?? [];
		const tagEntry = diffTags(prevTagIds, nextTagIds);

		const updated = await tx.application.update({
			where: { id },
			data: {
				...data,
				tags: {
					deleteMany: {},
					create: nextTagIds.map((tagId) => ({ tagId })),
				},
			},
		});

		const entries: AuditEntry[] = [...fieldEntries];
		if (tagEntry) entries.push(tagEntry);
		await writeActivityEntries(tx, id, entries);

		return updated;
	});
}

export async function updateStatus(id: string, status: string) {
	return prisma.$transaction(async (tx) => {
		const prev = await tx.application.findUnique({ where: { id } });
		if (!prev) throw new Error("Application not found");
		if (prev.status === status) return prev;

		const updated = await tx.application.update({
			where: { id },
			data: { status },
		});
		await writeActivityEntries(tx, id, [
			{
				type: "STATUS_CHANGE",
				field: "status",
				oldValue: JSON.stringify(prev.status),
				newValue: JSON.stringify(status),
			},
		]);
		return updated;
	});
}

export async function addComment(id: string, comment: string) {
	if (!comment.trim()) return;
	await prisma.activityEntry.create({
		data: { applicationId: id, type: "COMMENT", comment: comment.trim() },
	});
}

export async function deleteApplication(id: string) {
	await prisma.application.delete({ where: { id } });
}
