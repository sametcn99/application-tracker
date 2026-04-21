import type { ListFilters } from "@/shared/lib/applications";

export function parseFilters(
	sp: URLSearchParams | Record<string, string | string[] | undefined>,
): ListFilters {
	const get = (k: string): string | undefined => {
		if (sp instanceof URLSearchParams) return sp.get(k) ?? undefined;
		const v = sp[k];
		return Array.isArray(v) ? v[0] : v;
	};
	const getAll = (k: string): string[] => {
		if (sp instanceof URLSearchParams) return sp.getAll(k);
		const v = sp[k];
		if (Array.isArray(v)) return v;
		if (typeof v === "string" && v.length) return v.split(",");
		return [];
	};

	const f: ListFilters = {};
	const q = get("q");
	if (q) f.q = q;

	const status = getAll("status");
	if (status.length) f.status = status;

	const workMode = getAll("workMode");
	if (workMode.length) f.workMode = workMode;

	const priority = getAll("priority");
	if (priority.length) f.priority = priority;

	const source = get("source");
	if (source) f.source = source;

	const sourceType = get("sourceType");
	if (sourceType) f.sourceType = sourceType;

	const relocationPreference = get("relocationPreference");
	if (relocationPreference) f.relocationPreference = relocationPreference;

	const companySize = get("companySize");
	if (companySize) f.companySize = companySize;

	const applicationMethod = get("applicationMethod");
	if (applicationMethod) f.applicationMethod = applicationMethod;

	const needsSponsorship = get("needsSponsorship");
	if (needsSponsorship === "true") f.needsSponsorship = true;
	if (needsSponsorship === "false") f.needsSponsorship = false;

	const nextActionType = get("nextActionType");
	if (nextActionType) f.nextActionType = nextActionType;

	const outcomeReason = get("outcomeReason");
	if (outcomeReason) f.outcomeReason = outcomeReason;

	const tagIds = getAll("tag");
	if (tagIds.length) f.tagIds = tagIds;

	const from = get("from");
	if (from) {
		const d = new Date(from);
		if (!Number.isNaN(d.getTime())) f.from = d;
	}
	const to = get("to");
	if (to) {
		const d = new Date(to);
		if (!Number.isNaN(d.getTime())) f.to = d;
	}

	const sort = get("sort");
	if (sort === "appliedAt" || sort === "updatedAt" || sort === "company")
		f.sort = sort;
	const order = get("order");
	if (order === "asc" || order === "desc") f.order = order;

	return f;
}
