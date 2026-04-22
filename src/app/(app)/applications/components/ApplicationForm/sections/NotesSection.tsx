"use client";

import { Card, Flex, Heading, Text, TextArea } from "@radix-ui/themes";
import { useTx } from "../hooks/useTx";
import type { SectionBaseProps } from "../types";

export function NotesSection({ form }: SectionBaseProps) {
	const { t, tx } = useTx();
	const {
		register,
		formState: { errors },
	} = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{t("applicationForm.sections.notes")}</Heading>
				<Text size="1" color="gray">
					Markdown supported.
				</Text>
				<TextArea
					{...register("notes")}
					rows={8}
					placeholder={t("applicationForm.placeholders.notes")}
				/>
				{errors.notes?.message && (
					<Text size="1" color="red">
						{tx(errors.notes.message)}
					</Text>
				)}
			</Flex>
		</Card>
	);
}
