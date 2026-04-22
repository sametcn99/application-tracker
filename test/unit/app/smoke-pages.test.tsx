import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/intl";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
	vi.fn((url: string) => {
		throw new Error(`REDIRECT:${url}`);
	}),
);
const getLocaleMock = vi.hoisted(() => vi.fn(async () => "en"));
const getMessagesMock = vi.hoisted(() =>
	vi.fn(async () => ({ common: { appName: "Application Tracker" } })),
);
const getTranslationsMock = vi.hoisted(() =>
	vi.fn(async (namespace?: string) => {
		const dict: Record<string, string> = {
			"metadata.title": "Application Tracker",
			"metadata.description": "Track applications",
			"errors.notFound": "Not found",
			"errors.notFoundDescription": "The page you requested does not exist.",
			"errors.backToDashboard": "Back to dashboard",
		};
		return (key: string) =>
			dict[namespace ? `${namespace}.${key}` : key] ?? key;
	}),
);

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next-intl/server", () => ({
	getLocale: getLocaleMock,
	getMessages: getMessagesMock,
	getTranslations: getTranslationsMock,
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
vi.mock("@/app/login/components/LoginForm", () => ({
	LoginForm: ({ callbackUrl }: { callbackUrl: string }) => (
		<div data-testid="login-form">{callbackUrl}</div>
	),
}));
vi.mock("@/shared/components/AppShell", () => ({
	AppShell: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="app-shell">{children}</div>
	),
}));

import ErrorBoundary from "@/app/(app)/error";
import AppLayout from "@/app/(app)/layout";
import Loading from "@/app/(app)/loading";
import RootLayout, { generateMetadata } from "@/app/layout";
import LoginPage from "@/app/login/page";
import NotFound from "@/app/not-found";

describe("app smoke pages", () => {
	it("renders the translated not-found page", async () => {
		render(await NotFound());
		expect(screen.getByText("404")).toBeTruthy();
		expect(screen.getByText("Not found")).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Back to dashboard" })
				.getAttribute("href"),
		).toBe("/");
	});

	it("renders the loading spinner layout", () => {
		const { container } = render(<Loading />);
		expect(container.querySelector(".rt-Spinner")).toBeTruthy();
	});

	it("renders the app error boundary and calls reset", async () => {
		const user = userEvent.setup();
		const reset = vi.fn();
		renderWithProviders(
			<ErrorBoundary error={new Error("boom")} reset={reset} />,
		);
		expect(screen.getByText(/boom/)).toBeTruthy();
		await user.click(screen.getByRole("button", { name: /try again/i }));
		expect(reset).toHaveBeenCalledTimes(1);
	});

	it("redirects authenticated users away from the login page", async () => {
		authMock.mockResolvedValueOnce({ user: { id: "u1" } });
		await expect(
			LoginPage({ searchParams: Promise.resolve({ callbackUrl: "/next" }) }),
		).rejects.toThrow("REDIRECT:/");
	});

	it("renders the login form with the callback url or root fallback", async () => {
		authMock.mockResolvedValueOnce(null);
		render(
			await LoginPage({
				searchParams: Promise.resolve({ callbackUrl: "/next" }),
			}),
		);
		expect(screen.getByTestId("login-form").textContent).toBe("/next");

		authMock.mockResolvedValueOnce(null);
		render(await LoginPage({ searchParams: Promise.resolve({}) }));
		expect(screen.getAllByTestId("login-form")[1].textContent).toBe("/");
	});

	it("builds metadata from translations", async () => {
		await expect(generateMetadata()).resolves.toEqual({
			title: "Application Tracker",
			description: "Track applications",
		});
	});

	it("returns an html root with locale and wrapped children", async () => {
		const ui = await RootLayout({ children: <div>child</div> });
		expect(ui.type).toBe("html");
		expect(ui.props.lang).toBe("en");
	});

	it("wraps app routes in AppShell", () => {
		render(
			<AppLayout>
				<div>inner</div>
			</AppLayout>,
		);
		expect(screen.getByTestId("app-shell").textContent).toContain("inner");
	});
});
