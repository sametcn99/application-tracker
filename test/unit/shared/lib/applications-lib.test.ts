import { describe, expect, it } from "vitest";

// Mock prisma so importing the module (which does NOT mark "server-only" import?
// Actually it does; aliased to stub already.) doesn't crash.
import { buildWhere } from "@/shared/lib/applications";

describe("buildWhere", () => {
	it("returns an empty object for no filters", () => {
		expect(buildWhere({})).toEqual({});
	});

	it("builds an OR clause for free-text search", () => {
		const where = buildWhere({ q: "remote" }) as {
			OR: Array<Record<string, { contains: string }>>;
		};
		expect(Array.isArray(where.OR)).toBe(true);
		expect(where.OR.length).toBeGreaterThan(0);
		for (const clause of where.OR) {
			const [, val] = Object.entries(clause)[0];
			expect(val.contains).toBe("remote");
		}
	});

	it("emits an `in` clause for multi-value status filters", () => {
		const where = buildWhere({ status: ["APPLIED", "INTERVIEW"] });
		expect(where).toMatchObject({ status: { in: ["APPLIED", "INTERVIEW"] } });
	});

	it("ignores empty array filters", () => {
		const where = buildWhere({ status: [], workMode: [], priority: [] });
		expect(where).not.toHaveProperty("status");
		expect(where).not.toHaveProperty("workMode");
		expect(where).not.toHaveProperty("priority");
	});

	it("forwards single-value scalar filters as-is", () => {
		const where = buildWhere({
			sourceType: "LINKEDIN",
			relocationPreference: "OPEN",
			companySize: "51-200",
			applicationMethod: "EMAIL",
			nextActionType: "INTERVIEW",
			outcomeReason: "OFFER_DECLINED",
		});
		expect(where).toMatchObject({
			sourceType: "LINKEDIN",
			relocationPreference: "OPEN",
			companySize: "51-200",
			applicationMethod: "EMAIL",
			nextActionType: "INTERVIEW",
			outcomeReason: "OFFER_DECLINED",
		});
	});

	it("wraps source in a contains predicate", () => {
		expect(buildWhere({ source: "Linked" })).toMatchObject({
			source: { contains: "Linked" },
		});
	});

	it("respects boolean false for needsSponsorship", () => {
		expect(buildWhere({ needsSponsorship: false })).toMatchObject({
			needsSponsorship: false,
		});
	});

	it("creates appliedAt range when from and to are set", () => {
		const from = new Date("2024-01-01");
		const to = new Date("2024-12-31");
		expect(buildWhere({ from, to })).toMatchObject({
			appliedAt: { gte: from, lte: to },
		});
	});

	it("creates appliedAt with only gte when only from is set", () => {
		const from = new Date("2024-01-01");
		const where = buildWhere({ from }) as {
			appliedAt: { gte: Date; lte?: Date };
		};
		expect(where.appliedAt.gte).toBe(from);
		expect(where.appliedAt).not.toHaveProperty("lte");
	});

	it("emits tags.some.tagId.in when tagIds are provided", () => {
		expect(buildWhere({ tagIds: ["t1", "t2"] })).toMatchObject({
			tags: { some: { tagId: { in: ["t1", "t2"] } } },
		});
	});
});
