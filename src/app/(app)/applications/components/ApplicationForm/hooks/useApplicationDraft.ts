"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
	type DraftSummary,
	listApplicationDraftsAction,
	saveApplicationDraftAction,
} from "@/shared/actions/application-drafts";
import { useUnsavedChanges } from "@/shared/components/UnsavedChangesProvider";
import {
	arePayloadsEqual,
	clearLocalRecovery,
	DRAFT_LOCAL_DEBOUNCE_MS,
	type DraftContext,
	deserializePayload,
	type LocalRecoverySnapshot,
	readLocalRecovery,
	serializeForm,
	writeLocalRecovery,
} from "@/shared/lib/application-draft";
import type { ApplicationFormInput } from "@/shared/schemas/application";
import type { FormApi } from "../types";

type Args = {
	mode: "create" | "edit";
	applicationId?: string;
	form: FormApi;
};

export type DraftPersistence = {
	draftContext: DraftContext;
	drafts: DraftSummary[];
	setDrafts: React.Dispatch<React.SetStateAction<DraftSummary[]>>;
	localRecovery: LocalRecoverySnapshot | null;
	setLocalRecovery: React.Dispatch<
		React.SetStateAction<LocalRecoverySnapshot | null>
	>;
	pickerOpen: boolean;
	setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
	activeDraftId: string | null;
	setActiveDraftId: React.Dispatch<React.SetStateAction<string | null>>;
	applyDraftPayload: (payload: Record<string, unknown>) => void;
	guard: ReturnType<typeof useUnsavedChanges>;
};

export function useApplicationDraft({
	mode,
	applicationId,
	form,
}: Args): DraftPersistence {
	const { watch, getValues, reset } = form;
	const guard = useUnsavedChanges();
	const [drafts, setDrafts] = useState<DraftSummary[]>([]);
	const [localRecovery, setLocalRecovery] =
		useState<LocalRecoverySnapshot | null>(null);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
	const baselineRef = useRef<Record<string, unknown> | null>(null);
	const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const draftContext = useMemo<DraftContext>(
		() =>
			mode === "edit" && applicationId
				? { mode: "EDIT", applicationId }
				: { mode: "CREATE" },
		[mode, applicationId],
	);

	// Establish initial baseline once after first paint (defaults already applied).
	// biome-ignore lint/correctness/useExhaustiveDependencies: only run once on mount
	useEffect(() => {
		if (!baselineRef.current) {
			baselineRef.current = serializeForm(getValues());
			guard.setDirty(false);
		}
	}, []);

	// Subscribe to all field changes to update dirty state and recovery snapshot.
	useEffect(() => {
		const sub = watch((values) => {
			const snap = serializeForm(values as Partial<ApplicationFormInput>);
			const base = baselineRef.current ?? {};
			const dirty = !arePayloadsEqual(snap, base);
			guard.setDirty(dirty);

			if (recoveryTimerRef.current) clearTimeout(recoveryTimerRef.current);
			if (dirty) {
				recoveryTimerRef.current = setTimeout(() => {
					writeLocalRecovery(draftContext, snap);
					setLocalRecovery({
						payload: snap,
						updatedAt: new Date().toISOString(),
						schemaVersion: 1,
					});
				}, DRAFT_LOCAL_DEBOUNCE_MS);
			}
		});
		return () => {
			sub.unsubscribe();
			if (recoveryTimerRef.current) clearTimeout(recoveryTimerRef.current);
		};
	}, [watch, guard, draftContext]);

	// Load drafts + local recovery on mount; open picker if any exist.
	useEffect(() => {
		let cancelled = false;
		const recovery = readLocalRecovery(draftContext);
		if (recovery) setLocalRecovery(recovery);
		listApplicationDraftsAction(draftContext).then((res) => {
			if (cancelled) return;
			if (res.ok) {
				setDrafts(res.data);
				if (res.data.length > 0 || recovery) {
					setPickerOpen(true);
				}
			}
		});
		return () => {
			cancelled = true;
		};
	}, [draftContext]);

	// Register the save-draft handler used by the unsaved-changes dialog.
	useEffect(() => {
		return guard.registerGuard({
			onConfirm: async () => {
				const snap = serializeForm(
					getValues() as Partial<ApplicationFormInput>,
				);
				const res = await saveApplicationDraftAction(draftContext, snap, {
					draftId: activeDraftId ?? undefined,
				});
				if (res.ok) {
					setActiveDraftId(res.data.id);
					clearLocalRecovery(draftContext);
					setLocalRecovery(null);
					return true;
				}
				return false;
			},
		});
	}, [guard, getValues, draftContext, activeDraftId]);

	const applyDraftPayload = (payload: Record<string, unknown>) => {
		const current = getValues();
		const values = { ...current, ...deserializePayload(payload) };
		reset(values as ApplicationFormInput);
		// New baseline = applied draft, so form is not immediately dirty.
		baselineRef.current = serializeForm(
			values as Partial<ApplicationFormInput>,
		);
		guard.setDirty(false);
	};

	return {
		draftContext,
		drafts,
		setDrafts,
		localRecovery,
		setLocalRecovery,
		pickerOpen,
		setPickerOpen,
		activeDraftId,
		setActiveDraftId,
		applyDraftPayload,
		guard,
	};
}
