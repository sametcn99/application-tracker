"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { createCoverLetterAction } from "@/app/(app)/cover-letters/actions/cover-letters";
import {
	createApplicationAction,
	updateApplicationAction,
	updateApplicationCoverLetterAction,
} from "@/shared/actions/applications";
import {
	clearLocalRecovery,
	type DraftContext,
	type LocalRecoverySnapshot,
} from "@/shared/lib/application-draft";
import type { ApplicationFormInput } from "@/shared/schemas/application";
import type { FormApi } from "../types";

type Args = {
	mode: "create" | "edit";
	applicationId?: string;
	form: FormApi;
	draftContext: DraftContext;
	guard: {
		setDirty: (dirty: boolean) => void;
		allowNext: () => void;
	};
	setLocalRecovery: React.Dispatch<
		React.SetStateAction<LocalRecoverySnapshot | null>
	>;
	tx: (key: string | undefined) => string | undefined;
};

export function useApplicationSubmit({
	mode,
	applicationId,
	form,
	draftContext,
	guard,
	setLocalRecovery,
	tx,
}: Args) {
	const router = useRouter();
	const t = useTranslations();
	const [pending, startTransition] = useTransition();
	const [topError, setTopError] = useState<string | null>(null);
	const { setError } = form;

	const onSubmit = (values: ApplicationFormInput) => {
		setTopError(null);
		startTransition(async () => {
			const result =
				mode === "create"
					? await createApplicationAction(values)
					: await updateApplicationAction(applicationId!, values);
			if (!result.ok) {
				setTopError(tx(result.error) ?? t("errors.generic"));
				if (result.fieldErrors) {
					for (const [k, v] of Object.entries(result.fieldErrors)) {
						if (v && Array.isArray(v) && v[0])
							setError(k as keyof ApplicationFormInput, { message: v[0] });
					}
				}
			} else {
				const appId = result.id;
				const { saveToLetters, coverLetterTitle, coverLetterContent } = values;
				if (saveToLetters && coverLetterTitle && coverLetterContent) {
					const formData = new FormData();
					formData.append("title", coverLetterTitle);
					formData.append("content", coverLetterContent);
					const letterResult = await createCoverLetterAction(formData);
					if (letterResult.ok) {
						await updateApplicationCoverLetterAction(appId, letterResult.data.id);
					}
				}

				clearLocalRecovery(draftContext);
				setLocalRecovery(null);
				guard.setDirty(false);
				guard.allowNext();
				router.push(`/applications/${appId}`);
			}
		});
	};

	return { onSubmit, pending, topError, setTopError };
}
