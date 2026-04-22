import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UnsavedChangesDialog } from "@/shared/components/UnsavedChangesDialog";
import { renderWithProviders } from "../../../helpers/intl";

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => {
		resolve = r;
	});
	return { promise, resolve };
}

describe("UnsavedChangesDialog", () => {
	it("renders the warning copy and action buttons", () => {
		renderWithProviders(
			<UnsavedChangesDialog
				open
				onStay={vi.fn()}
				onDiscard={vi.fn()}
				onSaveDraft={vi.fn()}
			/>,
		);

		expect(screen.getByText("Unsaved changes")).toBeTruthy();
		expect(screen.getByText("Stay on page")).toBeTruthy();
		expect(screen.getByText("Discard changes")).toBeTruthy();
		expect(screen.getByText("Save as draft")).toBeTruthy();
	});

	it("shows a loading label while saving a draft", async () => {
		const user = userEvent.setup();
		const save = deferred();
		renderWithProviders(
			<UnsavedChangesDialog
				open
				onStay={vi.fn()}
				onDiscard={vi.fn()}
				onSaveDraft={() => save.promise}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Save as draft" }));
		expect(screen.getAllByText("Loading…").length).toBeGreaterThan(0);
		save.resolve();
		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: "Save as draft" }),
			).toBeTruthy();
		});
	});

	it("shows a loading label while discarding changes", async () => {
		const user = userEvent.setup();
		const discard = deferred();
		renderWithProviders(
			<UnsavedChangesDialog
				open
				onStay={vi.fn()}
				onDiscard={() => discard.promise}
				onSaveDraft={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Discard changes" }));
		expect(screen.getAllByText("Loading…").length).toBeGreaterThan(0);
		discard.resolve();
		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: "Discard changes" }),
			).toBeTruthy();
		});
	});
});
