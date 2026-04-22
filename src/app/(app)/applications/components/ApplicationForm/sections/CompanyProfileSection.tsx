"use client";

import { Card, Flex, Grid, Heading, Text, TextField } from "@radix-ui/themes";
import { Field } from "../components/Field";
import { useTx } from "../hooks/useTx";
import type { SectionBaseProps } from "../types";

export function CompanyProfileSection({ form }: SectionBaseProps) {
	const { t, tx } = useTx();
	const {
		register,
		watch,
		formState: { errors },
	} = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{t("companies.profile")}</Heading>
				<Text size="1" color="gray">
					{watch("companyId")
						? t("companies.hydrateHint")
						: t("companies.newWillBeCreated")}
				</Text>
				<Grid columns={{ initial: "1", sm: "2" }} gap="3">
					<Field
						label={t("fields.companyWebsite")}
						error={tx(errors.companyWebsite?.message)}
					>
						<TextField.Root {...register("companyWebsite")} />
					</Field>
					<Field
						label={t("fields.companyCareersUrl")}
						error={tx(errors.companyCareersUrl?.message)}
					>
						<TextField.Root {...register("companyCareersUrl")} />
					</Field>
					<Field
						label={t("fields.companyLinkedinUrl")}
						error={tx(errors.companyLinkedinUrl?.message)}
					>
						<TextField.Root {...register("companyLinkedinUrl")} />
					</Field>
					<Field
						label={t("fields.companyLocation")}
						error={tx(errors.companyLocation?.message)}
					>
						<TextField.Root {...register("companyLocation")} />
					</Field>
				</Grid>
			</Flex>
		</Card>
	);
}
