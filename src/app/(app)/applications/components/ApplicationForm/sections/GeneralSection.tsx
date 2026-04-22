"use client";

import {
	Box,
	Card,
	Flex,
	Grid,
	Heading,
	Select,
	TextArea,
	TextField,
} from "@radix-ui/themes";
import { Controller } from "react-hook-form";
import {
	EMPLOYMENT_TYPES,
	PRIORITIES,
	SOURCE_TYPES,
	STATUSES,
	WORK_MODES,
} from "@/shared/constants/application";
import { toDateInput } from "@/shared/lib/format";
import type { SourceOptionRecord } from "@/shared/lib/reference-data.shared";
import { Field } from "../components/Field";
import { FieldLabelWithLink } from "../components/FieldLabelWithLink";
import { useTx } from "../hooks/useTx";
import type { CompanyOption, SectionBaseProps } from "../types";
import { NONE_VALUE } from "../utils/constants";
import { normalizeCompanyName } from "../utils/normalize";

type Props = SectionBaseProps & {
	companies: CompanyOption[];
	sourceOptions: SourceOptionRecord[];
	showReferralField: boolean;
};

export function GeneralSection({
	form,
	companies,
	sourceOptions,
	showReferralField,
}: Props) {
	const { t, tx } = useTx();
	const {
		register,
		control,
		getValues,
		setValue,
		formState: { errors },
	} = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{t("applicationForm.sections.general")}</Heading>
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
											setValue("companyId", match.id, { shouldDirty: true });
											if (!getValues("companyWebsite") && match.website) {
												setValue("companyWebsite", match.website, {
													shouldDirty: true,
												});
											}
											if (!getValues("companyCareersUrl") && match.careersUrl) {
												setValue("companyCareersUrl", match.careersUrl, {
													shouldDirty: true,
												});
											}
											if (
												!getValues("companyLinkedinUrl") &&
												match.linkedinUrl
											) {
												setValue("companyLinkedinUrl", match.linkedinUrl, {
													shouldDirty: true,
												});
											}
											if (!getValues("companyLocation") && match.location) {
												setValue("companyLocation", match.location, {
													shouldDirty: true,
												});
											}
											if (!getValues("industry") && match.industry) {
												setValue("industry", match.industry, {
													shouldDirty: true,
												});
											}
											if (!getValues("companySize") && match.companySize) {
												setValue("companySize", match.companySize as never, {
													shouldDirty: true,
												});
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
								placeholder={t("applicationForm.placeholders.listingDetails")}
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
								<Select.Root value={field.value} onValueChange={field.onChange}>
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
								<Select.Root value={field.value} onValueChange={field.onChange}>
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
					<Field label={t("fields.status")} error={tx(errors.status?.message)}>
						<Controller
							control={control}
							name="status"
							render={({ field }) => (
								<Select.Root value={field.value} onValueChange={field.onChange}>
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
								<Select.Root value={field.value} onValueChange={field.onChange}>
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
					<Field label={t("fields.jobUrl")} error={tx(errors.jobUrl?.message)}>
						<TextField.Root
							{...register("jobUrl")}
							placeholder={t("applicationForm.placeholders.jobUrl")}
						/>
					</Field>
				</Grid>
			</Flex>
		</Card>
	);
}
