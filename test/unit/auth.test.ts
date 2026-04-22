import { beforeEach, describe, expect, it, vi } from "vitest";

const bcrypt = vi.hoisted(() => ({ compare: vi.fn() }));
const prisma = vi.hoisted(() => ({ user: { findUnique: vi.fn() } }));
const nextAuth = vi.hoisted(() =>
	vi.fn(() => ({
		handlers: { GET: vi.fn(), POST: vi.fn() },
		signIn: vi.fn(),
		signOut: vi.fn(),
		auth: vi.fn(),
	})),
);
const credentials = vi.hoisted(() => vi.fn((config) => config));

vi.mock("bcryptjs", () => ({ default: bcrypt }));
vi.mock("next-auth", () => ({ default: nextAuth }));
vi.mock("next-auth/providers/credentials", () => ({ default: credentials }));
vi.mock("@/shared/lib/prisma", () => ({ prisma }));

import { auth, handlers, signIn, signOut } from "@/auth";

type AuthConfig = {
	session: { strategy: string };
	pages: { signIn: string };
	providers: Array<{ authorize: (raw: unknown) => Promise<unknown> }>;
	callbacks: {
		jwt: (args: {
			token: Record<string, unknown>;
			user?: { id?: string };
		}) => Promise<Record<string, unknown>>;
		session: (args: {
			session: { user?: Record<string, unknown> };
			token: Record<string, unknown>;
		}) => Promise<{ user?: Record<string, unknown> }>;
	};
};

function getConfig() {
	return nextAuth.mock.calls[0][0] as AuthConfig;
}

describe("auth module", () => {
	beforeEach(() => {
		prisma.user.findUnique.mockReset();
		bcrypt.compare.mockReset();
	});

	it("configures NextAuth with jwt sessions and login page", () => {
		expect(nextAuth).toHaveBeenCalledTimes(1);
		const config = getConfig();
		expect(config.session.strategy).toBe("jwt");
		expect(config.pages.signIn).toBe("/login");
		expect(credentials).toHaveBeenCalledTimes(1);
		expect(handlers).toBeDefined();
		expect(signIn).toBeDefined();
		expect(signOut).toBeDefined();
		expect(auth).toBeDefined();
	});

	it("authorize returns null for invalid credentials payload", async () => {
		const authorize = getConfig().providers[0].authorize;
		await expect(authorize({ email: "bad", password: "" })).resolves.toBeNull();
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
	});

	it("authorize returns null when user is missing", async () => {
		prisma.user.findUnique.mockResolvedValueOnce(null);
		const authorize = getConfig().providers[0].authorize;
		await expect(
			authorize({ email: "a@b.com", password: "secret" }),
		).resolves.toBeNull();
		expect(prisma.user.findUnique).toHaveBeenCalledWith({
			where: { email: "a@b.com" },
		});
	});

	it("authorize returns null when password comparison fails", async () => {
		prisma.user.findUnique.mockResolvedValueOnce({
			id: "u1",
			email: "a@b.com",
			name: "A",
			passwordHash: "hash",
		});
		bcrypt.compare.mockResolvedValueOnce(false);
		const authorize = getConfig().providers[0].authorize;
		await expect(
			authorize({ email: "a@b.com", password: "secret" }),
		).resolves.toBeNull();
	});

	it("authorize returns a sanitized user when credentials are valid", async () => {
		prisma.user.findUnique.mockResolvedValueOnce({
			id: "u1",
			email: "a@b.com",
			name: null,
			passwordHash: "hash",
		});
		bcrypt.compare.mockResolvedValueOnce(true);
		const authorize = getConfig().providers[0].authorize;
		await expect(
			authorize({ email: "a@b.com", password: "secret" }),
		).resolves.toEqual({
			id: "u1",
			email: "a@b.com",
			name: undefined,
		});
	});

	it("jwt callback copies user id onto the token", async () => {
		const token = await getConfig().callbacks.jwt({
			token: { sub: "u1" },
			user: { id: "u1" },
		});
		expect(token.id).toBe("u1");
	});

	it("session callback copies token id onto session.user when present", async () => {
		const session = await getConfig().callbacks.session({
			session: { user: { email: "a@b.com" } },
			token: { id: "u1" },
		});
		expect(session.user?.id).toBe("u1");
	});

	it("session callback leaves session untouched when user is missing", async () => {
		const session = await getConfig().callbacks.session({
			session: {},
			token: { id: "u1" },
		});
		expect(session).toEqual({});
	});
});
