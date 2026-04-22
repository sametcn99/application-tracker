"use client";

import {
	Box,
	Card,
	Flex,
	Grid,
	Heading,
	Select,
	TextArea,
} from "@radix-ui/themes";
import { Controller } from "react-hook-form";
import { RELOCATION_PREFERENCES } from "@/shared/constants/application";
import { Field } from "../components/Field";
import { useTx } from "../hooks/useTx";
import type { SectionBaseProps } from "../types";
import { NONE_VALUE } from "../utils/constants";

type Props = SectionBaseProps & {
	showWorkAuthorizationNote: boolean;
};

export function EligibilitySection({ form, showWorkAuthorizationNote }: Props) {
	const { t, tx } = useTx();
	const {
		register,
		control,
		formState: { errors },
	} = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{t("applicationForm.sections.eligibility")}</Heading>
				<Grid columns={{ initial: "1", sm: "2" }} gap="3">
					<Field
						label={t("fields.needsSponsorship")}
						error={tx(errors.needsSponsorship?.message as string | undefined)}
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
										placeholder={t("applicationForm.selectNeedsSponsorship")}
									/>
									<Select.Content>
										<Select.Item value={NONE_VALUE}>
											{t("applicationForm.notSpecified")}
										</Select.Item>
										<Select.Item value="true">{t("common.yes")}</Select.Item>
										<Select.Item value="false">{t("common.no")}</Select.Item>
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
										field.onChange(value === NONE_VALUE ? undefined : value)
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
	);
}
