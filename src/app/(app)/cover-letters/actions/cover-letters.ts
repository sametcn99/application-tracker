"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import {
	createCoverLetter,
	deleteCoverLetter,
	updateCoverLetter,
} from "@/shared/lib/cover-letters";
import { coverLetterSchema } from "@/shared/schemas/cover-letter";

const actionSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, "validation.required")
		.max(200, "validation.tooLong"),
	content: z
		.string()
		.trim()
		.min(1, "validation.required")
		.max(50000, "validation.tooLong"),
});

type ActionResult =
	| { ok: true; data: { id: string; title: string; content: string } }
	| { ok: false; error: string };

function revalidateCoverLetterPaths() {
	revalidatePath("/cover-letters");
	revalidatePath("/applications/new");
	revalidatePath("/applications/[id]/edit", "page");
}

async function getCurrentUserId(): Promise<string | null> {
	const session = await auth();
	return session?.user?.id ?? null;
}

export async function createCoverLetterAction(
	formData: FormData,
): Promise<ActionResult> {
	const userId = await getCurrentUserId();
	if (!userId) return { ok: false, error: "unauthorized" };

	const parsed = actionSchema.safeParse({
		title: formData.get("title"),
		content: formData.get("content"),
	});

	if (!parsed.success) {
		return {
			ok: false,
			error:
				parsed.error.flatten().fieldErrors.title?.[0] ??
				parsed.error.flatten().fieldErrors.content?.[0] ??
				"validation.invalid",
		};
	}

	const letter = await createCoverLetter(userId, parsed.data);
	revalidateCoverLetterPaths();
	return {
		ok: true,
		data: { id: letter.id, title: letter.title, content: letter.content },
	};
}

export async function updateCoverLetterAction(
	id: string,
	formData: FormData,
): Promise<ActionResult> {
	const userId = await getCurrentUserId();
	if (!userId) return { ok: false, error: "unauthorized" };

	const parsed = actionSchema.safeParse({
		title: formData.get("title"),
		content: formData.get("content"),
	});

	if (!parsed.success) {
		return {
			ok: false,
			error:
				parsed.error.flatten().fieldErrors.title?.[0] ??
				parsed.error.flatten().fieldErrors.content?.[0] ??
				"validation.invalid",
		};
	}

	const letter = await updateCoverLetter(id, userId, parsed.data);
	if (!letter) {
		return { ok: false, error: "not_found" };
	}
	revalidateCoverLetterPaths();
	return {
		ok: true,
		data: { id: letter.id, title: letter.title, content: letter.content },
	};
}

export async function deleteCoverLetterAction(id: string): Promise<void> {
	const userId = await getCurrentUserId();
	if (!userId) return;
	await deleteCoverLetter(id, userId);
	revalidateCoverLetterPaths();
}
