import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ signOut: vi.fn() }));
vi.mock("@/auth", () => auth);

import { signOutAction } from "@/shared/actions/auth";

describe("signOutAction", () => {
	it("delegates to signIn with redirect to /login", async () => {
		auth.signOut.mockResolvedValueOnce(undefined);
		await signOutAction();
		expect(auth.signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
	});
});
