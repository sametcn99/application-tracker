"use client";

import { Card, Flex, Heading, Select } from "@radix-ui/themes";
import { Controller } from "react-hook-form";
import { OUTCOME_REASONS } from "@/shared/constants/application";
import { Field } from "../components/Field";
import { useTx } from "../hooks/useTx";
import type { SectionBaseProps } from "../types";
import { NONE_VALUE } from "../utils/constants";

export function OutcomeSection({ form }: SectionBaseProps) {
	const { t, tx } = useTx();
	const {
		control,
		formState: { errors },
	} = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{t("applicationForm.sections.outcome")}</Heading>
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
	);
}
