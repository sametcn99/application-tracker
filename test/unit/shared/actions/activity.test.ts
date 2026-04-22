import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
	activityEntry: { findMany: vi.fn() },
}));
vi.mock("@/shared/lib/prisma", () => ({ prisma }));

import { fetchActivitiesAction } from "@/shared/actions/activity";

describe("fetchActivitiesAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("paginates with default page size", async () => {
		prisma.activityEntry.findMany.mockResolvedValueOnce([]);
		await fetchActivitiesAction(1);
		expect(prisma.activityEntry.findMany).toHaveBeenCalledWith({
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			take: 20,
			skip: 0,
			include: {
				application: {
					select: { id: true, company: true, position: true },
				},
			},
		});
	});

	it("applies skip based on page and custom pageSize", async () => {
		prisma.activityEntry.findMany.mockResolvedValueOnce([]);
		await fetchActivitiesAction(3, 10);
		const args = prisma.activityEntry.findMany.mock.calls[0][0];
		expect(args.take).toBe(10);
		expect(args.skip).toBe(20);
	});
});
