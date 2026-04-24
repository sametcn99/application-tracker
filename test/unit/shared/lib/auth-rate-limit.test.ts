import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
	loginAttempt: {
		count: vi.fn(),
		create: vi.fn(),
	},
}));

vi.mock("@/shared/lib/prisma", () => ({ prisma }));

import {
	assertLoginAllowed,
	getLoginRateLimitKey,
	LoginRateLimitError,
	recordLoginAttempt,
} from "@/shared/lib/auth-rate-limit";

describe("auth rate limit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("builds a stable hashed key", () => {
		expect(getLoginRateLimitKey("Admin@Example.com", "127.0.0.1")).toBe(
			getLoginRateLimitKey("admin@example.com", "127.0.0.1"),
		);
	});

	it("allows requests below the failed-attempt limit", async () => {
		prisma.loginAttempt.count.mockResolvedValueOnce(4);
		await expect(assertLoginAllowed("key")).resolves.toBeUndefined();
	});

	it("blocks requests at the failed-attempt limit", async () => {
		prisma.loginAttempt.count.mockResolvedValueOnce(5);
		await expect(assertLoginAllowed("key")).rejects.toBeInstanceOf(
			LoginRateLimitError,
		);
	});

	it("records normalized attempts", async () => {
		await recordLoginAttempt({
			key: "key",
			email: "Admin@Example.com",
			ipAddress: "127.0.0.1",
			success: false,
		});
		expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
			data: {
				key: "key",
				email: "admin@example.com",
				ipAddress: "127.0.0.1",
				success: false,
			},
		});
	});
});
