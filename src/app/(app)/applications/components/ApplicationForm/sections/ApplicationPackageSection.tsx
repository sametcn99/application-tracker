"use client";

import { Card, Flex, Grid, Heading, TextField } from "@radix-ui/themes";
import { Field } from "../components/Field";
import { useTx } from "../hooks/useTx";
import type { SectionBaseProps } from "../types";

export function ApplicationPackageSection({ form }: SectionBaseProps) {
	const { t, tx } = useTx();
	const {
		register,
		formState: { errors },
	} = form;

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
						label={t("fields.coverLetterVersion")}
						error={tx(errors.coverLetterVersion?.message)}
					>
						<TextField.Root
							{...register("coverLetterVersion")}
							placeholder={t("applicationForm.placeholders.coverLetterVersion")}
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
			</Flex>
		</Card>
	);
}
