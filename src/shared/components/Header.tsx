"use client";

import {
	ActivityLogIcon,
	BookmarkIcon,
	DashboardIcon,
	ExitIcon,
	GlobeIcon,
	HamburgerMenuIcon,
	ListBulletIcon,
	MixIcon,
	PlusIcon,
} from "@radix-ui/react-icons";
import {
	Avatar,
	Box,
	Button,
	DropdownMenu,
	Flex,
	Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { signOutAction } from "@/shared/actions/auth";

const NAV = [
	{ href: "/", labelKey: "dashboard", icon: DashboardIcon },
	{ href: "/applications", labelKey: "applications", icon: ListBulletIcon },
	{ href: "/applications/new", labelKey: "newApplication", icon: PlusIcon },
	{ href: "/activity", labelKey: "activity", icon: ActivityLogIcon },
	{ href: "/tags", labelKey: "tags", icon: BookmarkIcon },
	{ href: "/sources", labelKey: "sources", icon: GlobeIcon },
	{ href: "/currencies", labelKey: "currencies", icon: MixIcon },
] as const;

export function Header({ userEmail }: { userEmail?: string | null }) {
	const t = useTranslations("common");
	const tNav = useTranslations("nav");
	const _locale = useLocale();
	const pathname = usePathname();

	return (
		<Flex
			align="center"
			justify="between"
			px="4"
			py="3"
			style={{
				borderBottom: "1px solid var(--gray-a4)",
				background: "var(--color-panel-solid)",
				position: "sticky",
				top: 0,
				zIndex: 10,
			}}
		>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="ghost" size="3" color="gray">
						<HamburgerMenuIcon width={20} height={20} />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="start" style={{ minWidth: 200 }}>
					<Box p="2">
						<Text
							size="1"
							weight="medium"
							color="gray"
							style={{ textTransform: "uppercase" }}
						>
							Menu
						</Text>
					</Box>
					{NAV.map((item) => {
						const active =
							item.href === "/"
								? pathname === "/"
								: pathname.startsWith(item.href);
						const Icon = item.icon;
						return (
							<DropdownMenu.Item asChild key={item.href}>
								<Link
									href={item.href}
									style={{
										textDecoration: "none",
										color: active ? "var(--accent-11)" : "inherit",
									}}
								>
									<Flex align="center" gap="2">
										<Icon /> {tNav(item.labelKey)}
									</Flex>
								</Link>
							</DropdownMenu.Item>
						);
					})}
					<DropdownMenu.Separator />
					<Box p="2">
						<Text size="1" color="gray">
							{userEmail}
						</Text>
					</Box>
					<form action={signOutAction}>
						<DropdownMenu.Item asChild color="red">
							<button
								type="submit"
								style={{
									all: "unset",
									width: "100%",
									display: "flex",
									alignItems: "center",
									gap: "8px",
									cursor: "pointer",
									padding: "4px 8px",
								}}
							>
								<ExitIcon /> {t("logout")}
							</button>
						</DropdownMenu.Item>
					</form>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<Text size="2" color="gray" weight="medium">
				{t("appName")}
			</Text>

			<Avatar
				fallback={userEmail?.[0]?.toUpperCase() || "U"}
				size="2"
				radius="full"
			/>
		</Flex>
	);
}
