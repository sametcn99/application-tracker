import { Flex, Heading, Text } from "@radix-ui/themes";
import { getTranslations } from "next-intl/server";
import { fetchActivitiesAction } from "@/shared/actions/activity";
import { prisma } from "@/shared/lib/prisma";
import { ActivityList } from "./components/ActivityList";

export default async function ActivityPage() {
	const t = await getTranslations();

	const [entries, totalCount] = await Promise.all([
		fetchActivitiesAction(1), // First page
		prisma.activityEntry.count(),
	]);

	return (
		<Flex direction="column" gap="4">
			<Flex direction="column">
				<Heading size="6">{t("activity.title")}</Heading>
				<Text color="gray" size="2">
					{t("activity.subtitle", { count: totalCount })}
				</Text>
			</Flex>

			<ActivityList initialItems={entries} />
		</Flex>
	);
}
