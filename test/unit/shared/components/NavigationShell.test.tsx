import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../helpers/intl";

const pathname = vi.hoisted(() => ({ value: "/applications" }));
const signOutAction = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
	usePathname: () => pathname.value,
}));
vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));
vi.mock("@/shared/actions/auth", () => ({ signOutAction }));

import { Header } from "@/shared/components/Header";
import { Sidebar } from "@/shared/components/Sidebar";

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

describe("Header", () => {
	beforeEach(() => {
		pathname.value = "/applications";
		vi.stubGlobal("ResizeObserver", ResizeObserverMock);
	});

	it("renders menu entries, app name, and the user email", async () => {
		const user = userEvent.setup();
		renderWithProviders(<Header userEmail="samet@example.com" />);

		expect(screen.getByText("Application Tracker")).toBeTruthy();
		await user.click(screen.getAllByRole("button")[0]);

		expect(screen.getByText("Dashboard")).toBeTruthy();
		expect(screen.getByText("Applications")).toBeTruthy();
		expect(screen.getByText("New Application")).toBeTruthy();
		expect(screen.getByText("samet@example.com")).toBeTruthy();
		expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeTruthy();
	});

	it("renders the avatar root when no image exists", () => {
		pathname.value = "/";
		const { container } = renderWithProviders(
			<Header userEmail="samet@example.com" />,
		);
		expect(container.querySelector(".rt-AvatarRoot")).toBeTruthy();
	});
});

describe("Sidebar", () => {
	beforeEach(() => {
		pathname.value = "/companies";
		vi.stubGlobal("ResizeObserver", ResizeObserverMock);
	});

	it("renders navigation, management links, and user actions", async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<Sidebar user={{ name: "Samet", email: "samet@example.com" }} />,
		);

		expect(screen.getByText("Overview")).toBeTruthy();
		expect(screen.getByText("Companies")).toBeTruthy();
		expect(screen.getByText("Management")).toBeTruthy();
		expect(screen.getByText("Tags")).toBeTruthy();

		await user.click(screen.getByRole("button", { name: /management/i }));
		expect(screen.queryByText("Tags")).toBeNull();

		await user.click(screen.getByRole("button", { name: /management/i }));
		expect(screen.getByText("Tags")).toBeTruthy();

		await user.click(
			screen.getByText("Samet").closest("button") as HTMLButtonElement,
		);
		expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeTruthy();
	});

	it("omits the user profile section when no user is provided", () => {
		renderWithProviders(<Sidebar />);
		expect(screen.queryByText("Sign out")).toBeNull();
	});
});
