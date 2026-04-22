"use client";

import { Card, Flex, Grid, Heading, TextField } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { Field } from "../components/Field";
import type { SectionProps } from "../types";

export function LinksSection({ form }: SectionProps) {
	const tForm = useTranslations("companyForm");
	const tFields = useTranslations("fields");
	const { values, fieldErrors, set } = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{tForm("sections.links")}</Heading>
				<Grid columns={{ initial: "1", sm: "2" }} gap="3">
					<Field label={tFields("companyWebsite")} error={fieldErrors.website}>
						<TextField.Root
							value={values.website ?? ""}
							onChange={(e) => set("website", e.target.value)}
							placeholder={tForm("placeholders.website")}
						/>
					</Field>
					<Field
						label={tFields("companyCareersUrl")}
						error={fieldErrors.careersUrl}
					>
						<TextField.Root
							value={values.careersUrl ?? ""}
							onChange={(e) => set("careersUrl", e.target.value)}
							placeholder={tForm("placeholders.careersUrl")}
						/>
					</Field>
					<Field
						label={tFields("companyLinkedinUrl")}
						error={fieldErrors.linkedinUrl}
					>
						<TextField.Root
							value={values.linkedinUrl ?? ""}
							onChange={(e) => set("linkedinUrl", e.target.value)}
							placeholder={tForm("placeholders.linkedinUrl")}
						/>
					</Field>
					<Field label={tFields("twitterUrl")} error={fieldErrors.twitterUrl}>
						<TextField.Root
							value={values.twitterUrl ?? ""}
							onChange={(e) => set("twitterUrl", e.target.value)}
							placeholder="https://x.com/…"
						/>
					</Field>
					<Field label={tFields("githubUrl")} error={fieldErrors.githubUrl}>
						<TextField.Root
							value={values.githubUrl ?? ""}
							onChange={(e) => set("githubUrl", e.target.value)}
							placeholder="https://github.com/…"
						/>
					</Field>
					<Field
						label={tFields("glassdoorUrl")}
						error={fieldErrors.glassdoorUrl}
					>
						<TextField.Root
							value={values.glassdoorUrl ?? ""}
							onChange={(e) => set("glassdoorUrl", e.target.value)}
							placeholder="https://glassdoor.com/…"
						/>
					</Field>
					<Field
						label={tFields("crunchbaseUrl")}
						error={fieldErrors.crunchbaseUrl}
					>
						<TextField.Root
							value={values.crunchbaseUrl ?? ""}
							onChange={(e) => set("crunchbaseUrl", e.target.value)}
							placeholder="https://crunchbase.com/…"
						/>
					</Field>
					<Field label={tFields("blogUrl")} error={fieldErrors.blogUrl}>
						<TextField.Root
							value={values.blogUrl ?? ""}
							onChange={(e) => set("blogUrl", e.target.value)}
							placeholder="https://blog.example.com"
						/>
					</Field>
					<Field label={tFields("youtubeUrl")} error={fieldErrors.youtubeUrl}>
						<TextField.Root
							value={values.youtubeUrl ?? ""}
							onChange={(e) => set("youtubeUrl", e.target.value)}
							placeholder="https://youtube.com/@…"
						/>
					</Field>
				</Grid>
			</Flex>
		</Card>
	);
}
