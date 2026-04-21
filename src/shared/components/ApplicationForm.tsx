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
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	createApplicationAction,
	updateApplicationAction,
} from "@/shared/actions/applications";
import {
	EMPLOYMENT_TYPES,
	NEXT_ACTION_TYPES,
	OUTCOME_REASONS,
	PRIORITIES,
	SOURCE_TYPES,
	STATUSES,
	WORK_MODES,
} from "@/shared/constants/application";
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

const NONE_VALUE = "__none__";

type Props = {
	mode: "create" | "edit";
	applicationId?: string;
	defaultValues?: Partial<ApplicationFormInput>;
	selectedTagIds?: string[];
	tags: Tag[];
	sources: SourceOptionRecord[];
	currencies: CurrencyOptionRecord[];
};

export function ApplicationForm({
	mode,
	applicationId,
	defaultValues,
	selectedTagIds = [],
	tags,
	sources,
	currencies,
}: Props) {
	const router = useRouter();
	const t = useTranslations();
	const [pending, startTransition] = useTransition();
	const [topError, setTopError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		setError,
		watch,
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
	const showReferralField =
		selectedSourceType === "REFERRAL" || Boolean(referralName);
	const showOutcomeField =
		selectedStatus === "REJECTED" ||
		selectedStatus === "WITHDRAWN" ||
		Boolean(selectedOutcomeReason);

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
				router.push(`/applications/${result.id}`);
			}
		});
	};

	return (
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
						<Heading size="4">{t("applicationForm.sections.general")}</Heading>
						<Grid columns={{ initial: "1", sm: "2" }} gap="3">
							<Field
								label={`${t("fields.company")} *`}
								error={tx(errors.company?.message)}
							>
								<TextField.Root
									{...register("company")}
									placeholder={t("applicationForm.placeholders.company")}
								/>
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
												field.onChange(value === NONE_VALUE ? undefined : value)
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
												field.onChange(value === NONE_VALUE ? undefined : value)
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
										placeholder={t("applicationForm.placeholders.referralName")}
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
												field.onChange(value === NONE_VALUE ? undefined : value)
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
													<Select.Item key={currency.id} value={currency.code}>
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
						<Heading size="4">{t("applicationForm.sections.contact")}</Heading>
						<Grid columns={{ initial: "1", sm: "3" }} gap="3">
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
						</Grid>
					</Flex>
				</Card>

				<Card>
					<Flex direction="column" gap="3">
						<Heading size="4">{t("applicationForm.sections.nextStep")}</Heading>
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
												field.onChange(value === NONE_VALUE ? undefined : value)
											}
										>
											<Select.Trigger
												placeholder={t("applicationForm.selectNextActionType")}
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
												field.onChange(value === NONE_VALUE ? undefined : value)
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

				<Flex gap="3" justify="end">
					<Button
						type="button"
						variant="soft"
						color="gray"
						onClick={() => router.back()}
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
