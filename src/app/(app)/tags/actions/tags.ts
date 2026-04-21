"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/prisma";

export async function createTagAction(
	formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
	const name = String(formData.get("name") ?? "").trim();
	const color = String(formData.get("color") ?? "gray").trim();
	if (!name) return { ok: false, error: "validation.required" };
	await prisma.tag.create({ data: { name, color } });
	revalidatePath("/tags");
	return { ok: true };
}

export async function deleteTagAction(id: string): Promise<void> {
	await prisma.tag.delete({ where: { id } });
	revalidatePath("/tags");
	revalidatePath("/applications");
}
