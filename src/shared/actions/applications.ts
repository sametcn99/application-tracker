"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
	addComment,
	createApplication,
	deleteApplication,
	type ListFilters,
	listApplications,
	updateApplication,
	updateStatus,
} from "@/shared/lib/applications";
import {
	type ApplicationFormInput,
	applicationFormSchema,
} from "@/shared/schemas/application";

export async function fetchApplicationsAction(filters: ListFilters) {
	return listApplications(filters);
}

export async function createApplicationAction(values: ApplicationFormInput) {
	const result = applicationFormSchema.safeParse(values);
	if (!result.success) {
		return {
			ok: false,
			error: "invalid_data",
			fieldErrors: result.error.flatten().fieldErrors,
		};
	}

	try {
		const app = await createApplication(result.data);
		revalidatePath("/applications");
		return { ok: true, id: app.id };
	} catch (error) {
		console.error(error);
		return { ok: false, error: "server_error" };
	}
}

export async function updateApplicationAction(
	id: string,
	values: ApplicationFormInput,
) {
	const result = applicationFormSchema.safeParse(values);
	if (!result.success) {
		return {
			ok: false,
			error: "invalid_data",
			fieldErrors: result.error.flatten().fieldErrors,
		};
	}

	try {
		await updateApplication(id, result.data);
		revalidatePath("/applications");
		revalidatePath(`/applications/${id}`);
		revalidatePath(`/applications/${id}/edit`);
		return { ok: true, id };
	} catch (error) {
		console.error(error);
		return { ok: false, error: "server_error" };
	}
}

export async function updateStatusAction(id: string, status: string) {
	try {
		await updateStatus(id, status);
		revalidatePath(`/applications/${id}`);
		revalidatePath("/applications");
		return { ok: true };
	} catch (err) {
		console.error(err);
		return { ok: false, error: "server_error" };
	}
}

export async function addCommentAction(id: string, comment: string) {
	try {
		await addComment(id, comment);
		revalidatePath(`/applications/${id}`);
		revalidatePath("/activity");
		return { ok: true };
	} catch (err) {
		console.error(err);
		return { ok: false, error: "server_error" };
	}
}

export async function deleteApplicationAction(id: string) {
	try {
		await deleteApplication(id);
	} catch (err) {
		console.error(err);
		return { ok: false, error: "server_error" };
	}
	revalidatePath("/applications");
	redirect("/applications");
}
