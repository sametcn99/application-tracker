import "server-only";
import type { Prisma } from "@prisma/client";
import { diffApplication, writeActivityEntries } from "./audit";
import {
	type CompanyAuditEntry,
	diffCompany,
	writeCompanyActivityEntries,
} from "./company-audit";
import { prisma } from "./prisma";

export type CompanyProfileInput = {
	name: string;
	legalName?: string | null;
	aliases?: string | null;
	description?: string | null;
	tagline?: string | null;
	foundedYear?: number | null;
	companyType?: string | null;
	industry?: string | null;
	subIndustry?: string | null;
	companySize?: string | null;
	stockSymbol?: string | null;
	parentCompany?: string | null;
	location?: string | null;
	headquarters?: string | null;
	country?: string | null;
	timezone?: string | null;
	officeLocations?: string | null;
	website?: string | null;
	careersUrl?: string | null;
	linkedinUrl?: string | null;
	twitterUrl?: string | null;
	githubUrl?: string | null;
	glassdoorUrl?: string | null;
	crunchbaseUrl?: string | null;
	blogUrl?: string | null;
	youtubeUrl?: string | null;
	revenue?: string | null;
	fundingStage?: string | null;
	fundingTotal?: string | null;
	valuation?: string | null;
	employeeCount?: number | null;
	ceo?: string | null;
	techStack?: string | null;
	benefits?: string | null;
	workCulture?: string | null;
	remotePolicy?: string | null;
	hiringStatus?: string | null;
	glassdoorRating?: number | null;
	mainContactName?: string | null;
	mainContactRole?: string | null;
	mainContactEmail?: string | null;
	mainContactPhone?: string | null;
	mainPhone?: string | null;
	mainEmail?: string | null;
	rating?: number | null;
	priority?: string | null;
	trackingStatus?: string | null;
	pros?: string | null;
	cons?: string | null;
	notes?: string | null;
};

export function normalizeCompanyName(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function emptyToNull<T extends string | null | undefined>(v: T): string | null {
	if (v === null || v === undefined) return null;
	const trimmed = String(v).trim();
	return trimmed === "" ? null : trimmed;
}

function nullableNumber(v: number | null | undefined): number | null {
	if (v === null || v === undefined) return null;
	if (Number.isNaN(v)) return null;
	return v;
}

function toCompanyData(input: CompanyProfileInput) {
	return {
		name: input.name.trim(),
		normalizedName: normalizeCompanyName(input.name),
		legalName: emptyToNull(input.legalName),
		aliases: emptyToNull(input.aliases),
		description: emptyToNull(input.description),
		tagline: emptyToNull(input.tagline),
		foundedYear: nullableNumber(input.foundedYear),
		companyType: emptyToNull(input.companyType),
		industry: emptyToNull(input.industry),
		subIndustry: emptyToNull(input.subIndustry),
		companySize: emptyToNull(input.companySize),
		stockSymbol: emptyToNull(input.stockSymbol),
		parentCompany: emptyToNull(input.parentCompany),
		location: emptyToNull(input.location),
		headquarters: emptyToNull(input.headquarters),
		country: emptyToNull(input.country),
		timezone: emptyToNull(input.timezone),
		officeLocations: emptyToNull(input.officeLocations),
		website: emptyToNull(input.website),
		careersUrl: emptyToNull(input.careersUrl),
		linkedinUrl: emptyToNull(input.linkedinUrl),
		twitterUrl: emptyToNull(input.twitterUrl),
		githubUrl: emptyToNull(input.githubUrl),
		glassdoorUrl: emptyToNull(input.glassdoorUrl),
		crunchbaseUrl: emptyToNull(input.crunchbaseUrl),
		blogUrl: emptyToNull(input.blogUrl),
		youtubeUrl: emptyToNull(input.youtubeUrl),
		revenue: emptyToNull(input.revenue),
		fundingStage: emptyToNull(input.fundingStage),
		fundingTotal: emptyToNull(input.fundingTotal),
		valuation: emptyToNull(input.valuation),
		employeeCount: nullableNumber(input.employeeCount),
		ceo: emptyToNull(input.ceo),
		techStack: emptyToNull(input.techStack),
		benefits: emptyToNull(input.benefits),
		workCulture: emptyToNull(input.workCulture),
		remotePolicy: emptyToNull(input.remotePolicy),
		hiringStatus: emptyToNull(input.hiringStatus),
		glassdoorRating: nullableNumber(input.glassdoorRating),
		mainContactName: emptyToNull(input.mainContactName),
		mainContactRole: emptyToNull(input.mainContactRole),
		mainContactEmail: emptyToNull(input.mainContactEmail),
		mainContactPhone: emptyToNull(input.mainContactPhone),
		mainPhone: emptyToNull(input.mainPhone),
		mainEmail: emptyToNull(input.mainEmail),
		rating: nullableNumber(input.rating),
		priority: emptyToNull(input.priority),
		trackingStatus: emptyToNull(input.trackingStatus),
		pros: emptyToNull(input.pros),
		cons: emptyToNull(input.cons),
		notes: emptyToNull(input.notes),
	};
}

type SyncedApplicationSnapshot = {
	id: string;
	company: string;
	industry: string | null;
	companySize: string | null;
};

async function syncCompanyFieldsToApplications(
	tx: Prisma.TransactionClient,
	companyId: string,
	company: {
		name: string;
		industry: string | null;
		companySize: string | null;
	},
) {
	const linkedApplications = await tx.application.findMany({
		where: { companyId },
		select: {
			id: true,
			company: true,
			industry: true,
			companySize: true,
		},
	});

	for (const application of linkedApplications as SyncedApplicationSnapshot[]) {
		const next = {
			...application,
			company: company.name,
			industry: company.industry,
			companySize: company.companySize,
		};
		const entries = diffApplication(
			application as unknown as Record<string, unknown>,
			next as Record<string, unknown>,
		);
		if (entries.length === 0) continue;

		await tx.application.update({
			where: { id: application.id },
			data: {
				company: company.name,
				industry: company.industry,
				companySize: company.companySize,
			},
		});
		await writeActivityEntries(tx, application.id, entries);
	}
}

export async function listCompanies() {
	return prisma.company.findMany({
		orderBy: { name: "asc" },
		include: {
			_count: { select: { applications: true } },
		},
	});
}

export async function listCompanyFormOptions() {
	return prisma.company.findMany({
		orderBy: { name: "asc" },
		select: {
			id: true,
			name: true,
			normalizedName: true,
			website: true,
			careersUrl: true,
			linkedinUrl: true,
			location: true,
			industry: true,
			companySize: true,
		},
	});
}

export async function searchCompanies(query: string, limit = 10) {
	const q = query.trim();
	if (!q) {
		return prisma.company.findMany({
			orderBy: { name: "asc" },
			take: limit,
		});
	}
	return prisma.company.findMany({
		where: {
			OR: [
				{ name: { contains: q, mode: "insensitive" } },
				{ normalizedName: { contains: normalizeCompanyName(q) } },
			],
		},
		orderBy: { name: "asc" },
		take: limit,
	});
}

export async function getCompany(id: string) {
	return prisma.company.findUnique({
		where: { id },
		include: {
			applications: {
				orderBy: { appliedAt: "desc" },
				select: {
					id: true,
					position: true,
					status: true,
					appliedAt: true,
					location: true,
				},
			},
			activities: { orderBy: { createdAt: "desc" } },
		},
	});
}

export async function getCompanyByNormalizedName(normalized: string) {
	return prisma.company.findUnique({ where: { normalizedName: normalized } });
}

export async function createCompany(input: CompanyProfileInput) {
	const data = toCompanyData(input);
	return prisma.$transaction(async (tx) => {
		const created = await tx.company.create({ data });
		await writeCompanyActivityEntries(tx, created.id, [{ type: "CREATED" }]);
		return created;
	});
}

export async function updateCompany(id: string, input: CompanyProfileInput) {
	return prisma.$transaction(async (tx) => {
		const prev = await tx.company.findUnique({ where: { id } });
		if (!prev) throw new Error("Company not found");

		const data = toCompanyData(input);
		const next = { ...prev, ...data };
		const entries = diffCompany(
			prev as unknown as Record<string, unknown>,
			next as Record<string, unknown>,
		);

		const updated = await tx.company.update({ where: { id }, data });
		await syncCompanyFieldsToApplications(tx, id, {
			name: updated.name,
			industry: updated.industry,
			companySize: updated.companySize,
		});
		await writeCompanyActivityEntries(tx, id, entries);
		return updated;
	});
}

export async function deleteCompany(id: string) {
	await prisma.company.delete({ where: { id } });
}

export async function addCompanyNote(id: string, note: string) {
	const trimmed = note.trim();
	if (!trimmed) return;
	await prisma.companyActivityEntry.create({
		data: { companyId: id, type: "NOTE_ADDED", comment: trimmed },
	});
}

export type ResolveCompanyInput = {
	companyId?: string | null;
	companyName: string;
	profile?: {
		website?: string | null;
		careersUrl?: string | null;
		linkedinUrl?: string | null;
		location?: string | null;
		industry?: string | null;
		companySize?: string | null;
	};
};

/**
 * Find or create the company that should be linked to an application.
 * - If companyId is provided and exists, returns it (no profile mutation).
 * - Else looks up by normalized name; creates if missing using profile fields.
 * Logs BOOTSTRAPPED_FROM_APPLICATION when a new Company is created from app form data.
 */
export async function resolveCompanyForApplication(
	tx: Prisma.TransactionClient,
	input: ResolveCompanyInput,
): Promise<string> {
	if (input.companyId) {
		const existing = await tx.company.findUnique({
			where: { id: input.companyId },
		});
		if (existing) return existing.id;
	}

	const normalized = normalizeCompanyName(input.companyName);
	if (!normalized) {
		throw new Error("Company name is required");
	}

	const byName = await tx.company.findUnique({
		where: { normalizedName: normalized },
	});
	if (byName) return byName.id;

	const created = await tx.company.create({
		data: {
			name: input.companyName.trim(),
			normalizedName: normalized,
			website: emptyToNull(input.profile?.website),
			careersUrl: emptyToNull(input.profile?.careersUrl),
			linkedinUrl: emptyToNull(input.profile?.linkedinUrl),
			location: emptyToNull(input.profile?.location),
			industry: emptyToNull(input.profile?.industry),
			companySize: emptyToNull(input.profile?.companySize),
		},
	});

	const bootstrap: CompanyAuditEntry[] = [
		{ type: "BOOTSTRAPPED_FROM_APPLICATION" },
	];
	await writeCompanyActivityEntries(tx, created.id, bootstrap);
	return created.id;
}

export async function logCompanyApplicationLink(
	tx: Prisma.TransactionClient,
	companyId: string,
	applicationId: string,
	type: "LINKED_APPLICATION" | "UNLINKED_APPLICATION",
) {
	await writeCompanyActivityEntries(tx, companyId, [
		{ type, comment: applicationId },
	]);
}
