import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/intl";

const appActions = vi.hoisted(() => ({
	fetchApplicationsAction: vi.fn(),
}));
const router = vi.hoisted(() => ({
	push: vi.fn(),
}));
const searchParamsState = vi.hoisted(() => ({
	value: new URLSearchParams(),
}));

vi.mock("@/shared/actions/applications", () => appActions);
vi.mock("next/navigation", () => ({
	useRouter: () => router,
	useSearchParams: () => searchParamsState.value,
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

import { ApplicationsTable } from "@/app/(app)/applications/components/ApplicationsTable";
import { FiltersBar } from "@/app/(app)/applications/components/FiltersBar";
import { CompaniesTable } from "@/app/(app)/companies/components/CompaniesTable";

let intersectionCallback:
	| ((entries: Array<{ isIntersecting: boolean }>) => void)
	| null = null;

class IntersectionObserverMock {
	constructor(callback: typeof intersectionCallback) {
		intersectionCallback = callback;
	}
	observe() {}
	disconnect() {}
	unobserve() {}
}

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

const appItem = {
	id: "a1",
	company: "Acme",
	position: "Engineer",
	status: "APPLIED",
	priority: "HIGH",
	workMode: "REMOTE",
	location: null,
	salaryMin: 100000,
	salaryMax: 150000,
	currency: "USD",
	source: null,
	appliedAt: new Date("2026-04-20T00:00:00Z"),
	tags: [{ tag: { id: "t1", name: "backend", color: "blue" } }],
};

describe("listing tables", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
		vi.stubGlobal("ResizeObserver", ResizeObserverMock);
		intersectionCallback = null;
		searchParamsState.value = new URLSearchParams(
			"status=APPLIED&sort=appliedAt&order=desc",
		);
	});

	describe("ApplicationsTable", () => {
		it("renders an empty state when there are no items", () => {
			renderWithProviders(
				<ApplicationsTable
					initialItems={[]}
					initialNextCursor={null}
					initialHasMore={false}
					filters={{}}
				/>,
			);
			expect(
				screen.getByText("No applications match your filters."),
			).toBeTruthy();
		});

		it("renders application rows with formatted values and loads more items without duplicates", async () => {
			appActions.fetchApplicationsAction.mockResolvedValueOnce({
				items: [
					appItem,
					{
						...appItem,
						id: "a2",
						position: "Staff Engineer",
						company: "Beta",
					},
				],
				nextCursor: null,
				hasMore: false,
			});

			renderWithProviders(
				<ApplicationsTable
					initialItems={Array.from({ length: 20 }, (_, index) => ({
						...appItem,
						id: `seed-${index}`,
					}))}
					initialNextCursor="cursor-1"
					initialHasMore={true}
					filters={{ status: ["APPLIED"] }}
				/>,
			);

			expect(screen.getAllByText("Engineer").length).toBeGreaterThan(0);
			expect(screen.getAllByText("Acme").length).toBeGreaterThan(0);
			expect(screen.getAllByText("backend").length).toBeGreaterThan(0);
			expect(screen.getAllByText("—").length).toBeGreaterThan(0);
			expect(
				screen.getAllByText("100,000 – 150,000 USD").length,
			).toBeGreaterThan(0);
			expect(screen.getAllByText("20 Apr 2026").length).toBeGreaterThan(0);

			await act(async () => {
				intersectionCallback?.([{ isIntersecting: true }]);
			});

			await waitFor(() => {
				expect(appActions.fetchApplicationsAction).toHaveBeenCalledWith(
					{ status: ["APPLIED"] },
					"cursor-1",
				);
			});

			await waitFor(() => {
				expect(screen.getByText("Staff Engineer")).toBeTruthy();
			});
			expect(screen.getByText("Beta")).toBeTruthy();
		});
	});

	describe("CompaniesTable", () => {
		it("renders empty and populated states", () => {
			const { rerender } = renderWithProviders(
				<CompaniesTable companies={[]} />,
			);
			expect(screen.getByText(/no companies/i)).toBeTruthy();

			rerender(
				<CompaniesTable
					companies={[
						{
							id: "c1",
							name: "Acme",
							industry: null,
							location: "Remote",
							website: "https://acme.test",
							applicationsCount: 3,
						},
					]}
				/>,
			);

			expect(
				screen.getByRole("link", { name: "Acme" }).getAttribute("href"),
			).toBe("/companies/c1");
			expect(screen.getByText("https://acme.test")).toBeTruthy();
			expect(screen.getByText("Remote")).toBeTruthy();
			expect(screen.getAllByText("—").length).toBeGreaterThan(0);
			expect(screen.getByText("3")).toBeTruthy();
		});
	});

	describe("FiltersBar", () => {
		it("pushes updated query strings from search, dates, and reset", async () => {
			const user = userEvent.setup();
			const { container } = renderWithProviders(
				<FiltersBar tags={[{ id: "t1", name: "backend" }]} />,
			);

			const search = screen.getByPlaceholderText(
				"Search company, position, location…",
			);
			await user.clear(search);
			await user.type(search, "remote");
			fireEvent.blur(search);

			await waitFor(() => {
				expect(router.push).toHaveBeenCalledWith(
					expect.stringContaining("q=remote"),
				);
			});

			const [fromInput] = container.querySelectorAll('input[type="date"]');
			fireEvent.change(fromInput as HTMLInputElement, {
				target: { value: "2026-01-01" },
			});
			await waitFor(() => {
				expect(router.push).toHaveBeenCalledWith(
					expect.stringContaining("from=2026-01-01"),
				);
			});

			await user.click(screen.getByRole("button", { name: /reset filters/i }));
			await waitFor(() => {
				expect(router.push).toHaveBeenCalledWith("/applications");
			});
		});
	});
});
