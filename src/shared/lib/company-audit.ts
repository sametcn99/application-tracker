import type { Prisma } from "@prisma/client";

export const TRACKED_FIELDS = [
	"name",
	"legalName",
	"aliases",
	"description",
	"tagline",
	"foundedYear",
	"companyType",
	"industry",
	"subIndustry",
	"companySize",
	"stockSymbol",
	"parentCompany",
	"location",
	"headquarters",
	"country",
	"timezone",
	"officeLocations",
	"website",
	"careersUrl",
	"linkedinUrl",
	"twitterUrl",
	"githubUrl",
	"glassdoorUrl",
	"crunchbaseUrl",
	"blogUrl",
	"youtubeUrl",
	"revenue",
	"fundingStage",
	"fundingTotal",
	"valuation",
	"employeeCount",
	"ceo",
	"techStack",
	"benefits",
	"workCulture",
	"remotePolicy",
	"hiringStatus",
	"glassdoorRating",
	"mainContactName",
	"mainContactRole",
	"mainContactEmail",
	"mainContactPhone",
	"mainPhone",
	"mainEmail",
	"rating",
	"priority",
	"trackingStatus",
	"pros",
	"cons",
	"notes",
] as const;

type TrackedField = (typeof TRACKED_FIELDS)[number];

type Comparable = string | number | Date | null | undefined;

function normalize(v: unknown): Comparable {
	if (v === null || v === undefined) return undefined;
	if (v instanceof Date) return v.toISOString();
	return v as Comparable;
}

function encode(v: unknown): string | null {
	if (v === null || v === undefined) return null;
	return JSON.stringify(v instanceof Date ? v.toISOString() : v);
}

export type CompanyAuditEntry = {
	type:
		| "CREATED"
		| "FIELD_CHANGE"
		| "NOTE_ADDED"
		| "BOOTSTRAPPED_FROM_APPLICATION"
		| "LINKED_APPLICATION"
		| "UNLINKED_APPLICATION";
	field?: string;
	oldValue?: string | null;
	newValue?: string | null;
	comment?: string;
};

export function diffCompany(
	prev: Record<string, unknown>,
	next: Record<string, unknown>,
): CompanyAuditEntry[] {
	const entries: CompanyAuditEntry[] = [];
	for (const f of TRACKED_FIELDS as readonly TrackedField[]) {
		if (normalize(prev[f]) !== normalize(next[f])) {
			entries.push({
				type: "FIELD_CHANGE",
				field: f,
				oldValue: encode(prev[f]),
				newValue: encode(next[f]),
			});
		}
	}
	return entries;
}

export async function writeCompanyActivityEntries(
	tx: Prisma.TransactionClient,
	companyId: string,
	entries: CompanyAuditEntry[],
): Promise<void> {
	if (entries.length === 0) return;
	await tx.companyActivityEntry.createMany({
		data: entries.map((e) => ({
			companyId,
			type: e.type,
			field: e.field ?? null,
			oldValue: e.oldValue ?? null,
			newValue: e.newValue ?? null,
			comment: e.comment ?? null,
		})),
	});
}

export function decodeCompanyValue(v: string | null): unknown {
	if (v === null || v === undefined) return null;
	try {
		return JSON.parse(v);
	} catch {
		return v;
	}
}
