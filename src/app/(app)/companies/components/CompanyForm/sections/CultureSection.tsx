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
import { HIRING_STATUSES, REMOTE_POLICIES } from "../constants";
import type { SectionProps } from "../types";

export function CultureSection({ form }: SectionProps) {
	const t = useTranslations();
	const tForm = useTranslations("companyForm");
	const tFields = useTranslations("fields");
	const { values, fieldErrors, set, setNum } = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{tForm("sections.culture")}</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field
						label={tFields("remotePolicy")}
						error={fieldErrors.remotePolicy}
					>
						<EnumSelect
							form={form}
							field="remotePolicy"
							options={REMOTE_POLICIES}
							translateKey={(v) => t(`remotePolicy.${v}` as never)}
						/>
					</Field>
					<Field
						label={tFields("hiringStatus")}
						error={fieldErrors.hiringStatus}
					>
						<EnumSelect
							form={form}
							field="hiringStatus"
							options={HIRING_STATUSES}
							translateKey={(v) => t(`hiringStatus.${v}` as never)}
						/>
					</Field>
					<Field
						label={tFields("glassdoorRating")}
						error={fieldErrors.glassdoorRating}
					>
						<TextField.Root
							type="number"
							step="0.1"
							value={
								values.glassdoorRating === undefined ||
								values.glassdoorRating === null
									? ""
									: String(values.glassdoorRating)
							}
							onChange={(e) => setNum("glassdoorRating", e.target.value)}
							placeholder="4.2"
						/>
					</Field>
					<Field
						label={tFields("techStack")}
						error={fieldErrors.techStack}
						full
					>
						<TextArea
							value={values.techStack ?? ""}
							onChange={(e) => set("techStack", e.target.value)}
							placeholder={tForm("placeholders.techStack")}
							rows={3}
						/>
					</Field>
					<Field label={tFields("benefits")} error={fieldErrors.benefits} full>
						<TextArea
							value={values.benefits ?? ""}
							onChange={(e) => set("benefits", e.target.value)}
							placeholder={tForm("placeholders.benefits")}
							rows={3}
						/>
					</Field>
					<Field
						label={tFields("workCulture")}
						error={fieldErrors.workCulture}
						full
					>
						<TextArea
							value={values.workCulture ?? ""}
							onChange={(e) => set("workCulture", e.target.value)}
							placeholder={tForm("placeholders.workCulture")}
							rows={3}
						/>
					</Field>
				</Grid>
			</Flex>
		</Card>
	);
}
