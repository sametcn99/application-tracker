import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted router stub so the mock can reference it before module load.
const router = vi.hoisted(() => ({
	push: vi.fn(),
	replace: vi.fn(),
	back: vi.fn(),
	forward: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => router,
}));

import {
	UnsavedChangesProvider,
	useUnsavedChanges,
} from "@/shared/components/UnsavedChangesProvider";

function Probe() {
	const { setDirty, requestNavigation, registerGuard } = useUnsavedChanges();
	useEffect(() => registerGuard({ onConfirm: () => true }), [registerGuard]);
	return (
		<div>
			<button type="button" onClick={() => setDirty(true)}>
				dirty
			</button>
			<button type="button" onClick={() => setDirty(false)}>
				clean
			</button>
			<button
				type="button"
				onClick={() => requestNavigation({ kind: "push", href: "/target" })}
			>
				navigate
			</button>
			<a href="/in-app">in-app link</a>
			<a href="https://example.com" target="_blank" rel="noreferrer">
				external link
			</a>
		</div>
	);
}

function renderProvider(onConfirm = vi.fn().mockResolvedValue(true)) {
	const renderDialog = vi.fn(({ open, onStay, onDiscard, onSaveDraft }) => (
		<div data-testid="dialog" data-open={open ? "true" : "false"}>
			<button type="button" onClick={onStay}>
				stay
			</button>
			<button type="button" onClick={onDiscard}>
				discard
			</button>
			<button type="button" onClick={onSaveDraft}>
				save
			</button>
		</div>
	));

	const result = render(
		<UnsavedChangesProvider renderDialog={renderDialog}>
			<Probe />
		</UnsavedChangesProvider>,
	);

	return { ...result, renderDialog, onConfirm };
}

describe("UnsavedChangesProvider", () => {
	beforeEach(() => {
		router.push.mockClear();
		router.replace.mockClear();
		router.back.mockClear();
		router.forward.mockClear();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("navigates immediately when not dirty", async () => {
		const user = userEvent.setup();
		renderProvider();
		await user.click(screen.getByRole("button", { name: "navigate" }));
		expect(router.push).toHaveBeenCalledWith("/target");
		expect(screen.getByTestId("dialog").dataset.open).toBe("false");
	});

	it("opens the guard dialog when dirty and intercepts navigation", async () => {
		const user = userEvent.setup();
		renderProvider();
		await user.click(screen.getByRole("button", { name: "dirty" }));
		await user.click(screen.getByRole("button", { name: "navigate" }));
		expect(router.push).not.toHaveBeenCalled();
		expect(screen.getByTestId("dialog").dataset.open).toBe("true");
	});

	it("discard proceeds and clears dirty state", async () => {
		const user = userEvent.setup();
		renderProvider();
		await user.click(screen.getByRole("button", { name: "dirty" }));
		await user.click(screen.getByRole("button", { name: "navigate" }));
		await user.click(screen.getByRole("button", { name: "discard" }));
		expect(router.push).toHaveBeenCalledWith("/target");
	});

	it("stay cancels the pending navigation", async () => {
		const user = userEvent.setup();
		renderProvider();
		await user.click(screen.getByRole("button", { name: "dirty" }));
		await user.click(screen.getByRole("button", { name: "navigate" }));
		await user.click(screen.getByRole("button", { name: "stay" }));
		expect(router.push).not.toHaveBeenCalled();
		expect(screen.getByTestId("dialog").dataset.open).toBe("false");
	});

	it("intercepts in-app anchor clicks when dirty", async () => {
		const user = userEvent.setup();
		renderProvider();
		await user.click(screen.getByRole("button", { name: "dirty" }));

		const link = screen.getByRole("link", { name: "in-app link" });
		// userEvent clicks on anchors will navigate; use fireEvent so jsdom
		// just dispatches the event the provider listens for.
		fireEvent.click(link);
		expect(router.push).not.toHaveBeenCalled();
		expect(screen.getByTestId("dialog").dataset.open).toBe("true");
	});

	it("ignores external/_blank anchor clicks", async () => {
		const user = userEvent.setup();
		renderProvider();
		await user.click(screen.getByRole("button", { name: "dirty" }));
		fireEvent.click(screen.getByRole("link", { name: "external link" }));
		expect(screen.getByTestId("dialog").dataset.open).toBe("false");
	});
});
