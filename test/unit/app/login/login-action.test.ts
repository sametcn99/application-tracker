import { beforeEach, describe, expect, it, vi } from "vitest";

const { AuthErrorMock } = vi.hoisted(() => {
	class AuthErrorMock extends Error {
		constructor(message?: string) {
			super(message);
			this.name = "AuthError";
		}
	}
	return { AuthErrorMock };
});

const auth = vi.hoisted(() => ({ signIn: vi.fn() }));
const rateLimit = vi.hoisted(() => ({
	assertLoginAllowed: vi.fn(),
	getLoginRateLimitKey: vi.fn(() => "rate-key"),
	recordLoginAttempt: vi.fn(),
	LoginRateLimitError: class LoginRateLimitError extends Error {},
}));
const nav = vi.hoisted(() => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`REDIRECT:${url}`);
	}),
}));
vi.mock("@/auth", () => auth);
vi.mock("next-auth", () => ({ AuthError: AuthErrorMock }));
vi.mock("next/headers", () => ({
	headers: vi.fn(async () => new Headers({ "x-real-ip": "127.0.0.1" })),
}));
vi.mock("next/navigation", () => nav);
vi.mock("@/shared/lib/auth-rate-limit", () => rateLimit);

import { loginAction } from "@/app/login/actions/login";

function makeForm(values: Record<string, string>) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(values)) fd.set(k, v);
	return fd;
}

describe("loginAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("calls signIn with credentials and callback URL", async () => {
		auth.signIn.mockResolvedValueOnce(undefined);
		await expect(
			loginAction(
				null,
				makeForm({
					email: "a@b.com",
					password: "secret",
					callbackUrl: "/dashboard",
				}),
			),
		).rejects.toThrow("REDIRECT:/dashboard");
		expect(rateLimit.assertLoginAllowed).toHaveBeenCalledWith("rate-key");
		expect(auth.signIn).toHaveBeenCalledWith("credentials", {
			email: "a@b.com",
			password: "secret",
			redirect: false,
		});
		expect(rateLimit.recordLoginAttempt).toHaveBeenCalledWith(
			expect.objectContaining({ success: true }),
		);
	});

	it("falls back to / when no callback URL", async () => {
		auth.signIn.mockResolvedValueOnce(undefined);
		await expect(
			loginAction(null, makeForm({ email: "x", password: "y" })),
		).rejects.toThrow("REDIRECT:/");
		expect(auth.signIn).toHaveBeenCalledWith(
			"credentials",
			expect.objectContaining({ redirect: false }),
		);
	});

	it("returns invalidCredentials on AuthError", async () => {
		auth.signIn.mockImplementationOnce(() => {
			throw new AuthErrorMock("bad");
		});
		const res = await loginAction(
			null,
			makeForm({ email: "a", password: "b" }),
		);
		expect(res).toEqual({ error: "auth.invalidCredentials" });
		expect(rateLimit.recordLoginAttempt).toHaveBeenCalledWith(
			expect.objectContaining({ success: false }),
		);
	});

	it("rethrows unknown errors", async () => {
		auth.signIn.mockImplementationOnce(() => {
			throw new Error("network");
		});
		await expect(
			loginAction(null, makeForm({ email: "a", password: "b" })),
		).rejects.toThrow("network");
	});
});
