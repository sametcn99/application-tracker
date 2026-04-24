import type { ApplicationFormValues } from "@/shared/schemas/application";
import {
	type AuditEntry,
	diffApplication,
	diffTags,
	writeActivityEntries,
} from "./audit";
import {
	logCompanyApplicationLink,
	resolveCompanyForApplication,
} from "./companies";
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

export const APPLICATION_PAGE_SIZE = 20;

export type ApplicationListCursor = {
	sort: NonNullable<ListFilters["sort"]>;
	order: NonNullable<ListFilters["order"]>;
	value: string;
	id: string;
};

export type ApplicationListPage<T> = {
	items: T[];
	nextCursor: string | null;
	hasMore: boolean;
};

type ApplicationSort = ApplicationListCursor["sort"];
type ApplicationOrder = ApplicationListCursor["order"];

function getListSort(filters: ListFilters): ApplicationSort {
	return filters.sort ?? "appliedAt";
}

function getListOrder(filters: ListFilters): ApplicationOrder {
	return filters.order ?? "desc";
}

export function encodeApplicationCursor(cursor: ApplicationListCursor) {
	return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeApplicationCursor(
	cursor?: string | null,
): ApplicationListCursor | null {
	if (!cursor) return null;

	try {
		const parsed = JSON.parse(
			Buffer.from(cursor, "base64url").toString("utf8"),
		) as Partial<ApplicationListCursor>;
		if (
			(parsed.sort === "appliedAt" ||
				parsed.sort === "updatedAt" ||
				parsed.sort === "company") &&
			(parsed.order === "asc" || parsed.order === "desc") &&
			typeof parsed.value === "string" &&
			typeof parsed.id === "string"
		) {
			return parsed as ApplicationListCursor;
		}
	} catch {
		return null;
	}

	return null;
}

function getCursorValue(
	item: { id: string; appliedAt: Date; updatedAt: Date; company: string },
	sort: ApplicationSort,
) {
	const value = item[sort];
	return value instanceof Date ? value.toISOString() : value;
}

function buildCursorWhere(cursor: ApplicationListCursor) {
	const operator = cursor.order === "desc" ? "lt" : "gt";
	const value =
		cursor.sort === "company" ? cursor.value : new Date(cursor.value);

	return {
		OR: [
			{ [cursor.sort]: { [operator]: value } },
			{ [cursor.sort]: value, id: { [operator]: cursor.id } },
		],
	};
}

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
	const sort = getListSort(filters);
	const order = getListOrder(filters);

	return prisma.application.findMany({
		where: buildWhere(filters),
		orderBy: [{ [sort]: order }, { id: order }],
		include: {
			tags: { include: { tag: true } },
			_count: { select: { attachments: true, activities: true } },
		},
	});
}

export async function listApplicationsPage(
	filters: ListFilters = {},
	cursor?: string | null,
	pageSize = APPLICATION_PAGE_SIZE,
) {
	const where = buildWhere(filters);
	const sort = getListSort(filters);
	const order = getListOrder(filters);
	const decodedCursor = decodeApplicationCursor(cursor);
	const cursorWhere =
		decodedCursor?.sort === sort && decodedCursor.order === order
			? buildCursorWhere(decodedCursor)
			: null;
	const pageWhere = cursorWhere ? { AND: [where, cursorWhere] } : where;

	const items = await prisma.application.findMany({
		where: pageWhere,
		take: pageSize + 1,
		orderBy: [{ [sort]: order }, { id: order }],
		include: {
			tags: { include: { tag: true } },
			_count: { select: { attachments: true, activities: true } },
		},
	});

	const hasMore = items.length > pageSize;
	const pageItems = hasMore ? items.slice(0, pageSize) : items;
	const lastItem = pageItems.at(-1);

	return {
		items: pageItems,
		hasMore,
		nextCursor:
			hasMore && lastItem
				? encodeApplicationCursor({
						sort,
						order,
						value: getCursorValue(lastItem, sort),
						id: lastItem.id,
					})
				: null,
	};
}

export async function getApplication(id: string) {
	return prisma.application.findUnique({
		where: { id },
		include: {
			tags: { include: { tag: true } },
			attachments: { orderBy: { createdAt: "desc" } },
			activities: { orderBy: { createdAt: "desc" } },
			companyRecord: true,
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
		const companyId = await resolveCompanyForApplication(tx, {
			companyId: values.companyId ?? null,
			companyName: values.company,
			profile: {
				website: values.companyWebsite ?? null,
				careersUrl: values.companyCareersUrl ?? null,
				linkedinUrl: values.companyLinkedinUrl ?? null,
				location: values.companyLocation ?? null,
				industry: values.industry ?? null,
				companySize: values.companySize ?? null,
			},
		});

		const app = await tx.application.create({
			data: {
				...toDbData(values),
				companyId,
				tags: {
					create: (values.tagIds ?? []).map((tagId) => ({ tagId })),
				},
			},
		});

		const entries: AuditEntry[] = [{ type: "CREATED" }];
		await writeActivityEntries(tx, app.id, entries);
		await logCompanyApplicationLink(
			tx,
			companyId,
			app.id,
			"LINKED_APPLICATION",
		);
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

		const companyId = await resolveCompanyForApplication(tx, {
			companyId: values.companyId ?? null,
			companyName: values.company,
			profile: {
				website: values.companyWebsite ?? null,
				careersUrl: values.companyCareersUrl ?? null,
				linkedinUrl: values.companyLinkedinUrl ?? null,
				location: values.companyLocation ?? null,
				industry: values.industry ?? null,
				companySize: values.companySize ?? null,
			},
		});

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
				companyId,
				tags: {
					deleteMany: {},
					create: nextTagIds.map((tagId) => ({ tagId })),
				},
			},
		});

		const entries: AuditEntry[] = [...fieldEntries];
		if (tagEntry) entries.push(tagEntry);
		await writeActivityEntries(tx, id, entries);

		if (prev.companyId !== companyId) {
			if (prev.companyId) {
				await logCompanyApplicationLink(
					tx,
					prev.companyId,
					id,
					"UNLINKED_APPLICATION",
				);
			}
			await logCompanyApplicationLink(tx, companyId, id, "LINKED_APPLICATION");
		}

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
