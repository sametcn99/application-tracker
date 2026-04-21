import type { Prisma } from "@prisma/client";

const TRACKED_FIELDS = [
	"company",
	"position",
	"listingDetails",
	"location",
	"workMode",
	"employmentType",
	"priority",
	"salaryMin",
	"salaryMax",
	"targetSalaryMin",
	"targetSalaryMax",
	"currency",
	"source",
	"sourceType",
	"referralName",
	"jobUrl",
	"appliedAt",
	"outcomeReason",
	"contactName",
	"contactRole",
	"contactEmail",
	"contactPhone",
	"contactProfileUrl",
	"resumeVersion",
	"coverLetterVersion",
	"portfolioUrl",
	"needsSponsorship",
	"relocationPreference",
	"workAuthorizationNote",
	"team",
	"department",
	"companySize",
	"industry",
	"applicationMethod",
	"timezoneOverlapHours",
	"officeDaysPerWeek",
	"notes",
	"nextStepAt",
	"nextStepNote",
	"nextActionType",
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

export type AuditEntry = {
	type:
		| "CREATED"
		| "FIELD_CHANGE"
		| "STATUS_CHANGE"
		| "ATTACHMENT_ADDED"
		| "ATTACHMENT_REMOVED"
		| "COMMENT";
	field?: string;
	oldValue?: string | null;
	newValue?: string | null;
	comment?: string;
};

/**
 * Compare a previous and next snapshot of an Application and produce
 * one ActivityEntry per changed field. Status changes are emitted as
 * STATUS_CHANGE; everything else as FIELD_CHANGE.
 */
export function diffApplication(
	prev: Record<string, unknown>,
	next: Record<string, unknown>,
): AuditEntry[] {
	const entries: AuditEntry[] = [];

	if (normalize(prev.status) !== normalize(next.status)) {
		entries.push({
			type: "STATUS_CHANGE",
			field: "status",
			oldValue: encode(prev.status),
			newValue: encode(next.status),
		});
	}

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

/**
 * Diff tag id sets and emit a single FIELD_CHANGE entry if changed.
 */
export function diffTags(
	prevIds: string[],
	nextIds: string[],
): AuditEntry | null {
	const a = [...prevIds].sort();
	const b = [...nextIds].sort();
	if (a.length === b.length && a.every((v, i) => v === b[i])) return null;
	return {
		type: "FIELD_CHANGE",
		field: "tags",
		oldValue: encode(a),
		newValue: encode(b),
	};
}

export async function writeActivityEntries(
	tx: Prisma.TransactionClient,
	applicationId: string,
	entries: AuditEntry[],
): Promise<void> {
	if (entries.length === 0) return;
	await tx.activityEntry.createMany({
		data: entries.map((e) => ({
			applicationId,
			type: e.type,
			field: e.field ?? null,
			oldValue: e.oldValue ?? null,
			newValue: e.newValue ?? null,
			comment: e.comment ?? null,
		})),
	});
}

export function decodeValue(v: string | null): unknown {
	if (v === null || v === undefined) return null;
	try {
		return JSON.parse(v);
	} catch {
		return v;
	}
}
