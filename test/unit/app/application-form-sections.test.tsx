import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplicationFormInput } from "@/shared/schemas/application";
import { renderWithProviders } from "../../helpers/intl";

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

import { ApplicationPackageSection } from "@/app/(app)/applications/components/ApplicationForm/sections/ApplicationPackageSection";
import { CompanyContextSection } from "@/app/(app)/applications/components/ApplicationForm/sections/CompanyContextSection";
import { ContactSection } from "@/app/(app)/applications/components/ApplicationForm/sections/ContactSection";
import { EligibilitySection } from "@/app/(app)/applications/components/ApplicationForm/sections/EligibilitySection";
import { GeneralSection } from "@/app/(app)/applications/components/ApplicationForm/sections/GeneralSection";
import { NextStepSection } from "@/app/(app)/applications/components/ApplicationForm/sections/NextStepSection";
import { NotesSection } from "@/app/(app)/applications/components/ApplicationForm/sections/NotesSection";
import { OutcomeSection } from "@/app/(app)/applications/components/ApplicationForm/sections/OutcomeSection";
import { SalarySection } from "@/app/(app)/applications/components/ApplicationForm/sections/SalarySection";
import { TagsSection } from "@/app/(app)/applications/components/ApplicationForm/sections/TagsSection";
import type { FormApi } from "@/app/(app)/applications/components/ApplicationForm/types";

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

function FormHarness({
	children,
	defaultValues,
	errors,
}: {
	children: (form: FormApi) => ReactNode;
	defaultValues?: Partial<ApplicationFormInput>;
	errors?: Record<string, string>;
}) {
	const form = useForm<ApplicationFormInput>({
		defaultValues: {
			tagIds: [],
			...defaultValues,
		},
	});

	useEffect(() => {
		for (const [name, message] of Object.entries(errors ?? {})) {
			form.setError(name as keyof ApplicationFormInput, { message });
		}
	}, [errors, form]);

	const values = form.watch();

	return (
		<>
			{children(form as FormApi)}
			<pre data-testid="values">{JSON.stringify(values)}</pre>
		</>
	);
}

describe("application form sections", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("ResizeObserver", ResizeObserverMock);
		const elementPrototype = HTMLElement.prototype as unknown as {
			hasPointerCapture?: (pointerId: number) => boolean;
			setPointerCapture?: (pointerId: number) => void;
			releasePointerCapture?: (pointerId: number) => void;
			scrollIntoView?: () => void;
		};
		elementPrototype.hasPointerCapture ??= () => false;
		elementPrototype.setPointerCapture ??= () => {};
		elementPrototype.releasePointerCapture ??= () => {};
		elementPrototype.scrollIntoView ??= () => {};
	});

	it("renders contact, package, and notes sections with translated errors", () => {
		renderWithProviders(
			<FormHarness
				defaultValues={{
					contactName: "Pat",
					resumeVersion: "Resume v2",
					notes: "Hello notes",
				}}
				errors={{
					contactEmail: "validation.invalidEmail",
					notes: "validation.tooLong",
				}}
			>
				{(form) => (
					<>
						<ContactSection form={form} />
						<ApplicationPackageSection form={form} />
						<NotesSection form={form} />
					</>
				)}
			</FormHarness>,
		);

		expect(screen.getByText("Contact")).toBeTruthy();
		expect(screen.getByPlaceholderText("Jane Doe")).toBeTruthy();
		expect(screen.getByPlaceholderText("jane@example.com")).toBeTruthy();
		expect(screen.getByDisplayValue("Pat")).toBeTruthy();
		expect(screen.getByText("Invalid email address.")).toBeTruthy();
		expect(screen.getByText("Application Package")).toBeTruthy();
		expect(screen.getByPlaceholderText("Resume v3")).toBeTruthy();
		expect(screen.getByDisplayValue("Resume v2")).toBeTruthy();
		expect(screen.getByText("Markdown supported.")).toBeTruthy();
		expect(screen.getByDisplayValue("Hello notes")).toBeTruthy();
		expect(screen.getByText("Value is too long.")).toBeTruthy();
	});

	it("renders salary section links and updates the selected currency", async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<FormHarness defaultValues={{ currency: "USD" }}>
				{(form) => (
					<SalarySection
						form={form}
						currencyOptions={[
							{
								id: "usd",
								code: "USD",
								name: "US Dollar",
								symbol: "$",
								isDefault: true,
								usdRate: 1.2345,
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
						]}
						selectedCurrency={{
							id: "usd",
							code: "USD",
							name: "US Dollar",
							symbol: "$",
							isDefault: true,
							usdRate: 1.2345,
							rateSource: "manual",
							lastSyncedAt: null,
						}}
					/>
				)}
			</FormHarness>,
		);

		expect(
			screen
				.getByRole("link", { name: "Manage currencies" })
				.getAttribute("href"),
		).toBe("/currencies");
		expect(screen.getByText("1 USD = 1.2345 USD")).toBeTruthy();

		await user.click(screen.getByRole("combobox"));
		await user.click(screen.getByRole("option", { name: "EUR - Euro" }));

		await waitFor(() => {
			expect(screen.getByTestId("values").textContent).toContain(
				'"currency":"EUR"',
			);
		});
	});

	it("updates next step and outcome controller values from form inputs", async () => {
		const user = userEvent.setup();
		const { container } = renderWithProviders(
			<FormHarness>
				{(form) => (
					<>
						<NextStepSection form={form} />
						<OutcomeSection form={form} />
					</>
				)}
			</FormHarness>,
		);

		fireEvent.change(
			container.querySelector(
				'input[type="datetime-local"]',
			) as HTMLInputElement,
			{
				target: { value: "2025-02-03T10:30" },
			},
		);
		await user.type(
			screen.getByPlaceholderText("Phone screen with HR"),
			"Booked",
		);

		const comboboxes = screen.getAllByRole("combobox");
		await user.click(comboboxes[0]);
		await user.click(screen.getByRole("option", { name: "Phone screen" }));

		await user.click(comboboxes[1]);
		await user.click(screen.getByRole("option", { name: "Other" }));

		await waitFor(() => {
			expect(screen.getByTestId("values").textContent).toContain(
				'"nextStepAt":"2025-02-03T10:30"',
			);
		});
		expect(screen.getByTestId("values").textContent).toContain(
			'"nextActionType":"PHONE_SCREEN"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"nextStepNote":"Booked"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"outcomeReason":"OTHER"',
		);
	});

	it("shows empty tags state and toggles tag selections", async () => {
		const user = userEvent.setup();
		const emptyRender = renderWithProviders(
			<FormHarness>
				{(form) => <TagsSection form={form} tags={[]} />}
			</FormHarness>,
		);

		expect(
			screen.getByText("No tags yet. Create some on the /tags page."),
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Manage tags" }).getAttribute("href"),
		).toBe("/tags");

		emptyRender.unmount();
		renderWithProviders(
			<FormHarness defaultValues={{ tagIds: ["t1"] }}>
				{(form) => (
					<TagsSection
						form={form}
						tags={[
							{ id: "t1", name: "Backend", color: "blue" },
							{ id: "t2", name: "Remote", color: "green" },
						]}
					/>
				)}
			</FormHarness>,
		);

		const checkboxes = screen.getAllByRole("checkbox");
		await user.click(checkboxes[1]);
		await waitFor(() => {
			expect(screen.getByTestId("values").textContent).toContain(
				'"tagIds":["t1","t2"]',
			);
		});

		await user.click(checkboxes[0]);
		await waitFor(() => {
			expect(screen.getByTestId("values").textContent).toContain(
				'"tagIds":["t2"]',
			);
		});
	});

	it("updates eligibility selections and only renders the authorization note when requested", async () => {
		const user = userEvent.setup();
		const hiddenNote = renderWithProviders(
			<FormHarness>
				{(form) => (
					<EligibilitySection form={form} showWorkAuthorizationNote={false} />
				)}
			</FormHarness>,
		);

		expect(
			screen.queryByPlaceholderText(
				"Detail visa status, work permit, or country restrictions…",
			),
		).toBeNull();
		hiddenNote.unmount();

		renderWithProviders(
			<FormHarness>
				{(form) => <EligibilitySection form={form} showWorkAuthorizationNote />}
			</FormHarness>,
		);

		const comboboxes = screen.getAllByRole("combobox");
		await user.click(comboboxes[0]);
		await user.click(screen.getByRole("option", { name: "Yes" }));
		await user.click(comboboxes[1]);
		await user.click(screen.getByRole("option", { name: "Open" }));
		await user.type(
			screen.getByPlaceholderText(
				"Detail visa status, work permit, or country restrictions…",
			),
			"EU work permit",
		);

		await waitFor(() => {
			expect(screen.getByTestId("values").textContent).toContain(
				'"needsSponsorship":true',
			);
		});
		expect(screen.getByTestId("values").textContent).toContain(
			'"relocationPreference":"OPEN"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"workAuthorizationNote":"EU work permit"',
		);
	});

	it("updates company context fields and select values", async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<FormHarness>
				{(form) => <CompanyContextSection form={form} />}
			</FormHarness>,
		);

		await user.type(
			screen.getByPlaceholderText("Platform Engineering"),
			"Platform",
		);
		await user.type(screen.getByPlaceholderText("Engineering"), "Core");
		await user.type(screen.getByPlaceholderText("Fintech"), "SaaS");
		await user.type(screen.getByPlaceholderText("4"), "5");
		await user.type(screen.getByPlaceholderText("3"), "2");

		const comboboxes = screen.getAllByRole("combobox");
		await user.click(comboboxes[0]);
		await user.click(screen.getByRole("option", { name: "Startup" }));
		await user.click(comboboxes[1]);
		await user.click(screen.getByRole("option", { name: "Email" }));

		await waitFor(() => {
			expect(screen.getByTestId("values").textContent).toContain(
				'"team":"Platform"',
			);
		});
		expect(screen.getByTestId("values").textContent).toContain(
			'"department":"Core"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"companySize":"STARTUP"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"industry":"SaaS"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"applicationMethod":"EMAIL"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"timezoneOverlapHours":"5"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"officeDaysPerWeek":"2"',
		);
	});

	it("matches known companies and auto-fills related company fields", async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<FormHarness
				defaultValues={{
					companyWebsite: "",
					companyCareersUrl: "",
					companyLinkedinUrl: "",
					companyLocation: "",
					industry: "",
				}}
			>
				{(form) => (
					<GeneralSection
						form={form}
						companies={[
							{
								id: "c1",
								name: "Acme Inc",
								normalizedName: "acme inc",
								website: "https://acme.test",
								careersUrl: "https://acme.test/careers",
								linkedinUrl: "https://linkedin.com/company/acme",
								location: "Berlin",
								industry: "Fintech",
								companySize: "STARTUP",
							},
						]}
						sourceOptions={[]}
						showReferralField={false}
					/>
				)}
			</FormHarness>,
		);

		const companyInput = screen.getByPlaceholderText("Acme Inc.");
		await user.type(companyInput, " Acme   Inc ");

		await waitFor(() => {
			expect(screen.getByTestId("values").textContent).toContain(
				'"companyId":"c1"',
			);
		});
		expect(screen.getByTestId("values").textContent).toContain(
			'"companyWebsite":"https://acme.test"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"companyCareersUrl":"https://acme.test/careers"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"companyLinkedinUrl":"https://linkedin.com/company/acme"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"companyLocation":"Berlin"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"industry":"Fintech"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"companySize":"STARTUP"',
		);

		await user.clear(companyInput);
		await user.type(companyInput, "Unknown Company");
		await waitFor(() => {
			expect(screen.getByTestId("values").textContent).toContain(
				'"companyId":""',
			);
		});
	});

	it("updates general form text, date, and select values and shows referral field when requested", async () => {
		const user = userEvent.setup();
		const { container } = renderWithProviders(
			<FormHarness
				defaultValues={{
					workMode: "REMOTE",
					employmentType: "FULL_TIME",
					status: "APPLIED",
					priority: "MEDIUM",
				}}
			>
				{(form) => (
					<GeneralSection
						form={form}
						companies={[]}
						sourceOptions={[{ id: "s1", name: "LinkedIn" }]}
						showReferralField
					/>
				)}
			</FormHarness>,
		);

		expect(
			screen.getByRole("link", { name: "Manage sources" }).getAttribute("href"),
		).toBe("/sources");
		await user.type(
			screen.getByPlaceholderText("Senior Software Engineer"),
			"Platform Engineer",
		);
		await user.type(
			screen.getByPlaceholderText(
				"Paste the job description, responsibilities, benefits, or any notes from the posting…",
			),
			"Great role",
		);
		await user.type(
			screen.getByPlaceholderText("Remote / New York"),
			"Amsterdam",
		);
		fireEvent.change(
			container.querySelector('input[type="date"]') as HTMLInputElement,
			{
				target: { value: "2025-03-05" },
			},
		);
		await user.type(screen.getByPlaceholderText("Jane Doe"), "Mina");
		await user.type(
			screen.getByPlaceholderText("https://…"),
			"https://job.example.com",
		);

		const comboboxes = Array.from(
			container.querySelectorAll('button[role="combobox"]'),
		);
		await user.click(comboboxes[0]);
		await user.click(screen.getByRole("option", { name: "Hybrid" }));
		await user.click(comboboxes[1]);
		await user.click(screen.getByRole("option", { name: "Contract" }));
		await user.click(comboboxes[2]);
		await user.click(screen.getByRole("option", { name: "Interview" }));
		await user.click(comboboxes[3]);
		await user.click(screen.getByRole("option", { name: "High" }));
		await user.click(comboboxes[4]);
		await user.click(screen.getByRole("option", { name: "LinkedIn" }));
		await user.click(comboboxes[5]);
		await user.click(screen.getByRole("option", { name: "Referral" }));

		await waitFor(() => {
			expect(screen.getByTestId("values").textContent).toContain(
				'"position":"Platform Engineer"',
			);
		});
		expect(screen.getByTestId("values").textContent).toContain(
			'"listingDetails":"Great role"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"location":"Amsterdam"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"appliedAt":"2025-03-05"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"referralName":"Mina"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"jobUrl":"https://job.example.com"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"workMode":"HYBRID"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"employmentType":"CONTRACT"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"status":"INTERVIEW"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"priority":"HIGH"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"source":"LinkedIn"',
		);
		expect(screen.getByTestId("values").textContent).toContain(
			'"sourceType":"REFERRAL"',
		);
	});
});
