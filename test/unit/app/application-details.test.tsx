import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	formatCurrencyAmount,
	formatDate,
	formatDateTime,
	formatSalary,
} from "@/shared/lib/format";
import { renderWithProviders } from "../../helpers/intl";

const serverIntl = vi.hoisted(() => ({
	translate: vi.fn((key: string) => key),
}));

vi.mock("next-intl/server", () => ({
	getTranslations: async () => serverIntl.translate,
}));

import { ApplicationDetails } from "@/app/(app)/applications/[id]/components/ApplicationDetails";

const sharedCurrencies = [
	{
		id: "usd",
		code: "USD",
		name: "US Dollar",
		symbol: "$",
		isDefault: true,
		usdRate: 1,
		rateSource: "manual",
		lastSyncedAt: null,
	},
	{
		id: "eur",
		code: "EUR",
		name: "Euro",
		symbol: "€",
		isDefault: false,
		usdRate: 1,
		rateSource: "manual",
		lastSyncedAt: null,
	},
	{
		id: "gbp",
		code: "GBP",
		name: "Pound Sterling",
		symbol: "£",
		isDefault: false,
		usdRate: 1,
		rateSource: "manual",
		lastSyncedAt: null,
	},
];

function buildApp(overrides: Record<string, unknown> = {}) {
	return {
		company: "Acme",
		position: "Staff Engineer",
		listingDetails: "Line one\nLine two",
		location: "Remote",
		status: "REJECTED",
		workMode: "REMOTE",
		employmentType: "FULL_TIME",
		priority: "HIGH",
		salaryMin: 100000,
		salaryMax: 120000,
		targetSalaryMin: 130000,
		targetSalaryMax: 150000,
		currency: "USD",
		source: "Referral",
		sourceType: "REFERRAL",
		referralName: "Jane Doe",
		jobUrl: "https://jobs.example.com/apply",
		appliedAt: new Date("2025-01-10T00:00:00Z"),
		outcomeReason: "NO_RESPONSE",
		contactName: "Pat Recruiter",
		contactRole: "Recruiter",
		contactEmail: "pat@example.com",
		contactPhone: "+1 555 0101",
		contactProfileUrl: "https://linkedin.com/in/pat",
		resumeVersion: "Resume v2",
		coverLetterVersion: "CL-1",
		portfolioUrl: "https://portfolio.example.com",
		needsSponsorship: true,
		relocationPreference: "OPEN",
		workAuthorizationNote: "Authorized to work in EU",
		team: "Platform",
		department: "Engineering",
		companySize: "STARTUP",
		industry: "Fintech",
		applicationMethod: "EMAIL",
		timezoneOverlapHours: 4,
		officeDaysPerWeek: 2,
		notes: "Keep warm\nStrong fit",
		nextStepAt: new Date("2025-02-01T15:30:00Z"),
		nextStepNote: "Phone screen booked",
		nextActionType: "PHONE_SCREEN",
		...overrides,
	};
}

describe("ApplicationDetails", () => {
	it("renders a full application with converted salaries, links, and populated sections", async () => {
		const app = buildApp();
		const { container } = renderWithProviders(
			await ApplicationDetails({ app, currencies: sharedCurrencies }),
		);

		expect(screen.getByText("applicationDetail.details.overview")).toBeTruthy();
		expect(screen.getByText(formatDate(app.appliedAt))).toBeTruthy();
		expect(screen.getByText("workMode.REMOTE")).toBeTruthy();
		expect(screen.getByText("employmentType.FULL_TIME")).toBeTruthy();
		expect(screen.getByText("sourceType.REFERRAL")).toBeTruthy();
		expect(screen.getByText("priority.HIGH")).toBeTruthy();
		expect(
			screen.getByText(
				formatSalary(app.salaryMin, app.salaryMax, app.currency),
			),
		).toBeTruthy();
		expect(
			screen.getByText(
				formatSalary(app.targetSalaryMin, app.targetSalaryMax, app.currency),
			),
		).toBeTruthy();
		expect(
			screen.getByText("applicationDetail.salaryConversions"),
		).toBeTruthy();
		expect(
			screen.getByText(
				`${formatCurrencyAmount(100000, "EUR")} - ${formatCurrencyAmount(120000, "EUR")}`,
			),
		).toBeTruthy();
		expect(
			screen.getByText(
				`${formatCurrencyAmount(100000, "GBP")} - ${formatCurrencyAmount(120000, "GBP")}`,
			),
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: app.contactProfileUrl }),
		).toBeTruthy();
		expect(screen.getByRole("link", { name: app.portfolioUrl })).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "applicationDetail.details.openJobUrl" })
				.getAttribute("href"),
		).toBe(app.jobUrl);
		expect(screen.getByText("common.yes")).toBeTruthy();
		expect(screen.getByText("relocationPreference.OPEN")).toBeTruthy();
		expect(screen.getByText("companySize.STARTUP")).toBeTruthy();
		expect(screen.getByText("applicationMethod.EMAIL")).toBeTruthy();
		expect(screen.getByText(formatDateTime(app.nextStepAt))).toBeTruthy();
		expect(screen.getByText("nextActionType.PHONE_SCREEN")).toBeTruthy();
		expect(screen.getByText("outcomeReason.NO_RESPONSE")).toBeTruthy();
		expect(screen.getByText("applicationDetail.details.outcome")).toBeTruthy();
		expect(container.textContent).toContain("Line one");
		expect(container.textContent).toContain("Line two");
		expect(container.textContent).toContain("Keep warm");
		expect(container.textContent).toContain("Strong fit");
	});

	it("renders placeholders and hides conditional sections when optional data is missing", async () => {
		const app = buildApp({
			listingDetails: null,
			location: null,
			source: null,
			sourceType: null,
			referralName: null,
			salaryMin: null,
			salaryMax: null,
			targetSalaryMin: null,
			targetSalaryMax: null,
			currency: null,
			jobUrl: null,
			status: "APPLIED",
			outcomeReason: null,
			contactName: null,
			contactRole: null,
			contactEmail: null,
			contactPhone: null,
			contactProfileUrl: null,
			resumeVersion: null,
			coverLetterVersion: null,
			portfolioUrl: null,
			needsSponsorship: null,
			relocationPreference: null,
			workAuthorizationNote: null,
			team: null,
			department: null,
			companySize: null,
			industry: null,
			applicationMethod: null,
			timezoneOverlapHours: null,
			officeDaysPerWeek: null,
			nextStepAt: null,
			nextStepNote: null,
			nextActionType: null,
			notes: null,
		});
		const { container } = renderWithProviders(
			await ApplicationDetails({ app, currencies: sharedCurrencies }),
		);

		expect(screen.getByText("applicationDetail.noListingDetails")).toBeTruthy();
		expect(screen.getByText("applicationDetail.noNotes")).toBeTruthy();
		expect(screen.queryByText("applicationDetail.details.outcome")).toBeNull();
		expect(screen.queryByText("applicationDetail.details.links")).toBeNull();
		expect(
			screen.queryByText("applicationDetail.salaryConversions"),
		).toBeNull();
		expect(
			screen.getAllByText(formatSalary(null, null, null)).length,
		).toBeGreaterThan(0);
		expect(container.textContent).toContain("—");
	});

	it("renders min-only salary conversions and shows outcome when reason exists on an open status", async () => {
		const app = buildApp({
			status: "APPLIED",
			outcomeReason: "OTHER",
			salaryMin: 90000,
			salaryMax: null,
			needsSponsorship: false,
		});

		renderWithProviders(
			await ApplicationDetails({ app, currencies: sharedCurrencies }),
		);

		expect(screen.getByText("applicationDetail.details.outcome")).toBeTruthy();
		expect(screen.getByText("outcomeReason.OTHER")).toBeTruthy();
		expect(screen.getByText("common.no")).toBeTruthy();
		expect(
			screen.getByText(`${formatCurrencyAmount(90000, "EUR")}+`),
		).toBeTruthy();
		expect(
			screen.getByText(`${formatCurrencyAmount(90000, "GBP")}+`),
		).toBeTruthy();
	});

	it("renders max-only salary conversions and shows outcome for withdrawn applications", async () => {
		const app = buildApp({
			status: "WITHDRAWN",
			outcomeReason: null,
			salaryMin: null,
			salaryMax: 80000,
		});

		renderWithProviders(
			await ApplicationDetails({ app, currencies: sharedCurrencies }),
		);

		expect(screen.getByText("applicationDetail.details.outcome")).toBeTruthy();
		expect(screen.getByText("—")).toBeTruthy();
		expect(
			screen.getByText(`≤ ${formatCurrencyAmount(80000, "EUR")}`),
		).toBeTruthy();
		expect(
			screen.getByText(`≤ ${formatCurrencyAmount(80000, "GBP")}`),
		).toBeTruthy();
	});
});
