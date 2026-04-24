import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => {
	const tx = {
		application: {
			create: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		activityEntry: {
			create: vi.fn(),
			createMany: vi.fn(),
		},
	};
	return {
		__tx: tx,
		application: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			delete: vi.fn(),
		},
		activityEntry: {
			create: vi.fn(),
		},
		$transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
	};
});

const companies = vi.hoisted(() => ({
	resolveCompanyForApplication: vi.fn(),
	logCompanyApplicationLink: vi.fn(),
}));

vi.mock("@/shared/lib/prisma", () => ({ prisma }));
vi.mock("@/shared/lib/companies", () => companies);

import {
	addComment,
	createApplication,
	deleteApplication,
	getApplication,
	listApplications,
	updateApplication,
	updateStatus,
} from "@/shared/lib/applications";

const tx = (prisma as unknown as { __tx: typeof prisma }).__tx as unknown as {
	application: {
		create: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
	activityEntry: {
		create: ReturnType<typeof vi.fn>;
		createMany: ReturnType<typeof vi.fn>;
	};
};

const baseValues = {
	company: "Acme",
	position: "Eng",
	workMode: "REMOTE",
	employmentType: "FULL_TIME",
	priority: "MEDIUM",
	appliedAt: new Date("2024-01-15"),
	status: "APPLIED",
} as const;

beforeEach(() => {
	vi.clearAllMocks();
});

describe("listApplications", () => {
	it("uses default sort (appliedAt desc) when not provided", async () => {
		prisma.application.findMany.mockResolvedValueOnce([]);
		await listApplications();
		expect(prisma.application.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				orderBy: [{ appliedAt: "desc" }, { id: "desc" }],
			}),
		);
	});

	it("respects custom sort and order", async () => {
		prisma.application.findMany.mockResolvedValueOnce([]);
		await listApplications({ sort: "company", order: "asc" });
		expect(prisma.application.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				orderBy: [{ company: "asc" }, { id: "asc" }],
			}),
		);
	});
});

describe("getApplication", () => {
	it("includes tags, attachments, activities and companyRecord", async () => {
		prisma.application.findUnique.mockResolvedValueOnce({ id: "a1" });
		await getApplication("a1");
		const arg = prisma.application.findUnique.mock.calls[0][0];
		expect(arg.where).toEqual({ id: "a1" });
		expect(arg.include).toMatchObject({
			tags: expect.any(Object),
			attachments: expect.any(Object),
			activities: expect.any(Object),
			companyRecord: true,
		});
	});
});

describe("createApplication", () => {
	it("resolves the company, persists, writes audit, and links to company", async () => {
		companies.resolveCompanyForApplication.mockResolvedValueOnce("c1");
		tx.application.create.mockResolvedValueOnce({ id: "a1" });
		const res = await createApplication({
			...baseValues,
			tagIds: ["t1", "t2"],
		} as never);
		expect(res).toEqual({ id: "a1" });
		expect(companies.resolveCompanyForApplication).toHaveBeenCalled();
		expect(tx.application.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					companyId: "c1",
					tags: { create: [{ tagId: "t1" }, { tagId: "t2" }] },
				}),
			}),
		);
		expect(tx.activityEntry.createMany).toHaveBeenCalled();
		expect(companies.logCompanyApplicationLink).toHaveBeenCalledWith(
			tx,
			"c1",
			"a1",
			"LINKED_APPLICATION",
		);
	});
});

describe("updateApplication", () => {
	it("throws when the application is missing", async () => {
		tx.application.findUnique.mockResolvedValueOnce(null);
		await expect(
			updateApplication("missing", baseValues as never),
		).rejects.toThrow("Application not found");
	});

	it("logs unlink+link when the company changes", async () => {
		tx.application.findUnique.mockResolvedValueOnce({
			id: "a1",
			companyId: "old",
			status: "APPLIED",
			tags: [],
		});
		companies.resolveCompanyForApplication.mockResolvedValueOnce("new");
		tx.application.update.mockResolvedValueOnce({ id: "a1" });
		await updateApplication("a1", baseValues as never);
		expect(companies.logCompanyApplicationLink).toHaveBeenCalledWith(
			tx,
			"old",
			"a1",
			"UNLINKED_APPLICATION",
		);
		expect(companies.logCompanyApplicationLink).toHaveBeenCalledWith(
			tx,
			"new",
			"a1",
			"LINKED_APPLICATION",
		);
	});

	it("does not log link changes when companyId is unchanged", async () => {
		tx.application.findUnique.mockResolvedValueOnce({
			id: "a1",
			companyId: "same",
			status: "APPLIED",
			tags: [],
		});
		companies.resolveCompanyForApplication.mockResolvedValueOnce("same");
		tx.application.update.mockResolvedValueOnce({ id: "a1" });
		await updateApplication("a1", baseValues as never);
		expect(companies.logCompanyApplicationLink).not.toHaveBeenCalled();
	});

	it("includes a tags FIELD_CHANGE entry when tag set differs", async () => {
		tx.application.findUnique.mockResolvedValueOnce({
			id: "a1",
			companyId: "c1",
			status: "APPLIED",
			tags: [{ tagId: "t1" }],
		});
		companies.resolveCompanyForApplication.mockResolvedValueOnce("c1");
		tx.application.update.mockResolvedValueOnce({ id: "a1" });
		await updateApplication("a1", {
			...baseValues,
			tagIds: ["t1", "t2"],
		} as never);
		const entries = tx.activityEntry.createMany.mock.calls[0][0].data as Array<{
			field?: string;
		}>;
		expect(entries.some((e) => e.field === "tags")).toBe(true);
	});
});

describe("updateStatus", () => {
	it("throws when application missing", async () => {
		tx.application.findUnique.mockResolvedValueOnce(null);
		await expect(updateStatus("missing", "OFFER")).rejects.toThrow(
			"Application not found",
		);
	});

	it("returns the previous record without writing when status unchanged", async () => {
		tx.application.findUnique.mockResolvedValueOnce({
			id: "a1",
			status: "APPLIED",
		});
		const res = await updateStatus("a1", "APPLIED");
		expect(res).toMatchObject({ id: "a1" });
		expect(tx.application.update).not.toHaveBeenCalled();
	});

	it("updates and emits a STATUS_CHANGE audit entry when status changes", async () => {
		tx.application.findUnique.mockResolvedValueOnce({
			id: "a1",
			status: "APPLIED",
		});
		tx.application.update.mockResolvedValueOnce({ id: "a1", status: "OFFER" });
		await updateStatus("a1", "OFFER");
		const entries = tx.activityEntry.createMany.mock.calls[0][0].data;
		expect(entries[0]).toMatchObject({
			type: "STATUS_CHANGE",
			field: "status",
		});
	});
});

describe("addComment", () => {
	it("ignores empty / whitespace-only comments", async () => {
		await addComment("a1", "   ");
		expect(prisma.activityEntry.create).not.toHaveBeenCalled();
	});

	it("trims and persists non-empty comments", async () => {
		await addComment("a1", "  good chat  ");
		expect(prisma.activityEntry.create).toHaveBeenCalledWith({
			data: { applicationId: "a1", type: "COMMENT", comment: "good chat" },
		});
	});
});

describe("deleteApplication", () => {
	it("deletes by id", async () => {
		await deleteApplication("a1");
		expect(prisma.application.delete).toHaveBeenCalledWith({
			where: { id: "a1" },
		});
	});
});
