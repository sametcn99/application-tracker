"use client";

import {
	Card,
	Flex,
	Grid,
	Heading,
	TextArea,
	TextField,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { EnumSelect } from "../components/EnumSelect";
import { Field } from "../components/Field";
import { COMPANY_SIZES, COMPANY_TYPES } from "../constants";
import type { SectionProps } from "../types";

export function IdentitySection({ form }: SectionProps) {
	const t = useTranslations();
	const tForm = useTranslations("companyForm");
	const tFields = useTranslations("fields");
	const { values, fieldErrors, set, setNum } = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{tForm("sections.identity")}</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field label={`${tFields("company")} *`} error={fieldErrors.name}>
						<TextField.Root
							value={values.name ?? ""}
							onChange={(e) => set("name", e.target.value)}
							placeholder={tForm("placeholders.name")}
							required
						/>
					</Field>
					<Field label={tFields("legalName")} error={fieldErrors.legalName}>
						<TextField.Root
							value={values.legalName ?? ""}
							onChange={(e) => set("legalName", e.target.value)}
							placeholder={tForm("placeholders.legalName")}
						/>
					</Field>
					<Field label={tFields("aliases")} error={fieldErrors.aliases}>
						<TextField.Root
							value={values.aliases ?? ""}
							onChange={(e) => set("aliases", e.target.value)}
							placeholder={tForm("placeholders.aliases")}
						/>
					</Field>
					<Field label={tFields("tagline")} error={fieldErrors.tagline}>
						<TextField.Root
							value={values.tagline ?? ""}
							onChange={(e) => set("tagline", e.target.value)}
							placeholder={tForm("placeholders.tagline")}
						/>
					</Field>
					<Field label={tFields("foundedYear")} error={fieldErrors.foundedYear}>
						<TextField.Root
							type="number"
							value={
								values.foundedYear === undefined || values.foundedYear === null
									? ""
									: String(values.foundedYear)
							}
							onChange={(e) => setNum("foundedYear", e.target.value)}
							placeholder="2010"
						/>
					</Field>
					<Field label={tFields("companyType")} error={fieldErrors.companyType}>
						<EnumSelect
							form={form}
							field="companyType"
							options={COMPANY_TYPES}
							translateKey={(v) => t(`companyType.${v}` as never)}
						/>
					</Field>
					<Field label={tFields("industry")} error={fieldErrors.industry}>
						<TextField.Root
							value={values.industry ?? ""}
							onChange={(e) => set("industry", e.target.value)}
							placeholder={tForm("placeholders.industry")}
						/>
					</Field>
					<Field label={tFields("subIndustry")} error={fieldErrors.subIndustry}>
						<TextField.Root
							value={values.subIndustry ?? ""}
							onChange={(e) => set("subIndustry", e.target.value)}
							placeholder={tForm("placeholders.subIndustry")}
						/>
					</Field>
					<Field label={tFields("companySize")} error={fieldErrors.companySize}>
						<EnumSelect
							form={form}
							field="companySize"
							options={COMPANY_SIZES}
							translateKey={(v) => t(`companySize.${v}` as never)}
						/>
					</Field>
					<Field label={tFields("stockSymbol")} error={fieldErrors.stockSymbol}>
						<TextField.Root
							value={values.stockSymbol ?? ""}
							onChange={(e) => set("stockSymbol", e.target.value)}
							placeholder="MSFT"
						/>
					</Field>
					<Field
						label={tFields("parentCompany")}
						error={fieldErrors.parentCompany}
					>
						<TextField.Root
							value={values.parentCompany ?? ""}
							onChange={(e) => set("parentCompany", e.target.value)}
							placeholder={tForm("placeholders.parentCompany")}
						/>
					</Field>
					<Field label={tFields("ceo")} error={fieldErrors.ceo}>
						<TextField.Root
							value={values.ceo ?? ""}
							onChange={(e) => set("ceo", e.target.value)}
							placeholder={tForm("placeholders.ceo")}
						/>
					</Field>
					<Field
						label={tFields("description")}
						error={fieldErrors.description}
						full
					>
						<TextArea
							value={values.description ?? ""}
							onChange={(e) => set("description", e.target.value)}
							placeholder={tForm("placeholders.description")}
							rows={3}
						/>
					</Field>
				</Grid>
			</Flex>
		</Card>
	);
}
