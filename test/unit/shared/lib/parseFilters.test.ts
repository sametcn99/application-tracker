import { describe, expect, it } from "vitest";
import { parseFilters } from "@/shared/lib/parseFilters";

describe("parseFilters", () => {
	it("returns empty object for empty params", () => {
		expect(parseFilters(new URLSearchParams())).toEqual({});
		expect(parseFilters({})).toEqual({});
	});

	it("parses simple string filters from URLSearchParams", () => {
		const sp = new URLSearchParams(
			"q=engineer&source=linkedin&sourceType=JOB_BOARD",
		);
		expect(parseFilters(sp)).toMatchObject({
			q: "engineer",
			source: "linkedin",
			sourceType: "JOB_BOARD",
		});
	});

	it("collects multi-value params into arrays", () => {
		const sp = new URLSearchParams();
		sp.append("status", "APPLIED");
		sp.append("status", "OFFER");
		sp.append("workMode", "REMOTE");
		sp.append("priority", "HIGH");
		sp.append("tag", "t1");
		sp.append("tag", "t2");
		const f = parseFilters(sp);
		expect(f.status).toEqual(["APPLIED", "OFFER"]);
		expect(f.workMode).toEqual(["REMOTE"]);
		expect(f.priority).toEqual(["HIGH"]);
		expect(f.tagIds).toEqual(["t1", "t2"]);
	});

	it("supports record input with comma separated multi-values", () => {
		const f = parseFilters({ status: "APPLIED,OFFER", tag: "t1,t2" });
		expect(f.status).toEqual(["APPLIED", "OFFER"]);
		expect(f.tagIds).toEqual(["t1", "t2"]);
	});

	it("prefers the first value when record entries are arrays", () => {
		const f = parseFilters({ q: ["engineer", "ignored"] });
		expect(f.q).toBe("engineer");
	});

	it("coerces needsSponsorship boolean strings", () => {
		expect(parseFilters({ needsSponsorship: "true" }).needsSponsorship).toBe(
			true,
		);
		expect(parseFilters({ needsSponsorship: "false" }).needsSponsorship).toBe(
			false,
		);
		expect(parseFilters({ needsSponsorship: "maybe" }).needsSponsorship).toBe(
			undefined,
		);
	});

	it("parses the remaining scalar filters", () => {
		const f = parseFilters({
			relocationPreference: "OPEN",
			companySize: "51-200",
			applicationMethod: "EMAIL",
			nextActionType: "FOLLOW_UP",
			outcomeReason: "NO_RESPONSE",
		});
		expect(f).toMatchObject({
			relocationPreference: "OPEN",
			companySize: "51-200",
			applicationMethod: "EMAIL",
			nextActionType: "FOLLOW_UP",
			outcomeReason: "NO_RESPONSE",
		});
	});

	it("parses valid date ranges into Date objects", () => {
		const f = parseFilters({ from: "2026-01-01", to: "2026-12-31" });
		expect(f.from).toBeInstanceOf(Date);
		expect(f.to).toBeInstanceOf(Date);
		expect(f.from?.toISOString()).toContain("2026-01-01");
	});

	it("ignores invalid dates", () => {
		const f = parseFilters({ from: "not-a-date", to: "" });
		expect(f.from).toBeUndefined();
		expect(f.to).toBeUndefined();
	});

	it("parses a valid upper-bound date on its own", () => {
		const f = parseFilters({ to: "2026-12-31" });
		expect(f.to).toBeInstanceOf(Date);
	});

	it("only accepts whitelisted sort and order values", () => {
		expect(parseFilters({ sort: "appliedAt", order: "asc" })).toMatchObject({
			sort: "appliedAt",
			order: "asc",
		});
		expect(parseFilters({ sort: "bogus", order: "sideways" })).toEqual({});
	});

	it("drops empty arrays from record input", () => {
		const f = parseFilters({ status: undefined, tag: [] });
		expect(f.status).toBeUndefined();
		expect(f.tagIds).toBeUndefined();
	});
});
