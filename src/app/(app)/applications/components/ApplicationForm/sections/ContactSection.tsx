"use client";

import { Box, Card, Flex, Grid, Heading, TextField } from "@radix-ui/themes";
import { Field } from "../components/Field";
import { useTx } from "../hooks/useTx";
import type { SectionBaseProps } from "../types";

export function ContactSection({ form }: SectionBaseProps) {
	const { t, tx } = useTx();
	const {
		register,
		formState: { errors },
	} = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{t("applicationForm.sections.contact")}</Heading>
				<Grid columns={{ initial: "1", sm: "2" }} gap="3">
					<Field
						label={t("fields.contactName")}
						error={tx(errors.contactName?.message)}
					>
						<TextField.Root
							{...register("contactName")}
							placeholder={t("applicationForm.placeholders.contactName")}
						/>
					</Field>
					<Field
						label={t("fields.contactRole")}
						error={tx(errors.contactRole?.message)}
					>
						<TextField.Root
							{...register("contactRole")}
							placeholder={t("applicationForm.placeholders.contactRole")}
						/>
					</Field>
					<Field
						label={t("fields.contactEmail")}
						error={tx(errors.contactEmail?.message)}
					>
						<TextField.Root
							{...register("contactEmail")}
							type="email"
							placeholder={t("applicationForm.placeholders.contactEmail")}
						/>
					</Field>
					<Field
						label={t("fields.contactPhone")}
						error={tx(errors.contactPhone?.message)}
					>
						<TextField.Root
							{...register("contactPhone")}
							placeholder={t("applicationForm.placeholders.contactPhone")}
						/>
					</Field>
					<Box style={{ gridColumn: "1 / -1" }}>
						<Field
							label={t("fields.contactProfileUrl")}
							error={tx(errors.contactProfileUrl?.message)}
						>
							<TextField.Root
								{...register("contactProfileUrl")}
								placeholder={t(
									"applicationForm.placeholders.contactProfileUrl",
								)}
							/>
						</Field>
					</Box>
				</Grid>
			</Flex>
		</Card>
	);
}
