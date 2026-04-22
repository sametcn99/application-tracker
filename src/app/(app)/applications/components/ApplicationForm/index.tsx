"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button, Callout, Flex } from "@radix-ui/themes";
import { ApplicationDraftPicker } from "@/app/(app)/applications/components/ApplicationForm/components/ApplicationDraftPicker";
import { clearLocalRecovery } from "@/shared/lib/application-draft";
import { useApplicationDraft } from "./hooks/useApplicationDraft";
import { useApplicationFormState } from "./hooks/useApplicationFormState";
import { useApplicationSubmit } from "./hooks/useApplicationSubmit";
import { useTx } from "./hooks/useTx";
import { ApplicationPackageSection } from "./sections/ApplicationPackageSection";
import { CompanyContextSection } from "./sections/CompanyContextSection";
import { CompanyProfileSection } from "./sections/CompanyProfileSection";
import { ContactSection } from "./sections/ContactSection";
import { EligibilitySection } from "./sections/EligibilitySection";
import { GeneralSection } from "./sections/GeneralSection";
import { NextStepSection } from "./sections/NextStepSection";
import { NotesSection } from "./sections/NotesSection";
import { OutcomeSection } from "./sections/OutcomeSection";
import { SalarySection } from "./sections/SalarySection";
import { TagsSection } from "./sections/TagsSection";
import type { ApplicationFormProps } from "./types";

export type { CompanyOption } from "./types";

export function ApplicationForm({
	mode,
	applicationId,
	defaultValues,
	selectedTagIds = [],
	tags,
	sources,
	currencies,
	companies,
}: ApplicationFormProps) {
	const { t, tx } = useTx();
	const {
		form,
		sourceOptions,
		currencyOptions,
		selectedCurrency,
		showReferralField,
		showOutcomeField,
		showWorkAuthorizationNote,
	} = useApplicationFormState({
		mode,
		defaultValues,
		selectedTagIds,
		sources,
		currencies,
	});

	const {
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
	} = useApplicationDraft({ mode, applicationId, form });

	const { onSubmit, pending, topError } = useApplicationSubmit({
		mode,
		applicationId,
		form,
		draftContext,
		guard,
		setLocalRecovery,
		tx,
	});

	const { handleSubmit } = form;

	return (
		<>
			<ApplicationDraftPicker
				open={pickerOpen}
				context={draftContext}
				drafts={drafts}
				localRecovery={localRecovery}
				onClose={() => setPickerOpen(false)}
				onPick={(draft) => {
					applyDraftPayload(draft.payload);
					setActiveDraftId(draft.id);
					setPickerOpen(false);
				}}
				onPickLocalRecovery={(snapshot) => {
					applyDraftPayload(snapshot.payload);
					setPickerOpen(false);
				}}
				onAfterDelete={(id) => {
					setDrafts((prev) => prev.filter((d) => d.id !== id));
					if (activeDraftId === id) setActiveDraftId(null);
				}}
				onAfterDeleteAll={() => {
					setDrafts([]);
					setActiveDraftId(null);
					setPickerOpen(false);
				}}
				onClearLocalRecovery={() => {
					clearLocalRecovery(draftContext);
					setLocalRecovery(null);
				}}
			/>
			<form onSubmit={handleSubmit(onSubmit)}>
				<Flex direction="column" gap="5">
					{topError && (
						<Callout.Root color="red">
							<Callout.Icon>
								<ExclamationTriangleIcon />
							</Callout.Icon>
							<Callout.Text>{topError}</Callout.Text>
						</Callout.Root>
					)}

					<GeneralSection
						form={form}
						companies={companies}
						sourceOptions={sourceOptions}
						showReferralField={showReferralField}
					/>
					<CompanyProfileSection form={form} />
					<SalarySection
						form={form}
						currencyOptions={currencyOptions}
						selectedCurrency={selectedCurrency}
					/>
					<ContactSection form={form} />
					<ApplicationPackageSection form={form} />
					<EligibilitySection
						form={form}
						showWorkAuthorizationNote={showWorkAuthorizationNote}
					/>
					<CompanyContextSection form={form} />
					<NextStepSection form={form} />
					{showOutcomeField ? <OutcomeSection form={form} /> : null}
					<TagsSection form={form} tags={tags} />
					<NotesSection form={form} />

					<Flex gap="3" justify="end" wrap="wrap">
						{drafts.length > 0 || localRecovery ? (
							<Button
								type="button"
								variant="soft"
								color="gray"
								onClick={() => setPickerOpen(true)}
							>
								{t("applicationDrafts.openPicker", { count: drafts.length })}
							</Button>
						) : null}
						<Button
							type="button"
							variant="soft"
							color="gray"
							onClick={() => guard.requestNavigation({ kind: "back" })}
						>
							{t("common.cancel")}
						</Button>
						<Button type="submit" disabled={pending}>
							{pending
								? t("applicationForm.saving")
								: mode === "create"
									? t("applicationForm.saveCreate")
									: t("applicationForm.saveUpdate")}
						</Button>
					</Flex>
				</Flex>
			</form>
		</>
	);
}
