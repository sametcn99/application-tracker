"use client";

import { Card, Flex, Grid, Heading, TextField } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { Field } from "../components/Field";
import type { SectionProps } from "../types";

export function ContactSection({ form }: SectionProps) {
	const tForm = useTranslations("companyForm");
	const tFields = useTranslations("fields");
	const { values, fieldErrors, set } = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{tForm("sections.contact")}</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field
						label={tFields("mainContactName")}
						error={fieldErrors.mainContactName}
					>
						<TextField.Root
							value={values.mainContactName ?? ""}
							onChange={(e) => set("mainContactName", e.target.value)}
						/>
					</Field>
					<Field
						label={tFields("mainContactRole")}
						error={fieldErrors.mainContactRole}
					>
						<TextField.Root
							value={values.mainContactRole ?? ""}
							onChange={(e) => set("mainContactRole", e.target.value)}
						/>
					</Field>
					<Field
						label={tFields("mainContactEmail")}
						error={fieldErrors.mainContactEmail}
					>
						<TextField.Root
							type="email"
							value={values.mainContactEmail ?? ""}
							onChange={(e) => set("mainContactEmail", e.target.value)}
						/>
					</Field>
					<Field
						label={tFields("mainContactPhone")}
						error={fieldErrors.mainContactPhone}
					>
						<TextField.Root
							value={values.mainContactPhone ?? ""}
							onChange={(e) => set("mainContactPhone", e.target.value)}
						/>
					</Field>
					<Field label={tFields("mainPhone")} error={fieldErrors.mainPhone}>
						<TextField.Root
							value={values.mainPhone ?? ""}
							onChange={(e) => set("mainPhone", e.target.value)}
						/>
					</Field>
					<Field label={tFields("mainEmail")} error={fieldErrors.mainEmail}>
						<TextField.Root
							type="email"
							value={values.mainEmail ?? ""}
							onChange={(e) => set("mainEmail", e.target.value)}
						/>
					</Field>
				</Grid>
			</Flex>
		</Card>
	);
}
