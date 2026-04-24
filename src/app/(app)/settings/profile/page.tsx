import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { SettingsShell } from "../components/SettingsShell";

export default async function ProfileSettingsPage() {
	const [session, t] = await Promise.all([auth(), getTranslations("settings")]);
	if (!session?.user) redirect("/login");

	return (
		<SettingsShell
			active="profile"
			title={t("profileTitle")}
			description={t("profileDescription")}
		>
			<Card>
				<Flex direction="column" gap="4">
					<Flex direction="column" gap="1">
						<Text size="1" color="gray">
							{t("displayName")}
						</Text>
						<Heading size="4">
							{session.user.name ?? t("notConfigured")}
						</Heading>
					</Flex>
					<Flex direction="column" gap="1">
						<Text size="1" color="gray">
							{t("emailAddress")}
						</Text>
						<Heading size="4">
							{session.user.email ?? t("notConfigured")}
						</Heading>
					</Flex>
				</Flex>
			</Card>
		</SettingsShell>
	);
}
