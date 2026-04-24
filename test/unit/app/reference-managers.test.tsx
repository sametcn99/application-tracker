import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/intl";

const currencyActions = vi.hoisted(() => ({
	createCurrencyAction: vi.fn(),
	deleteCurrencyAction: vi.fn(),
	setDefaultCurrencyAction: vi.fn(),
}));
const sourceActions = vi.hoisted(() => ({
	createSourceAction: vi.fn(),
	deleteSourceAction: vi.fn(),
}));
const tagActions = vi.hoisted(() => ({
	createTagAction: vi.fn(),
	deleteTagAction: vi.fn(),
}));
const router = vi.hoisted(() => ({
	refresh: vi.fn(),
}));

vi.mock("@/app/(app)/currencies/actions/currencies", () => currencyActions);
vi.mock("@/app/(app)/sources/actions/sources", () => sourceActions);
vi.mock("@/app/(app)/tags/actions/tags", () => tagActions);
vi.mock("next/navigation", () => ({
	useRouter: () => router,
}));

import { CurrencyManager } from "@/app/(app)/currencies/components/CurrencyManager";
import { SourceManager } from "@/app/(app)/sources/components/SourceManager";
import { TagManager } from "@/app/(app)/tags/components/TagManager";

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

function entriesOf(formData: FormData) {
	return Object.fromEntries(formData.entries());
}

describe("reference managers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal(
			"confirm",
			vi.fn(() => true),
		);
		vi.stubGlobal("ResizeObserver", ResizeObserverMock);
		currencyActions.createCurrencyAction.mockResolvedValue({ ok: true });
		currencyActions.deleteCurrencyAction.mockResolvedValue(undefined);
		currencyActions.setDefaultCurrencyAction.mockResolvedValue({ ok: true });
		sourceActions.createSourceAction.mockResolvedValue({
			ok: true,
			data: { id: "source-new", name: "LinkedIn" },
		});
		sourceActions.deleteSourceAction.mockResolvedValue(undefined);
		tagActions.createTagAction.mockResolvedValue({ ok: true });
		tagActions.deleteTagAction.mockResolvedValue(undefined);
	});

	describe("CurrencyManager", () => {
		it("renders the empty state", () => {
			renderWithProviders(<CurrencyManager currencies={[]} />);
			expect(screen.getByText("No currencies added yet.")).toBeTruthy();
		});

		it("submits a new currency and resets the form on success", async () => {
			const user = userEvent.setup();
			renderWithProviders(<CurrencyManager currencies={[]} />);

			await user.type(screen.getByPlaceholderText("EUR"), "eur");
			await user.type(screen.getByPlaceholderText("Euro"), "Euro");
			await user.type(screen.getByPlaceholderText("€"), "EUR");
			await user.type(screen.getByPlaceholderText("1.08"), "1.2");
			await user.click(screen.getByRole("button", { name: /add currency/i }));

			await waitFor(() => {
				expect(currencyActions.createCurrencyAction).toHaveBeenCalledTimes(1);
			});

			const fd = currencyActions.createCurrencyAction.mock
				.calls[0][0] as FormData;
			expect(entriesOf(fd)).toMatchObject({
				code: "eur",
				name: "Euro",
				symbol: "EUR",
				manualUsdRate: "1.2",
			});

			await waitFor(() => {
				expect(screen.getByPlaceholderText("EUR")).toHaveValue("");
				expect(screen.getByPlaceholderText("Euro")).toHaveValue("");
			});
		});

		it("shows translated action errors and supports default/delete actions", async () => {
			const user = userEvent.setup();
			currencyActions.createCurrencyAction.mockResolvedValueOnce({
				ok: false,
				error: "currencies.manualRateRequired",
			});

			renderWithProviders(
				<CurrencyManager
					currencies={[
						{
							id: "usd",
							code: "USD",
							name: "US Dollar",
							symbol: "$",
							isDefault: true,
							usdRate: 1,
							rateSource: "default",
							lastSyncedAt: "2026-04-23T10:00:00Z",
							applicationsCount: 2,
						},
						{
							id: "eur",
							code: "EUR",
							name: "Euro",
							symbol: "€",
							isDefault: false,
							usdRate: 2,
							rateSource: "manual",
							lastSyncedAt: null,
							applicationsCount: 5,
						},
					]}
				/>,
			);

			await user.type(screen.getByPlaceholderText("EUR"), "cad");
			await user.type(screen.getByPlaceholderText("Euro"), "Canadian Dollar");
			await user.click(screen.getByRole("button", { name: /add currency/i }));

			await waitFor(() => {
				expect(
					screen.getByText(
						"Live exchange rate could not be fetched. Enter a manual USD rate.",
					),
				).toBeTruthy();
			});

			expect(screen.getByText("Default selection")).toBeTruthy();
			expect(screen.getAllByText("Approximate equivalents").length).toBe(2);
			expect(screen.getByText(/Last synced/)).toBeTruthy();

			await user.click(screen.getByRole("button", { name: /set default/i }));
			await waitFor(() => {
				expect(currencyActions.setDefaultCurrencyAction).toHaveBeenCalledWith(
					"eur",
				);
			});

			await user.click(
				screen.getAllByRole("button").at(-1) as HTMLButtonElement,
			);
			await waitFor(() => {
				expect(globalThis.confirm).toHaveBeenCalledWith('Delete "EUR"?');
				expect(currencyActions.deleteCurrencyAction).toHaveBeenCalledWith(
					"eur",
				);
			});
		});
	});

	describe("SourceManager", () => {
		it("renders empty state, creates a source, and resets on success", async () => {
			const user = userEvent.setup();
			renderWithProviders(<SourceManager sources={[]} />);
			expect(screen.getByText("No sources added yet.")).toBeTruthy();

			await user.type(
				screen.getByPlaceholderText("e.g. Company website"),
				"LinkedIn",
			);
			await user.click(screen.getByRole("button", { name: /add source/i }));

			await waitFor(() => {
				expect(sourceActions.createSourceAction).toHaveBeenCalledTimes(1);
			});

			const fd = sourceActions.createSourceAction.mock.calls[0][0] as FormData;
			expect(entriesOf(fd)).toMatchObject({ name: "LinkedIn" });
			await waitFor(() => {
				expect(screen.getByPlaceholderText("e.g. Company website")).toHaveValue(
					"",
				);
			});
		});

		it("shows translated validation errors and deletes after confirmation", async () => {
			const user = userEvent.setup();
			sourceActions.createSourceAction.mockResolvedValueOnce({
				ok: false,
				error: "validation.required",
			});
			renderWithProviders(
				<SourceManager
					sources={[{ id: "s1", name: "Referral", applicationsCount: 3 }]}
				/>,
			);

			await user.type(
				screen.getByPlaceholderText("e.g. Company website"),
				"   ",
			);
			await user.click(screen.getByRole("button", { name: /add source/i }));
			await waitFor(() => {
				expect(screen.getByText("This field is required.")).toBeTruthy();
			});

			await user.click(
				screen.getAllByRole("button").at(-1) as HTMLButtonElement,
			);
			await waitFor(() => {
				expect(globalThis.confirm).toHaveBeenCalledWith('Delete "Referral"?');
				expect(sourceActions.deleteSourceAction).toHaveBeenCalledWith("s1");
			});
		});
	});

	describe("TagManager", () => {
		it("renders empty state and creates a tag with the default color", async () => {
			const user = userEvent.setup();
			renderWithProviders(<TagManager tags={[]} />);
			expect(screen.getByText("No tags yet.")).toBeTruthy();

			await user.type(screen.getByPlaceholderText("e.g. backend"), "backend");
			await user.click(screen.getByRole("button", { name: /^add$/i }));

			await waitFor(() => {
				expect(tagActions.createTagAction).toHaveBeenCalledTimes(1);
			});

			const fd = tagActions.createTagAction.mock.calls[0][0] as FormData;
			expect(entriesOf(fd)).toMatchObject({ name: "backend", color: "gray" });
			await waitFor(() => {
				expect(screen.getByPlaceholderText("e.g. backend")).toHaveValue("");
			});
		});

		it("shows action errors, renders the table, and deletes after confirmation", async () => {
			const user = userEvent.setup();
			tagActions.createTagAction.mockResolvedValueOnce({
				ok: false,
				error: "validation.required",
			});

			renderWithProviders(
				<TagManager
					tags={[
						{
							id: "t1",
							name: "frontend",
							color: "blue",
							_count: { applications: 4 },
						},
					]}
				/>,
			);

			await user.type(screen.getByPlaceholderText("e.g. backend"), "   ");
			await user.click(screen.getByRole("button", { name: /^add$/i }));
			await waitFor(() => {
				expect(screen.getByText("This field is required.")).toBeTruthy();
			});

			expect(screen.getByText("frontend")).toBeTruthy();
			expect(screen.getAllByText("blue").length).toBeGreaterThan(0);
			expect(screen.getByText("4 applications")).toBeTruthy();

			await user.click(
				screen.getAllByRole("button").at(-1) as HTMLButtonElement,
			);
			await waitFor(() => {
				expect(globalThis.confirm).toHaveBeenCalledWith('Delete "frontend"?');
				expect(tagActions.deleteTagAction).toHaveBeenCalledWith("t1");
			});
		});
	});
});
