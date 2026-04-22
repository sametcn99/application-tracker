"use client";

import { Card, Flex, Grid, Heading, TextField } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { EnumSelect } from "../components/EnumSelect";
import { Field } from "../components/Field";
import { FUNDING_STAGES } from "../constants";
import type { SectionProps } from "../types";

export function BusinessSection({ form }: SectionProps) {
	const t = useTranslations();
	const tForm = useTranslations("companyForm");
	const tFields = useTranslations("fields");
	const { values, fieldErrors, set, setNum } = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{tForm("sections.business")}</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field label={tFields("revenue")} error={fieldErrors.revenue}>
						<TextField.Root
							value={values.revenue ?? ""}
							onChange={(e) => set("revenue", e.target.value)}
							placeholder="$10M-$50M"
						/>
					</Field>
					<Field
						label={tFields("fundingStage")}
						error={fieldErrors.fundingStage}
					>
						<EnumSelect
							form={form}
							field="fundingStage"
							options={FUNDING_STAGES}
							translateKey={(v) => t(`fundingStage.${v}` as never)}
						/>
					</Field>
					<Field
						label={tFields("fundingTotal")}
						error={fieldErrors.fundingTotal}
					>
						<TextField.Root
							value={values.fundingTotal ?? ""}
							onChange={(e) => set("fundingTotal", e.target.value)}
							placeholder="$120M"
						/>
					</Field>
					<Field label={tFields("valuation")} error={fieldErrors.valuation}>
						<TextField.Root
							value={values.valuation ?? ""}
							onChange={(e) => set("valuation", e.target.value)}
							placeholder="$1B"
						/>
					</Field>
					<Field
						label={tFields("employeeCount")}
						error={fieldErrors.employeeCount}
					>
						<TextField.Root
							type="number"
							value={
								values.employeeCount === undefined ||
								values.employeeCount === null
									? ""
									: String(values.employeeCount)
							}
							onChange={(e) => setNum("employeeCount", e.target.value)}
							placeholder="500"
						/>
					</Field>
				</Grid>
			</Flex>
		</Card>
	);
}
