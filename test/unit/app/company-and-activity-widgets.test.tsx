import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatDateTime } from "@/shared/lib/format";
import { renderWithProviders } from "../../helpers/intl";

const activityActions = vi.hoisted(() => ({
	fetchActivitiesAction: vi.fn(),
}));
const companyActions = vi.hoisted(() => ({
	addCompanyNoteAction: vi.fn(),
	deleteCompanyAction: vi.fn(),
}));
const serverIntl = vi.hoisted(() => ({
	translate: vi.fn((key: string) => {
		if (key.endsWith(".MYSTERY")) {
			throw new Error("missing");
		}
		return key;
	}),
}));

vi.mock("@/shared/actions/activity", () => activityActions);
vi.mock("@/app/(app)/companies/actions/companies", () => companyActions);
vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));
vi.mock("next-intl/server", () => ({
	getTranslations: async () => serverIntl.translate,
}));

import { ActivityList } from "@/app/(app)/activity/components/ActivityList";
import { CompanyActivityTimeline } from "@/app/(app)/companies/[id]/components/CompanyActivityTimeline";
import { CompanyApplicationsList } from "@/app/(app)/companies/[id]/components/CompanyApplicationsList";
import { CompanyDetails } from "@/app/(app)/companies/[id]/components/CompanyDetails";
import { DeleteCompanyButton } from "@/app/(app)/companies/[id]/components/DeleteCompanyButton";

let intersectionCallback:
	| ((entries: Array<{ isIntersecting: boolean }>) => void)
	| null = null;

class IntersectionObserverMock {
	constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
		intersectionCallback = callback;
	}
	observe() {}
	disconnect() {}
	unobserve() {}
}

function makeActivity(index: number) {
	return {
		id: `activity-${index}`,
		applicationId: `app-${index}`,
		type: "STATUS_CHANGE",
		field: "status",
		oldValue: '"APPLIED"',
		newValue: '"INTERVIEW"',
		comment: null,
		createdAt: new Date("2025-01-01T10:00:00Z"),
		application: {
			id: `app-${index}`,
			company: `Company ${index}`,
			position: `Role ${index}`,
		},
	};
}

describe("company and activity widgets", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		intersectionCallback = null;
		vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
		vi.stubGlobal(
			"confirm",
			vi.fn(() => true),
		);
		companyActions.addCompanyNoteAction.mockResolvedValue({ ok: true });
		companyActions.deleteCompanyAction.mockResolvedValue(undefined);
		activityActions.fetchActivitiesAction.mockResolvedValue([]);
	});

	describe("ActivityList", () => {
		it("renders an empty state when there are no activities", () => {
			renderWithProviders(<ActivityList initialItems={[]} />);
			expect(screen.getByText("No activity yet.")).toBeTruthy();
		});

		it("renders items and loads more activity without duplicates", async () => {
			activityActions.fetchActivitiesAction.mockResolvedValueOnce([
				makeActivity(0),
				makeActivity(21),
			]);

			renderWithProviders(
				<ActivityList
					initialItems={Array.from({ length: 20 }, (_, index) =>
						makeActivity(index),
					)}
				/>,
			);

			expect(
				screen.getByRole("link", { name: /Role 0/i }).getAttribute("href"),
			).toBe("/applications/app-0");
			expect(screen.getAllByText("Applied").length).toBeGreaterThan(0);
			expect(screen.getAllByText("Interview").length).toBeGreaterThan(0);

			await act(async () => {
				intersectionCallback?.([{ isIntersecting: true }]);
			});

			await waitFor(() => {
				expect(activityActions.fetchActivitiesAction).toHaveBeenCalledWith(
					2,
					20,
				);
			});
			expect(screen.getByRole("link", { name: /Role 21/i })).toBeTruthy();
			expect(screen.queryAllByRole("link", { name: /Role 0/i })).toHaveLength(
				1,
			);
		});
	});

	describe("CompanyActivityTimeline", () => {
		it("adds notes and clears the input after a successful save", async () => {
			const user = userEvent.setup();
			renderWithProviders(
				<CompanyActivityTimeline companyId="company-1" activities={[]} />,
			);

			const textarea = screen.getByPlaceholderText(
				"Quick note about this company…",
			);
			await user.type(textarea, "Follow up next week");
			await user.click(screen.getByRole("button", { name: /add note/i }));

			await waitFor(() => {
				expect(companyActions.addCompanyNoteAction).toHaveBeenCalledWith(
					"company-1",
					"Follow up next week",
				);
			});
			expect((textarea as HTMLTextAreaElement).value).toBe("");
			expect(screen.getByText("—")).toBeTruthy();
		});

		it("renders activity rows and hides linked application comments", () => {
			renderWithProviders(
				<CompanyActivityTimeline
					companyId="company-1"
					activities={[
						{
							id: "1",
							type: "FIELD_CHANGE",
							field: "website",
							oldValue: '"old"',
							newValue: '"new"',
							comment: null,
							createdAt: "2025-01-01T12:00:00Z",
						},
						{
							id: "2",
							type: "NOTE_ADDED",
							field: null,
							oldValue: null,
							newValue: null,
							comment: "Important note",
							createdAt: "2025-01-01T13:00:00Z",
						},
						{
							id: "3",
							type: "LINKED_APPLICATION",
							field: null,
							oldValue: null,
							newValue: null,
							comment: "Hidden comment",
							createdAt: "2025-01-01T14:00:00Z",
						},
					]}
				/>,
			);

			expect(screen.getByText(/old.*new/i)).toBeTruthy();
			expect(screen.getByText("Important note")).toBeTruthy();
			expect(screen.queryByText("Hidden comment")).toBeNull();
		});
	});

	describe("CompanyApplicationsList", () => {
		it("renders empty and populated states", () => {
			const { rerender } = renderWithProviders(
				<CompanyApplicationsList applications={[]} />,
			);
			expect(screen.getByText("No applications linked yet.")).toBeTruthy();

			rerender(
				<CompanyApplicationsList
					applications={[
						{
							id: "app-1",
							position: "Staff Engineer",
							status: "INTERVIEW",
							appliedAt: "2025-01-12T00:00:00Z",
							location: null,
						},
					]}
				/>,
			);

			expect(
				screen
					.getByRole("link", { name: "Staff Engineer" })
					.getAttribute("href"),
			).toBe("/applications/app-1");
			expect(screen.getByText("INTERVIEW")).toBeTruthy();
			expect(screen.getByText("—")).toBeTruthy();
		});
	});

	describe("DeleteCompanyButton", () => {
		it("respects confirm and deletes only when accepted", async () => {
			const user = userEvent.setup();
			const confirmMock = vi
				.fn(() => false)
				.mockReturnValueOnce(false)
				.mockReturnValueOnce(true);
			vi.stubGlobal("confirm", confirmMock);

			renderWithProviders(<DeleteCompanyButton id="company-1" name="Acme" />);

			await user.click(screen.getByRole("button", { name: /delete company/i }));
			expect(companyActions.deleteCompanyAction).not.toHaveBeenCalled();

			await user.click(screen.getByRole("button", { name: /delete company/i }));
			await waitFor(() => {
				expect(companyActions.deleteCompanyAction).toHaveBeenCalledWith(
					"company-1",
				);
			});
			expect(confirmMock).toHaveBeenCalledTimes(2);
		});
	});

	describe("CompanyDetails", () => {
		it("renders rich company details, links, multiline fields, and fallback enum values", async () => {
			const createdAt = new Date("2025-01-01T10:30:00Z");
			const updatedAt = new Date("2025-01-02T11:45:00Z");
			const ui = await CompanyDetails({
				company: {
					name: "Acme",
					legalName: null,
					aliases: "Acme Labs",
					description: "Line one\nLine two",
					tagline: "Build faster",
					foundedYear: 2018,
					companyType: "STARTUP",
					industry: "Fintech",
					subIndustry: null,
					companySize: "SMALL",
					stockSymbol: null,
					parentCompany: null,
					location: "Remote",
					headquarters: null,
					country: "US",
					timezone: "UTC",
					officeLocations: "London\nBerlin",
					website: "https://acme.test",
					careersUrl: null,
					linkedinUrl: null,
					twitterUrl: null,
					githubUrl: "https://github.com/acme",
					glassdoorUrl: null,
					crunchbaseUrl: null,
					blogUrl: null,
					youtubeUrl: null,
					revenue: "$5M",
					fundingStage: "SEED",
					fundingTotal: null,
					valuation: null,
					employeeCount: 42,
					ceo: "Jane Doe",
					techStack: "TypeScript\nPostgres",
					benefits: null,
					workCulture: "Thoughtful",
					remotePolicy: "FULLY_REMOTE",
					hiringStatus: "ACTIVELY_HIRING",
					glassdoorRating: null,
					mainContactName: "Pat",
					mainContactRole: null,
					mainContactEmail: "pat@acme.test",
					mainContactPhone: null,
					mainPhone: null,
					mainEmail: null,
					rating: 5,
					priority: "HIGH",
					trackingStatus: "MYSTERY",
					pros: "Strong team",
					cons: null,
					notes: "Watch this one",
					createdAt,
					updatedAt,
				},
			});

			const { container } = renderWithProviders(ui);

			expect(screen.getByText("companyForm.sections.identity")).toBeTruthy();
			expect(
				screen.getByRole("link", { name: "https://acme.test" }),
			).toBeTruthy();
			expect(
				screen.getByRole("link", { name: "https://github.com/acme" }),
			).toBeTruthy();
			expect(screen.getByText("companyType.STARTUP")).toBeTruthy();
			expect(screen.getByText("MYSTERY")).toBeTruthy();
			expect(container.textContent).toContain("Line one");
			expect(container.textContent).toContain("Line two");
			expect(screen.getByText(formatDateTime(createdAt))).toBeTruthy();
			expect(screen.getByText(formatDateTime(updatedAt))).toBeTruthy();
		});
	});
});
