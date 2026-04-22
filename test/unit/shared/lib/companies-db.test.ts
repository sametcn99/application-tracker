import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => {
	const txClient = {
		company: {
			create: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		application: {
			findMany: vi.fn(),
			update: vi.fn(),
		},
		activityEntry: {
			create: vi.fn(),
			createMany: vi.fn(),
		},
		companyActivityEntry: {
			create: vi.fn(),
			createMany: vi.fn(),
		},
	};
	return {
		__txClient: txClient,
		company: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			delete: vi.fn(),
		},
		companyActivityEntry: {
			create: vi.fn(),
		},
		$transaction: vi.fn(async (fn: (tx: typeof txClient) => unknown) =>
			fn(txClient),
		),
	};
});

vi.mock("@/shared/lib/prisma", () => ({ prisma }));

import {
	addCompanyNote,
	createCompany,
	deleteCompany,
	getCompany,
	getCompanyByNormalizedName,
	listCompanies,
	listCompanyFormOptions,
	logCompanyApplicationLink,
	resolveCompanyForApplication,
	searchCompanies,
	updateCompany,
} from "@/shared/lib/companies";

const tx = (prisma as unknown as { __txClient: typeof prisma })
	.__txClient as unknown as {
	company: {
		create: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
	application: {
		findMany: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
	companyActivityEntry: {
		createMany: ReturnType<typeof vi.fn>;
	};
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("listCompanies", () => {
	it("queries by ascending name with applications count", async () => {
		prisma.company.findMany.mockResolvedValueOnce([{ id: "1" }]);
		await listCompanies();
		expect(prisma.company.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				orderBy: { name: "asc" },
				include: { _count: { select: { applications: true } } },
			}),
		);
	});
});

describe("listCompanyFormOptions", () => {
	it("selects the form-relevant subset of fields", async () => {
		prisma.company.findMany.mockResolvedValueOnce([]);
		await listCompanyFormOptions();
		const arg = prisma.company.findMany.mock.calls[0][0];
		expect(arg.select).toMatchObject({
			id: true,
			name: true,
			normalizedName: true,
		});
	});
});

describe("searchCompanies", () => {
	it("returns top results when query is empty", async () => {
		prisma.company.findMany.mockResolvedValueOnce([]);
		await searchCompanies("   ", 5);
		expect(prisma.company.findMany).toHaveBeenCalledWith({
			orderBy: { name: "asc" },
			take: 5,
		});
	});

	it("uses an OR clause across name and normalizedName for non-empty query", async () => {
		prisma.company.findMany.mockResolvedValueOnce([]);
		await searchCompanies("Acme");
		const arg = prisma.company.findMany.mock.calls[0][0];
		expect(arg.where.OR).toHaveLength(2);
		expect(arg.where.OR[0].name.contains).toBe("Acme");
	});
});

describe("getCompany", () => {
	it("includes applications and activities", async () => {
		prisma.company.findUnique.mockResolvedValueOnce({ id: "1" });
		await getCompany("1");
		const arg = prisma.company.findUnique.mock.calls[0][0];
		expect(arg.where).toEqual({ id: "1" });
		expect(arg.include).toMatchObject({ applications: expect.any(Object) });
	});
});

describe("getCompanyByNormalizedName", () => {
	it("looks up by normalizedName", async () => {
		prisma.company.findUnique.mockResolvedValueOnce({ id: "1" });
		await getCompanyByNormalizedName("acme");
		expect(prisma.company.findUnique).toHaveBeenCalledWith({
			where: { normalizedName: "acme" },
		});
	});
});

describe("createCompany", () => {
	it("creates the company in a transaction and writes a CREATED audit entry", async () => {
		tx.company.create.mockResolvedValueOnce({ id: "c1" });
		const result = await createCompany({ name: "  Acme  " });
		expect(result).toEqual({ id: "c1" });
		expect(tx.company.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					name: "Acme",
					normalizedName: "acme",
				}),
			}),
		);
		expect(tx.companyActivityEntry.createMany).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.arrayContaining([
					expect.objectContaining({ type: "CREATED" }),
				]),
			}),
		);
	});

	it("normalises empty/blank optional fields to null and ignores NaN numbers", async () => {
		tx.company.create.mockResolvedValueOnce({ id: "c2" });
		await createCompany({
			name: "Beta",
			website: "  ",
			foundedYear: Number.NaN,
			industry: "Tech",
		});
		const arg = tx.company.create.mock.calls[0][0];
		expect(arg.data.website).toBeNull();
		expect(arg.data.foundedYear).toBeNull();
		expect(arg.data.industry).toBe("Tech");
	});
});

describe("updateCompany", () => {
	it("throws when company is missing", async () => {
		tx.company.findUnique.mockResolvedValueOnce(null);
		await expect(updateCompany("missing", { name: "X" })).rejects.toThrow(
			"Company not found",
		);
	});

	it("syncs linked applications when company name/industry/companySize changed", async () => {
		tx.company.findUnique.mockResolvedValueOnce({
			id: "c1",
			name: "Old",
			industry: "OldInd",
			companySize: "1-10",
		});
		tx.company.update.mockResolvedValueOnce({
			id: "c1",
			name: "New",
			industry: "NewInd",
			companySize: "11-50",
		});
		tx.application.findMany.mockResolvedValueOnce([
			{ id: "a1", company: "Old", industry: "OldInd", companySize: "1-10" },
		]);
		await updateCompany("c1", {
			name: "New",
			industry: "NewInd",
			companySize: "11-50",
		});
		expect(tx.application.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "a1" },
				data: expect.objectContaining({ company: "New" }),
			}),
		);
	});

	it("skips per-application update when nothing changed", async () => {
		tx.company.findUnique.mockResolvedValueOnce({
			id: "c1",
			name: "Same",
			industry: null,
			companySize: null,
		});
		tx.company.update.mockResolvedValueOnce({
			id: "c1",
			name: "Same",
			industry: null,
			companySize: null,
		});
		tx.application.findMany.mockResolvedValueOnce([
			{ id: "a1", company: "Same", industry: null, companySize: null },
		]);
		await updateCompany("c1", { name: "Same" });
		expect(tx.application.update).not.toHaveBeenCalled();
	});
});

describe("deleteCompany", () => {
	it("deletes by id", async () => {
		await deleteCompany("c1");
		expect(prisma.company.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
	});
});

describe("addCompanyNote", () => {
	it("ignores empty / whitespace-only notes", async () => {
		await addCompanyNote("c1", "   ");
		expect(prisma.companyActivityEntry.create).not.toHaveBeenCalled();
	});

	it("trims and persists non-empty notes as NOTE_ADDED", async () => {
		await addCompanyNote("c1", "  hello  ");
		expect(prisma.companyActivityEntry.create).toHaveBeenCalledWith({
			data: { companyId: "c1", type: "NOTE_ADDED", comment: "hello" },
		});
	});
});

describe("resolveCompanyForApplication", () => {
	it("returns the existing companyId when provided and found", async () => {
		tx.company.findUnique.mockResolvedValueOnce({ id: "given" });
		const id = await resolveCompanyForApplication(tx as never, {
			companyId: "given",
			companyName: "Anything",
		});
		expect(id).toBe("given");
		expect(tx.company.create).not.toHaveBeenCalled();
	});

	it("falls through to lookup-by-name when the provided id is not found", async () => {
		tx.company.findUnique
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ id: "byname" });
		const id = await resolveCompanyForApplication(tx as never, {
			companyId: "ghost",
			companyName: "Acme",
		});
		expect(id).toBe("byname");
	});

	it("throws when no name is provided after fallback", async () => {
		await expect(
			resolveCompanyForApplication(tx as never, { companyName: "   " }),
		).rejects.toThrow("Company name is required");
	});

	it("creates a bootstrapped company when none exists by name", async () => {
		tx.company.findUnique.mockResolvedValueOnce(null);
		tx.company.create.mockResolvedValueOnce({ id: "new" });
		const id = await resolveCompanyForApplication(tx as never, {
			companyName: "Brand New",
			profile: { website: "https://x.com" },
		});
		expect(id).toBe("new");
		expect(tx.companyActivityEntry.createMany).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.arrayContaining([
					expect.objectContaining({
						type: "BOOTSTRAPPED_FROM_APPLICATION",
					}),
				]),
			}),
		);
	});
});

describe("logCompanyApplicationLink", () => {
	it("writes a LINKED_APPLICATION audit entry with newValue containing the application id", async () => {
		await logCompanyApplicationLink(
			tx as never,
			"c1",
			"app1",
			"LINKED_APPLICATION",
		);
		expect(tx.companyActivityEntry.createMany).toHaveBeenCalled();
		const arg = tx.companyActivityEntry.createMany.mock.calls[0][0];
		expect(arg.data[0].type).toBe("LINKED_APPLICATION");
	});
});
