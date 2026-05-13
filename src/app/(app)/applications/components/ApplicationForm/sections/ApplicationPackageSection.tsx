"use client";

import {
	Card,
	Flex,
	Grid,
	Heading,
	Select,
	Text,
	TextArea,
	TextField,
} from "@radix-ui/themes";
import { useState } from "react";
import { Field } from "../components/Field";
import { useTx } from "../hooks/useTx";
import type { CoverLetterOption, SectionBaseProps } from "../types";

type Props = SectionBaseProps & {
	coverLetters?: CoverLetterOption[];
};

export function ApplicationPackageSection({ form, coverLetters = [] }: Props) {
	const { t, tx } = useTx();
	const {
		register,
		formState: { errors },
		watch,
		setValue,
	} = form;

	const coverLetterContent = watch("coverLetterContent");
	const saveToLetters = watch("saveToLetters");
	const coverLetterId = watch("coverLetterId");
	const [selectedLetterId, setSelectedLetterId] = useState<string>(
		coverLetterId ?? "",
	);

	const handleSelectLetter = (letterId: string) => {
		setSelectedLetterId(letterId);
		if (letterId) {
			const letter = coverLetters.find((l) => l.id === letterId);
			if (letter) {
				setValue("coverLetterContent", letter.content);
				setValue("coverLetterId", letter.id);
			}
		} else {
			setValue("coverLetterId", undefined);
		}
	};

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
					{coverLetters.length > 0 && (
						<Field label={t("coverLetters.selectExisting")}>
							<Select.Root
								value={selectedLetterId}
								onValueChange={handleSelectLetter}
							>
								<Select.Trigger
									placeholder={t("coverLetters.selectExisting")}
								/>
								<Select.Content>
									<Select.Item value="">
										{t("coverLetters.selectExisting")}
									</Select.Item>
									{coverLetters.map((letter) => (
										<Select.Item key={letter.id} value={letter.id}>
											{letter.title}
										</Select.Item>
									))}
								</Select.Content>
							</Select.Root>
						</Field>
					)}
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
						<label
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
								cursor: "pointer",
							}}
						>
							<input type="checkbox" {...register("saveToLetters")} />
							<span>{t("applicationForm.saveToLetters")}</span>
						</label>
						{saveToLetters && (
							<TextField.Root
								{...register("coverLetterTitle")}
								placeholder={t("applicationForm.placeholders.coverLetterTitle")}
							/>
						)}
						{errors.coverLetterTitle?.message && (
							<Text size="1" color="red">
								{tx(errors.coverLetterTitle.message)}
							</Text>
						)}
					</Flex>
				)}
			</Flex>
		</Card>
	);
}
