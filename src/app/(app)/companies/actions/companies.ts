"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
	addCompanyNote,
	createCompany,
	deleteCompany,
	searchCompanies,
	updateCompany,
} from "@/shared/lib/companies";
import { logger } from "@/shared/lib/logger";
import { type CompanyFormInput, companyFormSchema } from "./companies.schema";

function revalidate(id?: string) {
	revalidatePath("/companies");
	revalidatePath("/applications");
	revalidatePath("/applications/new");
	revalidatePath("/applications/[id]/edit", "page");
	if (id) revalidatePath(`/companies/${id}`);
}

export async function searchCompaniesAction(query: string, limit?: number) {
	const results = await searchCompanies(query ?? "", limit ?? 10);
	return results.map((c) => ({
		id: c.id,
		name: c.name,
		normalizedName: c.normalizedName,
		website: c.website,
		careersUrl: c.careersUrl,
		linkedinUrl: c.linkedinUrl,
		location: c.location,
		industry: c.industry,
		companySize: c.companySize,
	}));
}

export async function createCompanyAction(values: CompanyFormInput) {
	const parsed = companyFormSchema.safeParse(values);
	if (!parsed.success) {
		return {
			ok: false as const,
			error: "invalid_data",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}
	try {
		const created = await createCompany(parsed.data);
		revalidate(created.id);
		return { ok: true as const, id: created.id };
	} catch (err) {
		logger.error("create_company_failed");
		const msg = err instanceof Error ? err.message : "server_error";
		const isDup = msg.includes("Unique") || msg.includes("normalizedName");
		return {
			ok: false as const,
			error: isDup ? "company_exists" : "server_error",
		};
	}
}

export async function updateCompanyAction(
	id: string,
	values: CompanyFormInput,
) {
	const parsed = companyFormSchema.safeParse(values);
	if (!parsed.success) {
		return {
			ok: false as const,
			error: "invalid_data",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}
	try {
		await updateCompany(id, parsed.data);
		revalidate(id);
		return { ok: true as const, id };
	} catch {
		logger.error("update_company_failed", { id });
		return { ok: false as const, error: "server_error" };
	}
}

export async function addCompanyNoteAction(id: string, note: string) {
	try {
		await addCompanyNote(id, note);
		revalidate(id);
		return { ok: true as const };
	} catch {
		logger.error("add_company_note_failed", { id });
		return { ok: false as const, error: "server_error" };
	}
}

export async function deleteCompanyAction(id: string) {
	try {
		await deleteCompany(id);
	} catch {
		logger.error("delete_company_failed", { id });
		return { ok: false as const, error: "server_error" };
	}
	revalidate();
	redirect("/companies");
}
