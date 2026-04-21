"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string } | null;

export async function loginAction(
	_prev: LoginState,
	formData: FormData,
): Promise<LoginState> {
	const email = String(formData.get("email") ?? "");
	const password = String(formData.get("password") ?? "");
	const callbackUrl = String(formData.get("callbackUrl") ?? "/");

	try {
		await signIn("credentials", {
			email,
			password,
			redirectTo: callbackUrl || "/",
		});
		return null;
	} catch (e) {
		if (e instanceof AuthError) {
			return { error: "auth.invalidCredentials" };
		}
		throw e;
	}
}
