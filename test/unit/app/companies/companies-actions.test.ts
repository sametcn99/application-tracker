import { beforeEach, describe, expect, it, vi } from "vitest";

const lib = vi.hoisted(() => ({
	searchCompanies: vi.fn(),
	createCompany: vi.fn(),
	updateCompany: vi.fn(),
	addCompanyNote: vi.fn(),
	deleteCompany: vi.fn(),
}));
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
const nav = vi.hoisted(() => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`REDIRECT:${url}`);
	}),
}));

vi.mock("@/shared/lib/companies", () => lib);
vi.mock("next/cache", () => cache);
vi.mock("next/navigation", () => nav);

import {
	addCompanyNoteAction,
	createCompanyAction,
	deleteCompanyAction,
	searchCompaniesAction,
	updateCompanyAction,
} from "@/app/(app)/companies/actions/companies";

const minValid = { name: "Acme" } as never;

describe("companies server actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("searchCompaniesAction maps fields", async () => {
		lib.searchCompanies.mockResolvedValueOnce([
			{
				id: "1",
				name: "Acme",
				normalizedName: "acme",
				website: "https://a.com",
				careersUrl: null,
				linkedinUrl: null,
				location: "NY",
				industry: "Tech",
				companySize: "11-50",
				extra: "ignored",
			},
		]);
		const out = await searchCompaniesAction("ac", 5);
		expect(lib.searchCompanies).toHaveBeenCalledWith("ac", 5);
		expect(out[0]).not.toHaveProperty("extra");
		expect(out[0].name).toBe("Acme");
	});

	it("createCompanyAction returns invalid_data on bad input", async () => {
		const res = await createCompanyAction({ name: "" } as never);
		expect(res.ok).toBe(false);
		expect((res as { error: string }).error).toBe("invalid_data");
	});

	it("createCompanyAction returns id and revalidates on success", async () => {
		lib.createCompany.mockResolvedValueOnce({ id: "abc" });
		const res = await createCompanyAction(minValid);
		expect(res).toEqual({ ok: true, id: "abc" });
		expect(cache.revalidatePath).toHaveBeenCalledWith("/companies");
		expect(cache.revalidatePath).toHaveBeenCalledWith("/companies/abc");
	});

	it("createCompanyAction maps unique constraint error to company_exists", async () => {
		lib.createCompany.mockRejectedValueOnce(
			new Error("Unique constraint failed on normalizedName"),
		);
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const res = await createCompanyAction(minValid);
		expect(res).toEqual({ ok: false, error: "company_exists" });
		spy.mockRestore();
	});

	it("updateCompanyAction returns server_error if lib throws", async () => {
		lib.updateCompany.mockRejectedValueOnce(new Error("db down"));
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const res = await updateCompanyAction("id1", minValid);
		expect(res).toEqual({ ok: false, error: "server_error" });
		spy.mockRestore();
	});

	it("addCompanyNoteAction success returns ok and revalidates", async () => {
		lib.addCompanyNote.mockResolvedValueOnce(undefined);
		const res = await addCompanyNoteAction("id2", "hi");
		expect(res).toEqual({ ok: true });
		expect(lib.addCompanyNote).toHaveBeenCalledWith("id2", "hi");
	});

	it("deleteCompanyAction redirects on success", async () => {
		lib.deleteCompany.mockResolvedValueOnce(undefined);
		await expect(deleteCompanyAction("id3")).rejects.toThrow(
			"REDIRECT:/companies",
		);
		expect(nav.redirect).toHaveBeenCalledWith("/companies");
	});
});
