import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../helpers/intl";

const providerSpy = vi.hoisted(() => vi.fn());

vi.mock("@/shared/components/UnsavedChangesProvider", () => ({
	UnsavedChangesProvider: ({
		children,
		renderDialog,
		beforeUnloadMessage,
	}: {
		children: React.ReactNode;
		renderDialog: (props: {
			open: boolean;
			onStay: () => void;
			onDiscard: () => void;
			onSaveDraft: () => void;
		}) => React.ReactNode;
		beforeUnloadMessage?: string;
	}) => {
		providerSpy(beforeUnloadMessage);
		return (
			<div>
				<div data-testid="provider">{children}</div>
				{renderDialog({
					open: true,
					onStay: vi.fn(),
					onDiscard: vi.fn(),
					onSaveDraft: vi.fn(),
				})}
			</div>
		);
	},
}));

import { UnsavedChangesShell } from "@/shared/components/UnsavedChangesShell";

describe("UnsavedChangesShell", () => {
	it("wires the provider with the dialog renderer and unload message", () => {
		renderWithProviders(
			<UnsavedChangesShell>
				<div>content</div>
			</UnsavedChangesShell>,
		);

		expect(providerSpy).toHaveBeenCalledWith("You have unsaved changes.");
		expect(screen.getByTestId("provider").textContent).toContain("content");
		expect(screen.getByText("Unsaved changes")).toBeTruthy();
	});
});
