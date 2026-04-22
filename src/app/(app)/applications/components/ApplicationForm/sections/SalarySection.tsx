"use client";

import {
	Card,
	Flex,
	Grid,
	Heading,
	Select,
	Text,
	TextField,
} from "@radix-ui/themes";
import { Controller } from "react-hook-form";
import {
	type CurrencyOptionRecord,
	formatCurrencyOptionLabel,
} from "@/shared/lib/reference-data.shared";
import { Field } from "../components/Field";
import { FieldLabelWithLink } from "../components/FieldLabelWithLink";
import { useTx } from "../hooks/useTx";
import type { SectionBaseProps } from "../types";
import { NONE_VALUE } from "../utils/constants";

type Props = SectionBaseProps & {
	currencyOptions: CurrencyOptionRecord[];
	selectedCurrency: CurrencyOptionRecord | undefined;
};

export function SalarySection({
	form,
	currencyOptions,
	selectedCurrency,
}: Props) {
	const { t, tx } = useTx();
	const {
		register,
		control,
		formState: { errors },
	} = form;

	return (
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
						<TextField.Root type="number" {...register("targetSalaryMin")} />
					</Field>
					<Field
						label={t("fields.targetSalaryMax")}
						error={tx(errors.targetSalaryMax?.message)}
					>
						<TextField.Root type="number" {...register("targetSalaryMax")} />
					</Field>
				</Grid>
			</Flex>
		</Card>
	);
}
