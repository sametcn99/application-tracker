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
import { Field } from "../components/Field";
import type { SectionProps } from "../types";

export function LocationSection({ form }: SectionProps) {
	const tForm = useTranslations("companyForm");
	const tFields = useTranslations("fields");
	const { values, fieldErrors, set } = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{tForm("sections.location")}</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field
						label={tFields("companyLocation")}
						error={fieldErrors.location}
					>
						<TextField.Root
							value={values.location ?? ""}
							onChange={(e) => set("location", e.target.value)}
							placeholder={tForm("placeholders.location")}
						/>
					</Field>
					<Field
						label={tFields("headquarters")}
						error={fieldErrors.headquarters}
					>
						<TextField.Root
							value={values.headquarters ?? ""}
							onChange={(e) => set("headquarters", e.target.value)}
							placeholder={tForm("placeholders.headquarters")}
						/>
					</Field>
					<Field label={tFields("country")} error={fieldErrors.country}>
						<TextField.Root
							value={values.country ?? ""}
							onChange={(e) => set("country", e.target.value)}
							placeholder={tForm("placeholders.country")}
						/>
					</Field>
					<Field label={tFields("timezone")} error={fieldErrors.timezone}>
						<TextField.Root
							value={values.timezone ?? ""}
							onChange={(e) => set("timezone", e.target.value)}
							placeholder="UTC+3"
						/>
					</Field>
					<Field
						label={tFields("officeLocations")}
						error={fieldErrors.officeLocations}
						full
					>
						<TextArea
							value={values.officeLocations ?? ""}
							onChange={(e) => set("officeLocations", e.target.value)}
							placeholder={tForm("placeholders.officeLocations")}
							rows={3}
						/>
					</Field>
				</Grid>
			</Flex>
		</Card>
	);
}
