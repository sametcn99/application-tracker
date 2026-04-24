"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import {
	assertLoginAllowed,
	getLoginRateLimitKey,
	LoginRateLimitError,
	recordLoginAttempt,
} from "@/shared/lib/auth-rate-limit";

export type LoginState = { error?: string } | null;

export async function loginAction(
	_prev: LoginState,
	formData: FormData,
): Promise<LoginState> {
	const email = String(formData.get("email") ?? "")
		.trim()
		.toLowerCase();
	const password = String(formData.get("password") ?? "");
	const rawCallbackUrl = String(formData.get("callbackUrl") ?? "/");
	const callbackUrl = rawCallbackUrl.startsWith("/") ? rawCallbackUrl : "/";
	const requestHeaders = await headers();
	const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0];
	const ipAddress =
		forwardedFor ?? requestHeaders.get("x-real-ip") ?? "unknown";
	const rateLimitKey = getLoginRateLimitKey(email, ipAddress);

	try {
		await assertLoginAllowed(rateLimitKey);
		await signIn("credentials", {
			email,
			password,
			redirect: false,
		});
		await recordLoginAttempt({
			key: rateLimitKey,
			email,
			ipAddress,
			success: true,
		});
	} catch (e) {
		if (e instanceof LoginRateLimitError) {
			return { error: "auth.rateLimited" };
		}

		if (e instanceof AuthError) {
			await recordLoginAttempt({
				key: rateLimitKey,
				email,
				ipAddress,
				success: false,
			});
			return { error: "auth.invalidCredentials" };
		}
		throw e;
	}

	redirect(callbackUrl || "/");
}
