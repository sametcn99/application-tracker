import { describe, expect, it, vi } from "vitest";

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
vi.mock("@/auth", () => auth);
vi.mock("next-auth", () => ({ AuthError: AuthErrorMock }));

import { loginAction } from "@/app/login/actions/login";

function makeForm(values: Record<string, string>) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(values)) fd.set(k, v);
	return fd;
}

describe("loginAction", () => {
	it("calls signIn with credentials and callback URL", async () => {
		auth.signIn.mockResolvedValueOnce(undefined);
		const res = await loginAction(
			null,
			makeForm({
				email: "a@b.com",
				password: "secret",
				callbackUrl: "/dashboard",
			}),
		);
		expect(res).toBeNull();
		expect(auth.signIn).toHaveBeenCalledWith("credentials", {
			email: "a@b.com",
			password: "secret",
			redirectTo: "/dashboard",
		});
	});

	it("falls back to / when no callback URL", async () => {
		auth.signIn.mockResolvedValueOnce(undefined);
		await loginAction(null, makeForm({ email: "x", password: "y" }));
		expect(auth.signIn).toHaveBeenCalledWith(
			"credentials",
			expect.objectContaining({ redirectTo: "/" }),
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
