"use client";

import { Card, Flex, Grid, Heading, Select, TextField } from "@radix-ui/themes";
import { Controller } from "react-hook-form";
import { NEXT_ACTION_TYPES } from "@/shared/constants/application";
import { toDateTimeInput } from "@/shared/lib/format";
import { Field } from "../components/Field";
import { useTx } from "../hooks/useTx";
import type { SectionBaseProps } from "../types";
import { NONE_VALUE } from "../utils/constants";

export function NextStepSection({ form }: SectionBaseProps) {
	const { t, tx } = useTx();
	const {
		register,
		control,
		formState: { errors },
	} = form;

	return (
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
									onChange={(e) => field.onChange(e.target.value || undefined)}
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
	);
}
