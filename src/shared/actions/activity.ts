"use server";
import { prisma } from "@/shared/lib/prisma";

export async function fetchActivitiesAction(page: number, pageSize = 20) {
	return prisma.activityEntry.findMany({
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		take: pageSize,
		skip: (page - 1) * pageSize,
		include: {
			application: { select: { id: true, company: true, position: true } },
		},
	});
}
