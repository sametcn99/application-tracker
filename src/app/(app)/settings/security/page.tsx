import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { getTranslations } from "next-intl/server";
import { ChangePasswordForm } from "../components/SettingsForms";
import { SettingsShell } from "../components/SettingsShell";

export default async function SecuritySettingsPage() {
	const t = await getTranslations("settings");

	return (
		<SettingsShell
			active="security"
			title={t("securityTitle")}
			description={t("securityDescription")}
		>
			<Card>
				<Flex direction="column" gap="4">
					<Flex direction="column" gap="1">
						<Heading size="4">{t("changePassword")}</Heading>
						<Text size="2" color="gray">
							{t("passwordFormHint")}
						</Text>
					</Flex>
					<ChangePasswordForm />
				</Flex>
			</Card>
		</SettingsShell>
	);
}
