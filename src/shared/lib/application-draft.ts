import type { ApplicationFormInput } from "@/shared/schemas/application";

export const DRAFT_SCHEMA_VERSION = 1;
export const DRAFT_LOCAL_PREFIX = "app-tracker:draft-recovery";
export const DRAFT_LOCAL_DEBOUNCE_MS = 800;
export const MAX_DRAFTS_PER_CONTEXT = 20;

export type DraftMode = "CREATE" | "EDIT";

export type DraftContext =
	| { mode: "CREATE" }
	| { mode: "EDIT"; applicationId: string };

export type DraftPayload = Record<string, unknown>;

export type LocalRecoverySnapshot = {
	payload: DraftPayload;
	updatedAt: string;
	schemaVersion: number;
};

const FIELDS: (keyof ApplicationFormInput)[] = [
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
	"status",
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
	"tagIds",
];

const DATE_FIELDS = new Set(["appliedAt", "nextStepAt"]);

function normalizeValue(key: string, value: unknown): unknown {
	if (value === undefined || value === null) return undefined;
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed === "" ? undefined : trimmed;
	}
	if (Array.isArray(value)) {
		const arr = value
			.map((v) => (typeof v === "string" ? v.trim() : v))
			.filter((v) => v != null && v !== "");
		if (key === "tagIds") return [...arr].sort();
		return arr;
	}
	if (DATE_FIELDS.has(key)) {
		try {
			const d = value instanceof Date ? value : new Date(value as string);
			if (Number.isNaN(d.getTime())) return undefined;
			return d.toISOString();
		} catch {
			return undefined;
		}
	}
	if (typeof value === "number" && !Number.isFinite(value)) return undefined;
	return value;
}

/**
 * Convert form values into a stable JSON-serializable payload.
 * Used both for storing drafts and for dirty comparison.
 */
export function serializeForm(
	values: Partial<ApplicationFormInput>,
): DraftPayload {
	const out: DraftPayload = {};
	for (const key of FIELDS) {
		const v = normalizeValue(key as string, values[key]);
		if (v !== undefined) {
			out[key as string] = v;
		}
	}
	return out;
}

/**
 * Convert a stored payload back into form-compatible values.
 * Dates remain as ISO strings (RHF Controller handles them via toDateInput helpers).
 */
export function deserializePayload(
	payload: DraftPayload,
): Partial<ApplicationFormInput> {
	const out: Partial<ApplicationFormInput> = {};
	for (const key of FIELDS) {
		const raw = payload[key as string];
		if (raw === undefined || raw === null) continue;
		if (DATE_FIELDS.has(key as string)) {
			try {
				const d = new Date(raw as string);
				if (!Number.isNaN(d.getTime())) {
					(out as Record<string, unknown>)[key as string] = d;
				}
			} catch {
				// ignore
			}
			continue;
		}
		(out as Record<string, unknown>)[key as string] = raw;
	}
	return out;
}

export function arePayloadsEqual(a: DraftPayload, b: DraftPayload): boolean {
	const ak = Object.keys(a).sort();
	const bk = Object.keys(b).sort();
	if (ak.length !== bk.length) return false;
	for (let i = 0; i < ak.length; i++) {
		if (ak[i] !== bk[i]) return false;
	}
	for (const k of ak) {
		const av = a[k];
		const bv = b[k];
		if (Array.isArray(av) && Array.isArray(bv)) {
			if (av.length !== bv.length) return false;
			for (let i = 0; i < av.length; i++) {
				if (av[i] !== bv[i]) return false;
			}
			continue;
		}
		if (av instanceof Date || bv instanceof Date) {
			const ad = av instanceof Date ? av.toISOString() : av;
			const bd = bv instanceof Date ? bv.toISOString() : bv;
			if (ad !== bd) return false;
			continue;
		}
		if (av !== bv) return false;
	}
	return true;
}

export function contextKey(ctx: DraftContext): string {
	return ctx.mode === "CREATE" ? "create" : `edit:${ctx.applicationId}`;
}

export function localRecoveryKey(ctx: DraftContext): string {
	return `${DRAFT_LOCAL_PREFIX}:${contextKey(ctx)}`;
}

export function readLocalRecovery(
	ctx: DraftContext,
): LocalRecoverySnapshot | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(localRecoveryKey(ctx));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as LocalRecoverySnapshot;
		if (!parsed || typeof parsed !== "object" || !parsed.payload) return null;
		if (parsed.schemaVersion !== DRAFT_SCHEMA_VERSION) return null;
		return parsed;
	} catch {
		return null;
	}
}

export function writeLocalRecovery(
	ctx: DraftContext,
	payload: DraftPayload,
): void {
	if (typeof window === "undefined") return;
	try {
		const snapshot: LocalRecoverySnapshot = {
			payload,
			updatedAt: new Date().toISOString(),
			schemaVersion: DRAFT_SCHEMA_VERSION,
		};
		window.localStorage.setItem(
			localRecoveryKey(ctx),
			JSON.stringify(snapshot),
		);
	} catch {
		// quota or serialization error - ignore
	}
}

export function clearLocalRecovery(ctx: DraftContext): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(localRecoveryKey(ctx));
	} catch {
		// ignore
	}
}

export function buildDraftLabel(payload: DraftPayload): string {
	const company =
		typeof payload.company === "string" && payload.company.trim()
			? payload.company.trim()
			: null;
	const position =
		typeof payload.position === "string" && payload.position.trim()
			? payload.position.trim()
			: null;
	if (company && position) return `${position} @ ${company}`;
	if (company) return company;
	if (position) return position;
	return "Untitled draft";
}
