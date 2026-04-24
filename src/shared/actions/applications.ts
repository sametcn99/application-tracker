"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
	addComment,
	createApplication,
	deleteApplication,
	type ListFilters,
	listApplicationsPage,
	updateApplication,
	updateStatus,
} from "@/shared/lib/applications";
import { logger } from "@/shared/lib/logger";
import {
	type ApplicationFormInput,
	applicationFormSchema,
} from "@/shared/schemas/application";

export async function fetchApplicationsAction(
	filters: ListFilters,
	cursor?: string | null,
) {
	return listApplicationsPage(filters, cursor);
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
	} catch {
		logger.error("create_application_failed");
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
	} catch {
		logger.error("update_application_failed", { id });
		return { ok: false, error: "server_error" };
	}
}

export async function updateStatusAction(id: string, status: string) {
	try {
		await updateStatus(id, status);
		revalidatePath(`/applications/${id}`);
		revalidatePath("/applications");
		return { ok: true };
	} catch {
		logger.error("update_status_failed", { id });
		return { ok: false, error: "server_error" };
	}
}

export async function addCommentAction(id: string, comment: string) {
	try {
		await addComment(id, comment);
		revalidatePath(`/applications/${id}`);
		revalidatePath("/activity");
		return { ok: true };
	} catch {
		logger.error("add_comment_failed", { id });
		return { ok: false, error: "server_error" };
	}
}

export async function deleteApplicationAction(id: string) {
	try {
		await deleteApplication(id);
	} catch {
		logger.error("delete_application_failed", { id });
		return { ok: false, error: "server_error" };
	}
	revalidatePath("/applications");
	redirect("/applications");
}
