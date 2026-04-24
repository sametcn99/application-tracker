import { createHash } from "node:crypto";
import { prisma } from "./prisma";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export class LoginRateLimitError extends Error {
	constructor() {
		super("Too many login attempts");
		this.name = "LoginRateLimitError";
	}
}

export function getLoginRateLimitKey(email: string, ipAddress?: string | null) {
	const normalizedEmail = email.trim().toLowerCase();
	const normalizedIp = (ipAddress ?? "unknown").trim() || "unknown";
	return createHash("sha256")
		.update(`${normalizedEmail}:${normalizedIp}`)
		.digest("hex");
}

export async function assertLoginAllowed(key: string) {
	const since = new Date(Date.now() - LOGIN_WINDOW_MS);
	const failedAttempts = await prisma.loginAttempt.count({
		where: {
			key,
			success: false,
			createdAt: { gte: since },
		},
	});

	if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
		throw new LoginRateLimitError();
	}
}

export async function recordLoginAttempt(input: {
	key: string;
	email: string;
	ipAddress?: string | null;
	success: boolean;
}) {
	await prisma.loginAttempt.create({
		data: {
			key: input.key,
			email: input.email.trim().toLowerCase(),
			ipAddress: input.ipAddress ?? null,
			success: input.success,
		},
	});
}
