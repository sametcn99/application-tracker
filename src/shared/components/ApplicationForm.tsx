"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import {
	Box,
	Button,
	Callout,
	Card,
	Checkbox,
	Flex,
	Grid,
	Heading,
	Select,
	Text,
	TextArea,
	TextField,
} from "@radix-ui/themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	type DraftSummary,
	listApplicationDraftsAction,
	saveApplicationDraftAction,
} from "@/shared/actions/application-drafts";
import {
	createApplicationAction,
	updateApplicationAction,
} from "@/shared/actions/applications";
import { ApplicationDraftPicker } from "@/shared/components/ApplicationDraftPicker";
import { useUnsavedChanges } from "@/shared/components/UnsavedChangesProvider";
import {
	APPLICATION_METHODS,
	COMPANY_SIZES,
	EMPLOYMENT_TYPES,
	NEXT_ACTION_TYPES,
	OUTCOME_REASONS,
	PRIORITIES,
	RELOCATION_PREFERENCES,
	SOURCE_TYPES,
	STATUSES,
	WORK_MODES,
} from "@/shared/constants/application";
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
import { toDateInput, toDateTimeInput } from "@/shared/lib/format";
import {
	type CurrencyOptionRecord,
	formatCurrencyOptionLabel,
	type SourceOptionRecord,
} from "@/shared/lib/reference-data.shared";
import {
	type ApplicationFormInput,
	applicationFormSchema,
} from "@/shared/schemas/application";

type Tag = { id: string; name: string; color: string };

export type CompanyOption = {
	id: string;
	name: string;
	normalizedName: string;
	website: string | null;
	careersUrl: string | null;
	linkedinUrl: string | null;
	location: string | null;
	industry: string | null;
	companySize: string | null;
};

const NONE_VALUE = "__none__";

function normalizeCompanyName(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, " ");
}

type Props = {
	mode: "create" | "edit";
	applicationId?: string;
	defaultValues?: Partial<ApplicationFormInput>;
	selectedTagIds?: string[];
	tags: Tag[];
	sources: SourceOptionRecord[];
	currencies: CurrencyOptionRecord[];
	companies: CompanyOption[];
};

export function ApplicationForm({
	mode,
	applicationId,
	defaultValues,
	selectedTagIds = [],
	tags,
	sources,
	currencies,
	companies,
}: Props) {
	const router = useRouter();
	const t = useTranslations();
	const [pending, startTransition] = useTransition();
	const [topError, setTopError] = useState<string | null>(null);

	const draftContext = useMemo<DraftContext>(
		() =>
			mode === "edit" && applicationId
				? { mode: "EDIT", applicationId }
				: { mode: "CREATE" },
		[mode, applicationId],
	);
	const guard = useUnsavedChanges();
	const [drafts, setDrafts] = useState<DraftSummary[]>([]);
	const [localRecovery, setLocalRecovery] =
		useState<LocalRecoverySnapshot | null>(null);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
	const baselineRef = useRef<Record<string, unknown> | null>(null);
	const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		setError,
		watch,
		reset,
		getValues,
		setValue,
	} = useForm<ApplicationFormInput>({
		// biome-ignore lint/suspicious/noExplicitAny: using any to force zodResolver to accept our schema
		resolver: zodResolver(applicationFormSchema as any) as any,
		defaultValues: {
			company: "",
			position: "",
			location: "",
			workMode: "REMOTE",
			employmentType: "FULL_TIME",
			priority: "MEDIUM",
			currency: "USD",
			status: "APPLIED",
			appliedAt: new Date().toISOString().slice(0, 10) as unknown as Date,
			tagIds: selectedTagIds,
			...defaultValues,
		},
	});

	const tx = (key: string | undefined): string | undefined => {
		if (!key) return undefined;
		if (key.includes(".")) return t(key as never);
		return key;
	};

	const sourceOptions = [...sources];
	if (
		defaultValues?.source &&
		!sourceOptions.some((source) => source.name === defaultValues.source)
	) {
		sourceOptions.unshift({
			id: "__legacy_source__",
			name: defaultValues.source,
		});
	}

	const currencyOptions = [...currencies];
	if (
		defaultValues?.currency &&
		!currencyOptions.some(
			(currency) => currency.code === defaultValues.currency,
		)
	) {
		currencyOptions.unshift({
			id: "__legacy_currency__",
			code: defaultValues.currency,
			name: defaultValues.currency,
			symbol: null,
			usdRate: null,
			rateSource: "legacy",
			lastSyncedAt: null,
		});
	}

	const selectedCurrency = currencyOptions.find(
		(currency) => currency.code === watch("currency"),
	);
	const selectedSourceType = watch("sourceType");
	const referralName = watch("referralName");
	const selectedStatus = watch("status");
	const selectedOutcomeReason = watch("outcomeReason");
	const selectedNeedsSponsorship = watch("needsSponsorship");
	const workAuthorizationNote = watch("workAuthorizationNote");
	const showReferralField =
		selectedSourceType === "REFERRAL" || Boolean(referralName);
	const showOutcomeField =
		selectedStatus === "REJECTED" ||
		selectedStatus === "WITHDRAWN" ||
		Boolean(selectedOutcomeReason);
	const showWorkAuthorizationNote =
		selectedNeedsSponsorship === true || Boolean(workAuthorizationNote);

	// --- Draft + dirty tracking -------------------------------------------------

	const initBaseline = (values: Partial<ApplicationFormInput>) => {
		baselineRef.current = serializeForm(values);
		guard.setDirty(false);
	};

	// Establish initial baseline once after first paint (defaults already applied).
	// biome-ignore lint/correctness/useExhaustiveDependencies: only run once on mount
	useEffect(() => {
		if (!baselineRef.current) {
			initBaseline(getValues());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
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

	const onSubmit = (values: ApplicationFormInput) => {
		setTopError(null);
		startTransition(async () => {
			const result =
				mode === "create"
					? await createApplicationAction(values)
					: await updateApplicationAction(applicationId!, values);
			if (result && !result.ok) {
				setTopError(tx(result.error) ?? t("errors.generic"));
				if (result.fieldErrors) {
					for (const [k, v] of Object.entries(result.fieldErrors)) {
						if (v && Array.isArray(v) && v[0])
							setError(k as keyof ApplicationFormInput, { message: v[0] });
					}
				}
			} else if (result && result.ok) {
				clearLocalRecovery(draftContext);
				setLocalRecovery(null);
				guard.setDirty(false);
				guard.allowNext();
				router.push(`/applications/${result.id}`);
			}
		});
	};

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

					<Card>
						<Flex direction="column" gap="3">
							<Heading size="4">
								{t("applicationForm.sections.general")}
							</Heading>
							<Grid columns={{ initial: "1", sm: "2" }} gap="3">
								<Field
									label={`${t("fields.company")} *`}
									error={tx(errors.company?.message)}
								>
									<TextField.Root
										{...register("company", {
											onChange: (e) => {
												const v = (e.target as HTMLInputElement).value;
												const norm = normalizeCompanyName(v);
												const match = companies.find(
													(c) => c.normalizedName === norm,
												);
												if (match) {
													if (getValues("companyId") !== match.id) {
														setValue("companyId", match.id, {
															shouldDirty: true,
														});
														if (!getValues("companyWebsite") && match.website) {
															setValue("companyWebsite", match.website, {
																shouldDirty: true,
															});
														}
														if (
															!getValues("companyCareersUrl") &&
															match.careersUrl
														) {
															setValue("companyCareersUrl", match.careersUrl, {
																shouldDirty: true,
															});
														}
														if (
															!getValues("companyLinkedinUrl") &&
															match.linkedinUrl
														) {
															setValue(
																"companyLinkedinUrl",
																match.linkedinUrl,
																{ shouldDirty: true },
															);
														}
														if (
															!getValues("companyLocation") &&
															match.location
														) {
															setValue("companyLocation", match.location, {
																shouldDirty: true,
															});
														}
														if (!getValues("industry") && match.industry) {
															setValue("industry", match.industry, {
																shouldDirty: true,
															});
														}
														if (
															!getValues("companySize") &&
															match.companySize
														) {
															setValue(
																"companySize",
																match.companySize as never,
																{ shouldDirty: true },
															);
														}
													}
												} else if (getValues("companyId")) {
													setValue("companyId", "", { shouldDirty: true });
												}
											},
										})}
										placeholder={t("applicationForm.placeholders.company")}
										list="company-options"
									/>
									<datalist id="company-options">
										{companies.map((c) => (
											<option key={c.id} value={c.name} />
										))}
									</datalist>
								</Field>
								<Field
									label={`${t("fields.position")} *`}
									error={tx(errors.position?.message)}
								>
									<TextField.Root
										{...register("position")}
										placeholder={t("applicationForm.placeholders.position")}
									/>
								</Field>
								<Box style={{ gridColumn: "1 / -1" }}>
									<Field
										label={t("fields.listingDetails")}
										error={tx(errors.listingDetails?.message)}
									>
										<TextArea
											{...register("listingDetails")}
											rows={6}
											placeholder={t(
												"applicationForm.placeholders.listingDetails",
											)}
										/>
									</Field>
								</Box>
								<Field
									label={t("fields.location")}
									error={tx(errors.location?.message)}
								>
									<TextField.Root
										{...register("location")}
										placeholder={t("applicationForm.placeholders.location")}
									/>
								</Field>
								<Field
									label={t("fields.workMode")}
									error={tx(errors.workMode?.message)}
								>
									<Controller
										control={control}
										name="workMode"
										render={({ field }) => (
											<Select.Root
												value={field.value}
												onValueChange={field.onChange}
											>
												<Select.Trigger />
												<Select.Content>
													{WORK_MODES.map((m) => (
														<Select.Item key={m} value={m}>
															{t(`workMode.${m}`)}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
								<Field
									label={t("fields.employmentType")}
									error={tx(errors.employmentType?.message)}
								>
									<Controller
										control={control}
										name="employmentType"
										render={({ field }) => (
											<Select.Root
												value={field.value}
												onValueChange={field.onChange}
											>
												<Select.Trigger />
												<Select.Content>
													{EMPLOYMENT_TYPES.map((m) => (
														<Select.Item key={m} value={m}>
															{t(`employmentType.${m}`)}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
								<Field
									label={t("fields.status")}
									error={tx(errors.status?.message)}
								>
									<Controller
										control={control}
										name="status"
										render={({ field }) => (
											<Select.Root
												value={field.value}
												onValueChange={field.onChange}
											>
												<Select.Trigger />
												<Select.Content>
													{STATUSES.map((s) => (
														<Select.Item key={s} value={s}>
															{t(`status.${s}`)}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
								<Field
									label={t("fields.priority")}
									error={tx(errors.priority?.message)}
								>
									<Controller
										control={control}
										name="priority"
										render={({ field }) => (
											<Select.Root
												value={field.value}
												onValueChange={field.onChange}
											>
												<Select.Trigger />
												<Select.Content>
													{PRIORITIES.map((priority) => (
														<Select.Item key={priority} value={priority}>
															{t(`priority.${priority}`)}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
								<Field
									label={t("fields.appliedAt")}
									error={tx(errors.appliedAt?.message as string | undefined)}
								>
									<Controller
										control={control}
										name="appliedAt"
										render={({ field }) => (
											<TextField.Root
												type="date"
												value={toDateInput(field.value as unknown as Date)}
												onChange={(e) => field.onChange(e.target.value)}
											/>
										)}
									/>
								</Field>
								<Field
									label={
										<FieldLabelWithLink
											label={t("fields.source")}
											href="/sources"
											linkLabel={t("applicationForm.manageSources")}
										/>
									}
									error={tx(errors.source?.message)}
								>
									<Controller
										control={control}
										name="source"
										render={({ field }) => (
											<Select.Root
												value={field.value ?? NONE_VALUE}
												onValueChange={(value) =>
													field.onChange(
														value === NONE_VALUE ? undefined : value,
													)
												}
											>
												<Select.Trigger
													placeholder={t("applicationForm.selectSource")}
												/>
												<Select.Content>
													<Select.Item value={NONE_VALUE}>
														{t("applicationForm.notSpecified")}
													</Select.Item>
													{sourceOptions.map((source) => (
														<Select.Item key={source.id} value={source.name}>
															{source.name}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
								<Field
									label={t("fields.sourceType")}
									error={tx(errors.sourceType?.message)}
								>
									<Controller
										control={control}
										name="sourceType"
										render={({ field }) => (
											<Select.Root
												value={field.value ?? NONE_VALUE}
												onValueChange={(value) =>
													field.onChange(
														value === NONE_VALUE ? undefined : value,
													)
												}
											>
												<Select.Trigger
													placeholder={t("applicationForm.selectSourceType")}
												/>
												<Select.Content>
													<Select.Item value={NONE_VALUE}>
														{t("applicationForm.notSpecified")}
													</Select.Item>
													{SOURCE_TYPES.map((sourceType) => (
														<Select.Item key={sourceType} value={sourceType}>
															{t(`sourceType.${sourceType}`)}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
								{showReferralField ? (
									<Field
										label={t("fields.referralName")}
										error={tx(errors.referralName?.message)}
									>
										<TextField.Root
											{...register("referralName")}
											placeholder={t(
												"applicationForm.placeholders.referralName",
											)}
										/>
									</Field>
								) : null}
								<Field
									label={t("fields.jobUrl")}
									error={tx(errors.jobUrl?.message)}
								>
									<TextField.Root
										{...register("jobUrl")}
										placeholder={t("applicationForm.placeholders.jobUrl")}
									/>
								</Field>
							</Grid>
						</Flex>
					</Card>

					<Card>
						<Flex direction="column" gap="3">
							<Heading size="4">{t("companies.profile")}</Heading>
							<Text size="1" color="gray">
								{watch("companyId")
									? t("companies.hydrateHint")
									: t("companies.newWillBeCreated")}
							</Text>
							<Grid columns={{ initial: "1", sm: "2" }} gap="3">
								<Field
									label={t("fields.companyWebsite")}
									error={tx(errors.companyWebsite?.message)}
								>
									<TextField.Root {...register("companyWebsite")} />
								</Field>
								<Field
									label={t("fields.companyCareersUrl")}
									error={tx(errors.companyCareersUrl?.message)}
								>
									<TextField.Root {...register("companyCareersUrl")} />
								</Field>
								<Field
									label={t("fields.companyLinkedinUrl")}
									error={tx(errors.companyLinkedinUrl?.message)}
								>
									<TextField.Root {...register("companyLinkedinUrl")} />
								</Field>
								<Field
									label={t("fields.companyLocation")}
									error={tx(errors.companyLocation?.message)}
								>
									<TextField.Root {...register("companyLocation")} />
								</Field>
							</Grid>
						</Flex>
					</Card>

					<Card>
						<Flex direction="column" gap="3">
							<Heading size="4">{t("applicationForm.sections.salary")}</Heading>
							<Grid columns={{ initial: "1", sm: "3" }} gap="3">
								<Field
									label={t("fields.salaryMin")}
									error={tx(errors.salaryMin?.message)}
								>
									<TextField.Root type="number" {...register("salaryMin")} />
								</Field>
								<Field
									label={t("fields.salaryMax")}
									error={tx(errors.salaryMax?.message)}
								>
									<TextField.Root type="number" {...register("salaryMax")} />
								</Field>
								<Field
									label={
										<FieldLabelWithLink
											label={t("fields.currency")}
											href="/currencies"
											linkLabel={t("applicationForm.manageCurrencies")}
										/>
									}
									error={tx(errors.currency?.message)}
								>
									<Controller
										control={control}
										name="currency"
										render={({ field }) => (
											<Select.Root
												value={field.value ?? NONE_VALUE}
												onValueChange={(value) =>
													field.onChange(
														value === NONE_VALUE ? undefined : value,
													)
												}
											>
												<Select.Trigger
													placeholder={t("applicationForm.selectCurrency")}
												/>
												<Select.Content>
													<Select.Item value={NONE_VALUE}>
														{t("applicationForm.notSpecified")}
													</Select.Item>
													{currencyOptions.map((currency) => (
														<Select.Item
															key={currency.id}
															value={currency.code}
														>
															{formatCurrencyOptionLabel(currency)}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
									{selectedCurrency?.usdRate != null && (
										<Text
											size="1"
											color="gray"
											style={{ display: "block", marginTop: 4 }}
										>
											{t("applicationForm.currencyRateHint", {
												code: selectedCurrency.code,
												amount: selectedCurrency.usdRate.toFixed(4),
											})}
										</Text>
									)}
								</Field>
								<Field
									label={t("fields.targetSalaryMin")}
									error={tx(errors.targetSalaryMin?.message)}
								>
									<TextField.Root
										type="number"
										{...register("targetSalaryMin")}
									/>
								</Field>
								<Field
									label={t("fields.targetSalaryMax")}
									error={tx(errors.targetSalaryMax?.message)}
								>
									<TextField.Root
										type="number"
										{...register("targetSalaryMax")}
									/>
								</Field>
							</Grid>
						</Flex>
					</Card>

					<Card>
						<Flex direction="column" gap="3">
							<Heading size="4">
								{t("applicationForm.sections.contact")}
							</Heading>
							<Grid columns={{ initial: "1", sm: "2" }} gap="3">
								<Field
									label={t("fields.contactName")}
									error={tx(errors.contactName?.message)}
								>
									<TextField.Root
										{...register("contactName")}
										placeholder={t("applicationForm.placeholders.contactName")}
									/>
								</Field>
								<Field
									label={t("fields.contactRole")}
									error={tx(errors.contactRole?.message)}
								>
									<TextField.Root
										{...register("contactRole")}
										placeholder={t("applicationForm.placeholders.contactRole")}
									/>
								</Field>
								<Field
									label={t("fields.contactEmail")}
									error={tx(errors.contactEmail?.message)}
								>
									<TextField.Root
										{...register("contactEmail")}
										type="email"
										placeholder={t("applicationForm.placeholders.contactEmail")}
									/>
								</Field>
								<Field
									label={t("fields.contactPhone")}
									error={tx(errors.contactPhone?.message)}
								>
									<TextField.Root
										{...register("contactPhone")}
										placeholder={t("applicationForm.placeholders.contactPhone")}
									/>
								</Field>
								<Box style={{ gridColumn: "1 / -1" }}>
									<Field
										label={t("fields.contactProfileUrl")}
										error={tx(errors.contactProfileUrl?.message)}
									>
										<TextField.Root
											{...register("contactProfileUrl")}
											placeholder={t(
												"applicationForm.placeholders.contactProfileUrl",
											)}
										/>
									</Field>
								</Box>
							</Grid>
						</Flex>
					</Card>

					<Card>
						<Flex direction="column" gap="3">
							<Heading size="4">
								{t("applicationForm.sections.applicationPackage")}
							</Heading>
							<Grid columns={{ initial: "1", sm: "3" }} gap="3">
								<Field
									label={t("fields.resumeVersion")}
									error={tx(errors.resumeVersion?.message)}
								>
									<TextField.Root
										{...register("resumeVersion")}
										placeholder={t(
											"applicationForm.placeholders.resumeVersion",
										)}
									/>
								</Field>
								<Field
									label={t("fields.coverLetterVersion")}
									error={tx(errors.coverLetterVersion?.message)}
								>
									<TextField.Root
										{...register("coverLetterVersion")}
										placeholder={t(
											"applicationForm.placeholders.coverLetterVersion",
										)}
									/>
								</Field>
								<Field
									label={t("fields.portfolioUrl")}
									error={tx(errors.portfolioUrl?.message)}
								>
									<TextField.Root
										{...register("portfolioUrl")}
										placeholder={t("applicationForm.placeholders.portfolioUrl")}
									/>
								</Field>
							</Grid>
						</Flex>
					</Card>

					<Card>
						<Flex direction="column" gap="3">
							<Heading size="4">
								{t("applicationForm.sections.eligibility")}
							</Heading>
							<Grid columns={{ initial: "1", sm: "2" }} gap="3">
								<Field
									label={t("fields.needsSponsorship")}
									error={tx(
										errors.needsSponsorship?.message as string | undefined,
									)}
								>
									<Controller
										control={control}
										name="needsSponsorship"
										render={({ field }) => (
											<Select.Root
												value={
													field.value == null
														? NONE_VALUE
														: field.value
															? "true"
															: "false"
												}
												onValueChange={(value) => {
													if (value === NONE_VALUE) field.onChange(undefined);
													else field.onChange(value === "true");
												}}
											>
												<Select.Trigger
													placeholder={t(
														"applicationForm.selectNeedsSponsorship",
													)}
												/>
												<Select.Content>
													<Select.Item value={NONE_VALUE}>
														{t("applicationForm.notSpecified")}
													</Select.Item>
													<Select.Item value="true">
														{t("common.yes")}
													</Select.Item>
													<Select.Item value="false">
														{t("common.no")}
													</Select.Item>
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
								<Field
									label={t("fields.relocationPreference")}
									error={tx(errors.relocationPreference?.message)}
								>
									<Controller
										control={control}
										name="relocationPreference"
										render={({ field }) => (
											<Select.Root
												value={field.value ?? NONE_VALUE}
												onValueChange={(value) =>
													field.onChange(
														value === NONE_VALUE ? undefined : value,
													)
												}
											>
												<Select.Trigger
													placeholder={t(
														"applicationForm.selectRelocationPreference",
													)}
												/>
												<Select.Content>
													<Select.Item value={NONE_VALUE}>
														{t("applicationForm.notSpecified")}
													</Select.Item>
													{RELOCATION_PREFERENCES.map((preference) => (
														<Select.Item key={preference} value={preference}>
															{t(`relocationPreference.${preference}`)}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
								{showWorkAuthorizationNote ? (
									<Box style={{ gridColumn: "1 / -1" }}>
										<Field
											label={t("fields.workAuthorizationNote")}
											error={tx(errors.workAuthorizationNote?.message)}
										>
											<TextArea
												{...register("workAuthorizationNote")}
												rows={3}
												placeholder={t(
													"applicationForm.placeholders.workAuthorizationNote",
												)}
											/>
										</Field>
									</Box>
								) : null}
							</Grid>
						</Flex>
					</Card>

					<Card>
						<Flex direction="column" gap="3">
							<Heading size="4">
								{t("applicationForm.sections.companyContext")}
							</Heading>
							<Grid columns={{ initial: "1", sm: "3" }} gap="3">
								<Field
									label={t("fields.team")}
									error={tx(errors.team?.message)}
								>
									<TextField.Root
										{...register("team")}
										placeholder={t("applicationForm.placeholders.team")}
									/>
								</Field>
								<Field
									label={t("fields.department")}
									error={tx(errors.department?.message)}
								>
									<TextField.Root
										{...register("department")}
										placeholder={t("applicationForm.placeholders.department")}
									/>
								</Field>
								<Field
									label={t("fields.companySize")}
									error={tx(errors.companySize?.message)}
								>
									<Controller
										control={control}
										name="companySize"
										render={({ field }) => (
											<Select.Root
												value={field.value ?? NONE_VALUE}
												onValueChange={(value) =>
													field.onChange(
														value === NONE_VALUE ? undefined : value,
													)
												}
											>
												<Select.Trigger
													placeholder={t("applicationForm.selectCompanySize")}
												/>
												<Select.Content>
													<Select.Item value={NONE_VALUE}>
														{t("applicationForm.notSpecified")}
													</Select.Item>
													{COMPANY_SIZES.map((size) => (
														<Select.Item key={size} value={size}>
															{t(`companySize.${size}`)}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
								<Field
									label={t("fields.industry")}
									error={tx(errors.industry?.message)}
								>
									<TextField.Root
										{...register("industry")}
										placeholder={t("applicationForm.placeholders.industry")}
									/>
								</Field>
								<Field
									label={t("fields.applicationMethod")}
									error={tx(errors.applicationMethod?.message)}
								>
									<Controller
										control={control}
										name="applicationMethod"
										render={({ field }) => (
											<Select.Root
												value={field.value ?? NONE_VALUE}
												onValueChange={(value) =>
													field.onChange(
														value === NONE_VALUE ? undefined : value,
													)
												}
											>
												<Select.Trigger
													placeholder={t(
														"applicationForm.selectApplicationMethod",
													)}
												/>
												<Select.Content>
													<Select.Item value={NONE_VALUE}>
														{t("applicationForm.notSpecified")}
													</Select.Item>
													{APPLICATION_METHODS.map((method) => (
														<Select.Item key={method} value={method}>
															{t(`applicationMethod.${method}`)}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
								<Field
									label={t("fields.timezoneOverlapHours")}
									error={tx(errors.timezoneOverlapHours?.message)}
								>
									<TextField.Root
										type="number"
										min="0"
										max="24"
										{...register("timezoneOverlapHours")}
										placeholder={t(
											"applicationForm.placeholders.timezoneOverlapHours",
										)}
									/>
								</Field>
								<Field
									label={t("fields.officeDaysPerWeek")}
									error={tx(errors.officeDaysPerWeek?.message)}
								>
									<TextField.Root
										type="number"
										min="0"
										max="7"
										{...register("officeDaysPerWeek")}
										placeholder={t(
											"applicationForm.placeholders.officeDaysPerWeek",
										)}
									/>
								</Field>
							</Grid>
						</Flex>
					</Card>

					<Card>
						<Flex direction="column" gap="3">
							<Heading size="4">
								{t("applicationForm.sections.nextStep")}
							</Heading>
							<Grid columns={{ initial: "1", sm: "3" }} gap="3">
								<Field
									label={t("fields.nextStepAt")}
									error={tx(errors.nextStepAt?.message as string | undefined)}
								>
									<Controller
										control={control}
										name="nextStepAt"
										render={({ field }) => (
											<TextField.Root
												type="datetime-local"
												value={toDateTimeInput(field.value as unknown as Date)}
												onChange={(e) =>
													field.onChange(e.target.value || undefined)
												}
											/>
										)}
									/>
								</Field>
								<Field
									label={t("fields.nextActionType")}
									error={tx(errors.nextActionType?.message)}
								>
									<Controller
										control={control}
										name="nextActionType"
										render={({ field }) => (
											<Select.Root
												value={field.value ?? NONE_VALUE}
												onValueChange={(value) =>
													field.onChange(
														value === NONE_VALUE ? undefined : value,
													)
												}
											>
												<Select.Trigger
													placeholder={t(
														"applicationForm.selectNextActionType",
													)}
												/>
												<Select.Content>
													<Select.Item value={NONE_VALUE}>
														{t("applicationForm.notSpecified")}
													</Select.Item>
													{NEXT_ACTION_TYPES.map((actionType) => (
														<Select.Item key={actionType} value={actionType}>
															{t(`nextActionType.${actionType}`)}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
								<Field
									label={t("fields.nextStepNote")}
									error={tx(errors.nextStepNote?.message)}
								>
									<TextField.Root
										{...register("nextStepNote")}
										placeholder={t("applicationForm.placeholders.nextStepNote")}
									/>
								</Field>
							</Grid>
						</Flex>
					</Card>

					{showOutcomeField ? (
						<Card>
							<Flex direction="column" gap="3">
								<Heading size="4">
									{t("applicationForm.sections.outcome")}
								</Heading>
								<Field
									label={t("fields.outcomeReason")}
									error={tx(errors.outcomeReason?.message)}
								>
									<Controller
										control={control}
										name="outcomeReason"
										render={({ field }) => (
											<Select.Root
												value={field.value ?? NONE_VALUE}
												onValueChange={(value) =>
													field.onChange(
														value === NONE_VALUE ? undefined : value,
													)
												}
											>
												<Select.Trigger
													placeholder={t("applicationForm.selectOutcomeReason")}
												/>
												<Select.Content>
													<Select.Item value={NONE_VALUE}>
														{t("applicationForm.notSpecified")}
													</Select.Item>
													{OUTCOME_REASONS.map((reason) => (
														<Select.Item key={reason} value={reason}>
															{t(`outcomeReason.${reason}`)}
														</Select.Item>
													))}
												</Select.Content>
											</Select.Root>
										)}
									/>
								</Field>
							</Flex>
						</Card>
					) : null}

					<Card>
						<Flex direction="column" gap="3">
							<Flex align="center" justify="between" gap="3">
								<Heading size="4">{t("applicationForm.sections.tags")}</Heading>
								<Link href="/tags" style={{ fontSize: 12 }}>
									{t("applicationForm.manageTags")}
								</Link>
							</Flex>
							<Controller
								control={control}
								name="tagIds"
								render={({ field }) => {
									const selected = new Set(field.value ?? []);
									return (
										<Flex gap="3" wrap="wrap">
											{tags.length === 0 && (
												<Text size="2" color="gray">
													{t("applicationForm.noTags")}
												</Text>
											)}
											{tags.map((tag) => (
												<Text as="label" size="2" key={tag.id}>
													<Flex gap="2" align="center">
														<Checkbox
															checked={selected.has(tag.id)}
															onCheckedChange={(c) => {
																const next = new Set(selected);
																if (c) next.add(tag.id);
																else next.delete(tag.id);
																field.onChange(Array.from(next));
															}}
														/>
														{tag.name}
													</Flex>
												</Text>
											))}
										</Flex>
									);
								}}
							/>
						</Flex>
					</Card>

					<Card>
						<Flex direction="column" gap="3">
							<Heading size="4">{t("applicationForm.sections.notes")}</Heading>
							<Text size="1" color="gray">
								Markdown supported.
							</Text>
							<TextArea
								{...register("notes")}
								rows={8}
								placeholder={t("applicationForm.placeholders.notes")}
							/>
							{errors.notes?.message && (
								<Text size="1" color="red">
									{tx(errors.notes.message)}
								</Text>
							)}
						</Flex>
					</Card>

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

function Field({
	label,
	error,
	children,
}: {
	label: React.ReactNode;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<Box>
			{typeof label === "string" ? (
				<Text
					as="label"
					size="2"
					weight="medium"
					style={{ display: "block", marginBottom: 4 }}
				>
					{label}
				</Text>
			) : (
				<Box style={{ marginBottom: 4 }}>{label}</Box>
			)}
			{children}
			{error && (
				<Text size="1" color="red" style={{ marginTop: 4, display: "block" }}>
					{error}
				</Text>
			)}
		</Box>
	);
}

function FieldLabelWithLink({
	label,
	href,
	linkLabel,
}: {
	label: string;
	href: string;
	linkLabel: string;
}) {
	return (
		<Flex align="center" justify="between" gap="3">
			<Text as="span" size="2" weight="medium">
				{label}
			</Text>
			<Link href={href} style={{ fontSize: 12 }}>
				{linkLabel}
			</Link>
		</Flex>
	);
}
