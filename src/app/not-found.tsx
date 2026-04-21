import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
	const t = await getTranslations();
	return (
		<Flex
			direction="column"
			gap="3"
			align="center"
			justify="center"
			p="9"
			style={{ minHeight: "60vh" }}
		>
			<Heading size="7">404</Heading>
			<Heading size="5">{t("errors.notFound")}</Heading>
			<Text color="gray">{t("errors.notFoundDescription")}</Text>
			<Button asChild>
				<Link href="/">{t("errors.backToDashboard")}</Link>
			</Button>
		</Flex>
	);
}
