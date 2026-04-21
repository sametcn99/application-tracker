import { Flex, Heading, Text } from "@radix-ui/themes";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/shared/lib/prisma";
import { TagManager } from "./components/TagManager";

export default async function TagsPage() {
	const t = await getTranslations();
	const tags = await prisma.tag.findMany({
		orderBy: { name: "asc" },
		include: { _count: { select: { applications: true } } },
	});

	return (
		<Flex direction="column" gap="4">
			<Flex direction="column">
				<Heading size="6">{t("tags.title")}</Heading>
				<Text color="gray" size="2">
					{t("tags.subtitle")}
				</Text>
			</Flex>
			<TagManager tags={tags} />
		</Flex>
	);
}
