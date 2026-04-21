import { Flex, Heading } from "@radix-ui/themes";
import { getTranslations } from "next-intl/server";
import { ApplicationForm } from "@/shared/components/ApplicationForm";
import { prisma } from "@/shared/lib/prisma";
import {
	getCurrencyOptions,
	getSourceOptions,
} from "@/shared/lib/reference-data";

export default async function NewApplicationPage() {
	const t = await getTranslations();
	const [tags, sources, currencies] = await Promise.all([
		prisma.tag.findMany({ orderBy: { name: "asc" } }),
		getSourceOptions(),
		getCurrencyOptions(),
	]);
	return (
		<Flex direction="column" gap="4">
			<Heading size="6">{t("applicationForm.createTitle")}</Heading>
			<ApplicationForm
				mode="create"
				tags={tags}
				sources={sources}
				currencies={currencies}
			/>
		</Flex>
	);
}
