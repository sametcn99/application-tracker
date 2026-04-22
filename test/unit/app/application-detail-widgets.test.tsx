import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/intl";

const appActions = vi.hoisted(() => ({
	addCommentAction: vi.fn(),
	updateStatusAction: vi.fn(),
	deleteApplicationAction: vi.fn(),
}));
const attachmentActions = vi.hoisted(() => ({
	uploadAttachmentAction: vi.fn(),
	deleteAttachmentAction: vi.fn(),
}));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("@/shared/actions/applications", () => appActions);
vi.mock("@/shared/actions/attachments", () => attachmentActions);
vi.mock("next/navigation", () => ({
	useRouter: () => router,
}));

import { ActivityTimeline } from "@/app/(app)/applications/[id]/components/ActivityTimeline";
import { AddActivityBox } from "@/app/(app)/applications/[id]/components/AddActivityBox";
import { AttachmentList } from "@/app/(app)/applications/[id]/components/AttachmentList";
import { DeleteApplicationButton } from "@/app/(app)/applications/[id]/components/DeleteApplicationButton";
import { StatusSelector } from "@/app/(app)/applications/[id]/components/StatusSelector";

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

describe("application detail widgets", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("ResizeObserver", ResizeObserverMock);
		if (!("hasPointerCapture" in HTMLElement.prototype)) {
			HTMLElement.prototype.hasPointerCapture = () => false;
		}
		if (!("setPointerCapture" in HTMLElement.prototype)) {
			HTMLElement.prototype.setPointerCapture = () => {};
		}
		if (!("releasePointerCapture" in HTMLElement.prototype)) {
			HTMLElement.prototype.releasePointerCapture = () => {};
		}
		if (!("scrollIntoView" in HTMLElement.prototype)) {
			HTMLElement.prototype.scrollIntoView = () => {};
		}
		appActions.addCommentAction.mockResolvedValue({ ok: true });
		appActions.updateStatusAction.mockResolvedValue({ ok: true });
		appActions.deleteApplicationAction.mockResolvedValue(undefined);
		attachmentActions.uploadAttachmentAction.mockResolvedValue({ ok: true });
		attachmentActions.deleteAttachmentAction.mockResolvedValue(undefined);
	});

	describe("AddActivityBox", () => {
		it("ignores blank comments and submits valid ones", async () => {
			const user = userEvent.setup();
			renderWithProviders(<AddActivityBox applicationId="app1" />);

			await user.click(screen.getByRole("button", { name: /add comment/i }));
			expect(appActions.addCommentAction).not.toHaveBeenCalled();

			await user.type(
				screen.getByPlaceholderText("Write a note…"),
				"Hello world",
			);
			await user.click(screen.getByRole("button", { name: /add comment/i }));

			await waitFor(() => {
				expect(appActions.addCommentAction).toHaveBeenCalledWith(
					"app1",
					"Hello world",
				);
			});
			expect(router.refresh).toHaveBeenCalled();
		});

		it("shows an error callout when the action fails", async () => {
			const user = userEvent.setup();
			appActions.addCommentAction.mockResolvedValueOnce({ ok: false });
			renderWithProviders(<AddActivityBox applicationId="app1" />);

			await user.type(screen.getByPlaceholderText("Write a note…"), "Oops");
			await user.click(screen.getByRole("button", { name: /add comment/i }));

			await waitFor(() => {
				expect(screen.getByText("Failed to add activity.")).toBeTruthy();
			});
		});
	});

	describe("StatusSelector", () => {
		it("supports both prop shapes and updates status on selection", async () => {
			const user = userEvent.setup();
			const { rerender } = renderWithProviders(
				<StatusSelector applicationId="app1" status="APPLIED" />,
			);

			await user.click(screen.getByRole("combobox"));
			await user.click(screen.getByRole("option", { name: /interview/i }));

			await waitFor(() => {
				expect(appActions.updateStatusAction).toHaveBeenCalledWith(
					"app1",
					"INTERVIEW",
				);
			});

			rerender(<StatusSelector id="app2" value="SCREENING" />);
			expect(screen.getByRole("combobox")).toBeTruthy();
		});
	});

	describe("DeleteApplicationButton", () => {
		it("opens the dialog and deletes the application", async () => {
			const user = userEvent.setup();
			renderWithProviders(<DeleteApplicationButton id="app1" />);

			await user.click(screen.getByRole("button", { name: /^delete$/i }));
			const dialog = await screen.findByRole("dialog");
			expect(within(dialog).getByText("Delete application?")).toBeTruthy();
			await user.click(
				within(dialog).getAllByRole("button", { name: /^delete$/i })[0],
			);

			await waitFor(() => {
				expect(appActions.deleteApplicationAction).toHaveBeenCalledWith("app1");
			});
		});
	});

	describe("ActivityTimeline", () => {
		it("renders empty state when there is no activity", () => {
			renderWithProviders(<ActivityTimeline entries={[]} />);
			expect(screen.getByText("No activity yet.")).toBeTruthy();
		});

		it("renders markdown comments and translated value changes", () => {
			renderWithProviders(
				<ActivityTimeline
					entries={[
						{
							id: "c1",
							type: "COMMENT",
							field: null,
							oldValue: null,
							newValue: null,
							comment: "**Strong** match",
							createdAt: new Date(),
						},
						{
							id: "s1",
							type: "STATUS_CHANGE",
							field: "status",
							oldValue: '"APPLIED"',
							newValue: '"INTERVIEW"',
							comment: null,
							createdAt: new Date(),
						},
						{
							id: "b1",
							type: "FIELD_CHANGE",
							field: "needsSponsorship",
							oldValue: "true",
							newValue: "false",
							comment: null,
							createdAt: new Date(),
						},
						{
							id: "t1",
							type: "FIELD_CHANGE",
							field: "tags",
							oldValue: '["a","b"]',
							newValue: '["a","c"]',
							comment: null,
							createdAt: new Date(),
						},
					]}
				/>,
			);

			expect(screen.getByText("Strong")).toBeTruthy();
			expect(screen.getAllByText("Applied").length).toBeGreaterThan(0);
			expect(screen.getAllByText("Interview").length).toBeGreaterThan(0);
			expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
			expect(screen.getAllByText("No").length).toBeGreaterThan(0);
			expect(screen.getByText("a, b")).toBeTruthy();
			expect(screen.getByText("a, c")).toBeTruthy();
		});
	});

	describe("AttachmentList", () => {
		it("renders empty state, uploads files, shows translated errors, and deletes attachments", async () => {
			const user = userEvent.setup();
			const { rerender, container } = renderWithProviders(
				<AttachmentList applicationId="app1" attachments={[]} />,
			);
			expect(screen.getByText("No attachments uploaded.")).toBeTruthy();

			const file = new File(["hello"], "resume.pdf", {
				type: "application/pdf",
			});
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			fireEvent.change(input, { target: { files: [file] } });

			await waitFor(() => {
				expect(attachmentActions.uploadAttachmentAction).toHaveBeenCalledTimes(
					1,
				);
			});

			attachmentActions.uploadAttachmentAction.mockResolvedValueOnce({
				ok: false,
				error: "attachments.tooLarge",
			});
			fireEvent.change(input, { target: { files: [file] } });

			await waitFor(() => {
				expect(screen.getByText("File is too large.")).toBeTruthy();
			});

			rerender(
				<AttachmentList
					applicationId="app1"
					attachments={[
						{
							id: "att1",
							fileName: "resume.pdf",
							size: 2048,
							mimeType: "application/pdf",
							createdAt: new Date(),
						},
					]}
				/>,
			);

			expect(
				screen.getByRole("link", { name: "resume.pdf" }).getAttribute("href"),
			).toBe("/api/attachments/att1");
			expect(screen.getByText("2.0 KB")).toBeTruthy();

			const buttons = screen.getAllByRole("button");
			await user.click(buttons[buttons.length - 1]);

			await waitFor(() => {
				expect(attachmentActions.deleteAttachmentAction).toHaveBeenCalledWith(
					"att1",
				);
			});
		});
	});
});
