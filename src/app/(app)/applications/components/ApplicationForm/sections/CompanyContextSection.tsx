"use client";

import { Card, Flex, Grid, Heading, Select, TextField } from "@radix-ui/themes";
import { Controller } from "react-hook-form";
import {
	APPLICATION_METHODS,
	COMPANY_SIZES,
} from "@/shared/constants/application";
import { Field } from "../components/Field";
import { useTx } from "../hooks/useTx";
import type { SectionBaseProps } from "../types";
import { NONE_VALUE } from "../utils/constants";

export function CompanyContextSection({ form }: SectionBaseProps) {
	const { t, tx } = useTx();
	const {
		register,
		control,
		formState: { errors },
	} = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">
					{t("applicationForm.sections.companyContext")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "3" }} gap="3">
					<Field label={t("fields.team")} error={tx(errors.team?.message)}>
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
										field.onChange(value === NONE_VALUE ? undefined : value)
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
										field.onChange(value === NONE_VALUE ? undefined : value)
									}
								>
									<Select.Trigger
										placeholder={t("applicationForm.selectApplicationMethod")}
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
							placeholder={t("applicationForm.placeholders.officeDaysPerWeek")}
						/>
					</Field>
				</Grid>
			</Flex>
		</Card>
	);
}
