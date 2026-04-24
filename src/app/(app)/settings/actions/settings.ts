"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";
import { changePasswordSchema, preferencesSchema } from "./settings.schema";

type ActionState = {
	ok?: boolean;
	error?: string;
	fieldErrors?: Record<string, string[] | undefined>;
};

function formValue(formData: FormData, key: string) {
	return String(formData.get(key) ?? "");
}

async function requireUserId() {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}
	return session.user.id;
}

export async function changePasswordAction(
	_prev: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const parsed = changePasswordSchema.safeParse({
		currentPassword: formValue(formData, "currentPassword"),
		newPassword: formValue(formData, "newPassword"),
		confirmPassword: formValue(formData, "confirmPassword"),
	});

	if (!parsed.success) {
		return {
			ok: false,
			error: "invalid_data",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}

	const userId = await requireUserId();
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) return { ok: false, error: "auth.unauthorized" };

	const currentPasswordValid = await bcrypt.compare(
		parsed.data.currentPassword,
		user.passwordHash,
	);
	if (!currentPasswordValid) {
		return {
			ok: false,
			error: "invalid_data",
			fieldErrors: { currentPassword: ["settings.currentPasswordInvalid"] },
		};
	}

	const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
	await prisma.user.update({
		where: { id: userId },
		data: { passwordHash },
	});
	revalidatePath("/settings/security");
	return { ok: true };
}

export async function updatePreferencesAction(
	_prev: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const parsed = preferencesSchema.safeParse({
		locale: formValue(formData, "locale"),
		timeZone: formValue(formData, "timeZone"),
		defaultCurrencyCode: formValue(formData, "defaultCurrencyCode"),
	});

	if (!parsed.success) {
		return {
			ok: false,
			error: "invalid_data",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}

	const userId = await requireUserId();
	await prisma.userPreference.upsert({
		where: { userId },
		create: { userId, ...parsed.data },
		update: parsed.data,
	});
	revalidatePath("/settings/preferences");
	return { ok: true };
}
