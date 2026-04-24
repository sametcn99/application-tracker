import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SETTINGS_SECTIONS, SettingsShell } from "./components/SettingsShell";

export default async function SettingsPage() {
	const t = await getTranslations("settings");

	return (
		<SettingsShell
			active="overview"
			title={t("title")}
			description={t("subtitle")}
		>
			<Grid columns={{ initial: "1", sm: "2" }} gap="3">
				{SETTINGS_SECTIONS.filter((section) => section.key !== "overview").map(
					(section) => (
						<Card key={section.key} asChild>
							<Link
								href={section.href}
								style={{ textDecoration: "none", color: "inherit" }}
							>
								<Flex align="center" justify="between" gap="3">
									<Flex direction="column" gap="1" style={{ minWidth: 0 }}>
										<Heading size="3">{t(section.titleKey)}</Heading>
										<Text size="2" color="gray">
											{t(section.descriptionKey)}
										</Text>
									</Flex>
									<ArrowRightIcon color="var(--gray-9)" />
								</Flex>
							</Link>
						</Card>
					),
				)}
			</Grid>
		</SettingsShell>
	);
}
