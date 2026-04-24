import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";
import { PreferencesForm } from "../components/SettingsForms";
import { SettingsShell } from "../components/SettingsShell";

export default async function PreferencesSettingsPage() {
	const [session, t] = await Promise.all([auth(), getTranslations("settings")]);
	if (!session?.user?.id) redirect("/login");

	const preferences = await prisma.userPreference.findUnique({
		where: { userId: session.user.id },
	});

	return (
		<SettingsShell
			active="preferences"
			title={t("preferencesTitle")}
			description={t("preferencesDescription")}
		>
			<Card>
				<Flex direction="column" gap="4">
					<Flex direction="column" gap="1">
						<Heading size="4">{t("savePreferences")}</Heading>
						<Text size="2" color="gray">
							{t("preferencesDescription")}
						</Text>
					</Flex>
					<PreferencesForm
						locale={preferences?.locale ?? "en"}
						timeZone={preferences?.timeZone ?? "UTC"}
						defaultCurrencyCode={preferences?.defaultCurrencyCode ?? "USD"}
					/>
				</Flex>
			</Card>
		</SettingsShell>
	);
}
