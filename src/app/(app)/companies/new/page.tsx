import { Flex, Heading } from "@radix-ui/themes";
import { getTranslations } from "next-intl/server";
import { CompanyForm } from "../components/CompanyForm";

export default async function NewCompanyPage() {
	const t = await getTranslations("companies");

	return (
		<Flex direction="column" gap="4">
			<Heading>{t("createTitle")}</Heading>
			<CompanyForm mode="create" />
		</Flex>
	);
}
