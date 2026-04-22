import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/shared/components/Header", () => ({
	Header: ({ userEmail }: { userEmail?: string | null }) => (
		<div data-testid="header">{userEmail ?? "anonymous"}</div>
	),
}));
vi.mock("@/shared/components/Sidebar", () => ({
	Sidebar: ({
		user,
	}: {
		user?: { email?: string | null; name?: string | null };
	}) => <div data-testid="sidebar">{user?.email ?? "anonymous"}</div>,
}));
vi.mock("@/shared/components/UnsavedChangesShell", () => ({
	UnsavedChangesShell: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="shell">{children}</div>
	),
}));

import { AppShell } from "@/shared/components/AppShell";

describe("AppShell", () => {
	beforeEach(() => {
		authMock.mockReset();
	});

	it("passes session-derived user data to child shell components", async () => {
		authMock.mockResolvedValueOnce({
			user: {
				name: "Samet",
				email: "samet@example.com",
				image: "avatar.png",
			},
		});

		render(
			await AppShell({
				children: <div>dashboard</div>,
			}),
		);

		expect(screen.getByTestId("shell")).toBeTruthy();
		expect(screen.getByTestId("sidebar").textContent).toBe("samet@example.com");
		expect(screen.getByTestId("header").textContent).toBe("samet@example.com");
		expect(screen.getByText("dashboard")).toBeTruthy();
	});

	it("falls back to anonymous props when there is no session", async () => {
		authMock.mockResolvedValueOnce(null);

		render(
			await AppShell({
				children: <div>dashboard</div>,
			}),
		);

		expect(screen.getByTestId("sidebar").textContent).toBe("anonymous");
		expect(screen.getByTestId("header").textContent).toBe("anonymous");
	});
});
