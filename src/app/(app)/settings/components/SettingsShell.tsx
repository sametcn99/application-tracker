import {
	HomeIcon,
	LockClosedIcon,
	MixerHorizontalIcon,
	PersonIcon,
} from "@radix-ui/react-icons";
import { Flex, Heading, TabNav, Text } from "@radix-ui/themes";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const SETTINGS_SECTIONS = [
	{
		key: "overview",
		href: "/settings",
		titleKey: "overviewTitle",
		descriptionKey: "overviewDescription",
		icon: HomeIcon,
	},
	{
		key: "profile",
		href: "/settings/profile",
		titleKey: "profileTitle",
		descriptionKey: "profileDescription",
		icon: PersonIcon,
	},
	{
		key: "security",
		href: "/settings/security",
		titleKey: "securityTitle",
		descriptionKey: "securityDescription",
		icon: LockClosedIcon,
	},
	{
		key: "preferences",
		href: "/settings/preferences",
		titleKey: "preferencesTitle",
		descriptionKey: "preferencesDescription",
		icon: MixerHorizontalIcon,
	},
] as const;

export type SettingsSectionKey = (typeof SETTINGS_SECTIONS)[number]["key"];

export async function SettingsShell({
	active,
	title,
	description,
	children,
}: {
	active: SettingsSectionKey;
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	const t = await getTranslations("settings");

	return (
		<Flex direction="column" gap="4">
			<Flex direction="column" gap="1">
				<Heading size="6">{title}</Heading>
				<Text color="gray" size="2">
					{description}
				</Text>
			</Flex>

			<TabNav.Root>
				{SETTINGS_SECTIONS.map((section) => (
					<TabNav.Link
						key={section.key}
						asChild
						active={section.key === active}
					>
						<Link href={section.href}>{t(section.titleKey)}</Link>
					</TabNav.Link>
				))}
			</TabNav.Root>

			{children}
		</Flex>
	);
}
