import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { messages, TestProviders } from "../../helpers/intl";

const router = vi.hoisted(() => ({ push: vi.fn() }));
const applicationActions = vi.hoisted(() => ({
	createApplicationAction: vi.fn(),
	updateApplicationAction: vi.fn(),
}));
const draftActions = vi.hoisted(() => ({
	listApplicationDraftsAction: vi.fn(),
	saveApplicationDraftAction: vi.fn(),
}));
const unsavedGuard = vi.hoisted(() => ({
	setDirty: vi.fn(),
	registerGuard: vi.fn(() => vi.fn()),
	allowNext: vi.fn(),
}));
const draftLib = vi.hoisted(() => ({
	DRAFT_LOCAL_DEBOUNCE_MS: 0,
	serializeForm: vi.fn(
		(values: Record<string, unknown> | undefined) => values ?? {},
	),
	arePayloadsEqual: vi.fn(
		(a: Record<string, unknown>, b: Record<string, unknown>) =>
			JSON.stringify(a) === JSON.stringify(b),
	),
	deserializePayload: vi.fn((payload: Record<string, unknown>) => payload),
	readLocalRecovery: vi.fn(),
	writeLocalRecovery: vi.fn(),
	clearLocalRecovery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => router,
}));
vi.mock("@/shared/actions/applications", () => applicationActions);
vi.mock("@/shared/actions/application-drafts", () => draftActions);
vi.mock("@/shared/components/UnsavedChangesProvider", () => ({
	useUnsavedChanges: () => unsavedGuard,
}));
vi.mock("@/shared/lib/application-draft", () => draftLib);

import { useApplicationDraft } from "@/app/(app)/applications/components/ApplicationForm/hooks/useApplicationDraft";
import { useApplicationFormState } from "@/app/(app)/applications/components/ApplicationForm/hooks/useApplicationFormState";
import { useApplicationSubmit } from "@/app/(app)/applications/components/ApplicationForm/hooks/useApplicationSubmit";
import { useTx } from "@/app/(app)/applications/components/ApplicationForm/hooks/useTx";

function translateMessage(key: string) {
	return key
		.split(".")
		.reduce<unknown>(
			(current, part) =>
				current && typeof current === "object"
					? (current as Record<string, unknown>)[part]
					: undefined,
			messages,
		) as string | undefined;
}

function createDraftFormMock(initialValues: Record<string, unknown>) {
	let currentValues = { ...initialValues };
	let watcher: ((values: Record<string, unknown>) => void) | undefined;
	const reset = vi.fn((values: Record<string, unknown>) => {
		currentValues = { ...values };
	});

	return {
		form: {
			watch: vi.fn((callback: (values: Record<string, unknown>) => void) => {
				watcher = callback;
				return { unsubscribe: vi.fn() };
			}),
			getValues: vi.fn(() => currentValues),
			reset,
		},
		getCurrentValues: () => currentValues,
		emit: (values: Record<string, unknown>) => {
			currentValues = { ...values };
			watcher?.(values);
		},
		reset,
	};
}

describe("application form hooks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		router.push.mockReset();
		applicationActions.createApplicationAction.mockResolvedValue({
			ok: true,
			id: "app-created",
		});
		applicationActions.updateApplicationAction.mockResolvedValue({
			ok: true,
			id: "app-updated",
		});
		draftActions.listApplicationDraftsAction.mockResolvedValue({
			ok: true,
			data: [],
		});
		draftActions.saveApplicationDraftAction.mockResolvedValue({
			ok: true,
			data: { id: "draft-1" },
		});
		draftLib.readLocalRecovery.mockReturnValue(null);
	});

	it("translates dotted keys and leaves plain strings alone in useTx", () => {
		const { result } = renderHook(() => useTx(), {
			wrapper: TestProviders,
		});

		expect(result.current.tx(undefined)).toBeUndefined();
		expect(result.current.tx("server_error")).toBe("server_error");
		expect(result.current.tx("errors.generic")).toBe(
			translateMessage("errors.generic"),
		);
	});

	it("builds form state, legacy options, and visibility flags", () => {
		const { result } = renderHook(() =>
			useApplicationFormState({
				mode: "create",
				defaultValues: {
					source: "Legacy Board",
					currency: "GBP",
					sourceType: "REFERRAL",
					status: "REJECTED",
					needsSponsorship: true,
				},
				selectedTagIds: ["tag-1"],
				sources: [{ id: "src-1", name: "LinkedIn" }],
				currencies: [
					{
						id: "cur-1",
						code: "USD",
						name: "US Dollar",
						symbol: "$",
						isDefault: true,
						usdRate: 1,
						rateSource: "api",
						lastSyncedAt: null,
					},
				],
			}),
		);

		expect(result.current.sourceOptions[0]?.name).toBe("Legacy Board");
		expect(result.current.currencyOptions[0]?.code).toBe("GBP");
		expect(result.current.selectedCurrency?.code).toBe("GBP");
		expect(result.current.showReferralField).toBe(true);
		expect(result.current.showOutcomeField).toBe(true);
		expect(result.current.showWorkAuthorizationNote).toBe(true);
		expect(result.current.form.getValues("tagIds")).toEqual(["tag-1"]);
	});

	it("submits create and update flows, surfacing translated errors and field errors", async () => {
		const setError = vi.fn();
		const guard = {
			setDirty: vi.fn(),
			allowNext: vi.fn(),
		};
		const setLocalRecovery = vi.fn();
		const tx = (key: string | undefined) =>
			key ? (translateMessage(key) ?? key) : undefined;

		const { result, rerender } = renderHook(
			(props: { mode: "create" | "edit"; applicationId?: string }) =>
				useApplicationSubmit({
					mode: props.mode,
					applicationId: props.applicationId,
					form: { setError } as never,
					draftContext: { mode: "CREATE" },
					guard,
					setLocalRecovery,
					tx,
				}),
			{
				initialProps: { mode: "create" } as {
					mode: "create" | "edit";
					applicationId?: string;
				},
				wrapper: TestProviders,
			},
		);

		act(() => {
			result.current.onSubmit({
				company: "Acme",
				position: "Engineer",
			} as never);
		});

		await waitFor(() => {
			expect(applicationActions.createApplicationAction).toHaveBeenCalled();
		});
		expect(draftLib.clearLocalRecovery).toHaveBeenCalledWith({
			mode: "CREATE",
		});
		expect(setLocalRecovery).toHaveBeenCalledWith(null);
		expect(guard.setDirty).toHaveBeenCalledWith(false);
		expect(guard.allowNext).toHaveBeenCalled();
		expect(router.push).toHaveBeenCalledWith("/applications/app-created");

		applicationActions.updateApplicationAction.mockResolvedValueOnce({
			ok: false,
			error: "errors.generic",
			fieldErrors: {
				company: ["Required company"],
			},
		});

		rerender({ mode: "edit", applicationId: "app-2" });
		act(() => {
			result.current.onSubmit({ company: "", position: "Engineer" } as never);
		});

		await waitFor(() => {
			expect(applicationActions.updateApplicationAction).toHaveBeenCalledWith(
				"app-2",
				expect.any(Object),
			);
		});
		await waitFor(() => {
			expect(result.current.topError).toBe(translateMessage("errors.generic"));
		});
		expect(setError).toHaveBeenCalledWith("company", {
			message: "Required company",
		});
	});

	it("loads drafts, tracks dirty state, writes recovery, saves via guard, and applies payloads", async () => {
		// vi.useFakeTimers(); // Commented out to use real timers
		const formMock = createDraftFormMock({
			company: "Base Co",
			position: "Base",
		});
		draftActions.listApplicationDraftsAction.mockResolvedValueOnce({
			ok: true,
			data: [
				{ id: "draft-a", label: "Draft A", updatedAt: "2025-01-01T00:00:00Z" },
			],
		});
		draftLib.readLocalRecovery.mockReturnValueOnce({
			payload: { company: "Recovered" },
			updatedAt: "2025-01-01T12:00:00Z",
			schemaVersion: 1,
		});

		const { result } = renderHook(() =>
			useApplicationDraft({
				mode: "edit",
				applicationId: "app-1",
				form: formMock.form as never,
			}),
		);

		await act(async () => {
			await Promise.resolve();
		});

		await waitFor(() => {
			expect(draftActions.listApplicationDraftsAction).toHaveBeenCalledWith({
				mode: "EDIT",
				applicationId: "app-1",
			});
		});
		expect(result.current.localRecovery?.payload).toEqual({
			company: "Recovered",
		});
		expect(result.current.drafts).toHaveLength(1);
		expect(result.current.pickerOpen).toBe(true);

		await act(async () => {
			formMock.emit({ company: "Changed Co", position: "Base" });
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		await waitFor(() => {
			expect(unsavedGuard.setDirty).toHaveBeenCalledWith(true);
		});
		await waitFor(() => {
			expect(draftLib.writeLocalRecovery).toHaveBeenCalledWith(
				{ mode: "EDIT", applicationId: "app-1" },
				{ company: "Changed Co", position: "Base" },
			);
		});

		const registerCalls = unsavedGuard.registerGuard.mock.calls as unknown as [
			[{ onConfirm: () => Promise<boolean> }],
		];
		const registered = registerCalls[0]?.[0];
		expect(registered).toBeDefined();
		let saved = false;
		await act(async () => {
			saved = await registered!.onConfirm();
		});
		expect(saved).toBe(true);
		expect(draftActions.saveApplicationDraftAction).toHaveBeenCalledWith(
			{ mode: "EDIT", applicationId: "app-1" },
			{ company: "Changed Co", position: "Base" },
			{ draftId: undefined },
		);
		expect(draftLib.clearLocalRecovery).toHaveBeenCalledWith({
			mode: "EDIT",
			applicationId: "app-1",
		});
		await waitFor(() => {
			expect(result.current.activeDraftId).toBe("draft-1");
		});

		act(() => {
			result.current.applyDraftPayload({ company: "Draft Co" });
		});

		expect(formMock.reset).toHaveBeenCalledWith({
			company: "Draft Co",
			position: "Base",
		});
		expect(unsavedGuard.setDirty).toHaveBeenLastCalledWith(false);
		// vi.useRealTimers(); // Commented out to avoid fake timer issues
	});
});
