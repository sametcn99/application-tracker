"use client";

import { Card, Flex, Grid, Heading, TextArea, TextField } from "@radix-ui/themes";
import { Field } from "../components/Field";
import { useTx } from "../hooks/useTx";
import type { SectionBaseProps } from "../types";

export function ApplicationPackageSection({ form }: SectionBaseProps) {
	const { t, tx } = useTx();
	const {
		register,
		formState: { errors },
		watch,
	} = form;

	const coverLetterContent = watch("coverLetterContent");

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">
					{t("applicationForm.sections.applicationPackage")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "3" }} gap="3">
					<Field
						label={t("fields.resumeVersion")}
						error={tx(errors.resumeVersion?.message)}
					>
						<TextField.Root
							{...register("resumeVersion")}
							placeholder={t("applicationForm.placeholders.resumeVersion")}
						/>
					</Field>
					<Field
						label={t("fields.coverLetterContent")}
						error={tx(errors.coverLetterContent?.message)}
					>
						<TextArea
							{...register("coverLetterContent")}
							placeholder={t("applicationForm.placeholders.coverLetterContent")}
							rows={4}
							style={{ minHeight: 100 }}
						/>
					</Field>
					<Field
						label={t("fields.portfolioUrl")}
						error={tx(errors.portfolioUrl?.message)}
					>
						<TextField.Root
							{...register("portfolioUrl")}
							placeholder={t("applicationForm.placeholders.portfolioUrl")}
						/>
					</Field>
				</Grid>
				{coverLetterContent && coverLetterContent.trim() !== "" && (
					<Flex direction="column" gap="2" mt="2">
						<label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
							<input type="checkbox" {...register("saveToLetters")} />
							<span>{t("applicationForm.saveToLetters")}</span>
						</label>
						{watch("saveToLetters") && (
							<TextField.Root
								{...register("coverLetterTitle")}
								placeholder={t("applicationForm.placeholders.coverLetterTitle")}
							/>
						)}
					</Flex>
				)}
			</Flex>
		</Card>
	);
}
