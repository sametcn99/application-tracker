"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";

const sourceSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "validation.required")
		.max(100, "validation.tooLong"),
});

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateReferencePaths() {
	revalidatePath("/sources");
	revalidatePath("/applications/new");
	revalidatePath("/applications/[id]/edit", "page");
}

export async function createSourceAction(
	formData: FormData,
): Promise<ActionResult> {
	const parsed = sourceSchema.safeParse({
		name: formData.get("name"),
	});

	if (!parsed.success) {
		return {
			ok: false,
			error:
				parsed.error.flatten().fieldErrors.name?.[0] ?? "validation.invalid",
		};
	}

	await prisma.sourceOption.upsert({
		where: { name: parsed.data.name },
		update: {},
		create: { name: parsed.data.name },
	});

	revalidateReferencePaths();
	return { ok: true };
}

export async function deleteSourceAction(id: string): Promise<void> {
	await prisma.sourceOption.delete({ where: { id } });
	revalidateReferencePaths();
}
