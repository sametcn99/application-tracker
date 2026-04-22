"use client";

import { Card, Flex, Heading, TextArea } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { Field } from "../components/Field";
import type { SectionProps } from "../types";

export function NotesSection({ form }: SectionProps) {
	const tForm = useTranslations("companyForm");
	const tFields = useTranslations("fields");
	const { values, fieldErrors, set } = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{tForm("sections.notes")}</Heading>
				<Field label={tFields("notes")} error={fieldErrors.notes}>
					<TextArea
						value={values.notes ?? ""}
						onChange={(e) => set("notes", e.target.value)}
						placeholder={tForm("placeholders.notes")}
						rows={6}
					/>
				</Field>
			</Flex>
		</Card>
	);
}
