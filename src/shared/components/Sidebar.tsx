"use client";

import {
	ActivityLogIcon,
	BookmarkIcon,
	CaretDownIcon,
	CaretRightIcon,
	DashboardIcon,
	ExitIcon,
	GearIcon,
	GlobeIcon,
	ListBulletIcon,
	MixIcon,
	PlusIcon,
} from "@radix-ui/react-icons";
import {
	Avatar,
	Box,
	DropdownMenu,
	Flex,
	Heading,
	Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { signOutAction } from "@/shared/actions/auth";

const MAIN_NAV = [
	{ href: "/", labelKey: "dashboard", icon: DashboardIcon },
	{ href: "/applications", labelKey: "applications", icon: ListBulletIcon },
	{ href: "/applications/new", labelKey: "newApplication", icon: PlusIcon },
	{ href: "/activity", labelKey: "activity", icon: ActivityLogIcon },
] as const;

const MANAGE_NAV = [
	{ href: "/tags", labelKey: "tags", icon: BookmarkIcon },
	{ href: "/sources", labelKey: "sources", icon: GlobeIcon },
	{ href: "/currencies", labelKey: "currencies", icon: MixIcon },
] as const;

interface UserProps {
	name?: string | null;
	email?: string | null;
	image?: string | null;
}

export function Sidebar({ user }: { user?: UserProps }) {
	const pathname = usePathname();
	const t = useTranslations("nav");
	const tCommon = useTranslations("common");
	const [isManagementOpen, setIsManagementOpen] = useState(true);

	return (
		<Flex
			direction="column"
			style={{
				width: 260,
				height: "100vh",
				borderRight: "1px solid var(--gray-a4)",
				background: "var(--color-panel-solid)",
				position: "sticky",
				top: 0,
				overflowY: "auto",
				overflowX: "hidden",
				boxShadow: "1px 0 10px rgba(0, 0, 0, 0.1)",
			}}
		>
			{/* Brand */}
			<Box p="5">
				<Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
					<Flex align="center" gap="3">
						<Box
							style={{
								width: 32,
								height: 32,
								borderRadius: "8px",
								background: "var(--accent-9)",
								color: "white",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: "bold",
								fontSize: 16,
							}}
						>
							A
						</Box>
						<Heading size="4" weight="bold">
							{tCommon("appName")}
						</Heading>
					</Flex>
				</Link>
			</Box>

			{/* Navigation */}
			<Flex
				direction="column"
				gap="1"
				px="4"
				style={{ flex: 1, marginTop: 10 }}
			>
				<Text
					size="1"
					weight="medium"
					color="gray"
					style={{
						padding: "0 12px 8px 12px",
						textTransform: "uppercase",
						letterSpacing: "1px",
					}}
				>
					Overview
				</Text>
				{MAIN_NAV.map((item) => {
					const active =
						item.href === "/"
							? pathname === "/"
							: pathname === item.href || pathname.startsWith(item.href + "/");
					const Icon = item.icon;
					return (
						<Link
							key={item.href}
							href={item.href}
							style={{
								textDecoration: "none",
								display: "flex",
								alignItems: "center",
								gap: 12,
								padding: "10px 12px",
								borderRadius: 8,
								color: active ? "var(--accent-11)" : "var(--gray-11)",
								background: active ? "var(--accent-a3)" : "transparent",
								fontWeight: active ? 600 : 400,
								fontSize: 14,
								transition: "all 0.2s ease-in-out",
							}}
						>
							<Box
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: 24,
									height: 24,
									background: active ? "var(--accent-a4)" : "transparent",
									borderRadius: 6,
								}}
							>
								<Icon width={16} height={16} />
							</Box>
							<Text size="2">{t(item.labelKey)}</Text>
						</Link>
					);
				})}

				<Box mt="4" mb="1">
					<button
						onClick={() => setIsManagementOpen(!isManagementOpen)}
						style={{
							all: "unset",
							boxSizing: "border-box",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							width: "100%",
							padding: "4px 12px",
							cursor: "pointer",
						}}
					>
						<Text
							size="1"
							weight="medium"
							color="gray"
							style={{ textTransform: "uppercase", letterSpacing: "1px" }}
						>
							Management
						</Text>
						{isManagementOpen ? (
							<CaretDownIcon color="var(--gray-9)" />
						) : (
							<CaretRightIcon color="var(--gray-9)" />
						)}
					</button>
				</Box>

				{isManagementOpen &&
					MANAGE_NAV.map((item) => {
						const active =
							pathname === item.href || pathname.startsWith(item.href + "/");
						const Icon = item.icon;
						return (
							<Link
								key={item.href}
								href={item.href}
								style={{
									textDecoration: "none",
									display: "flex",
									alignItems: "center",
									gap: 12,
									padding: "10px 12px 10px 24px",
									borderRadius: 8,
									color: active ? "var(--accent-11)" : "var(--gray-11)",
									background: active ? "var(--accent-a3)" : "transparent",
									fontWeight: active ? 600 : 400,
									fontSize: 14,
									transition: "all 0.2s ease-in-out",
								}}
							>
								<Box
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										width: 24,
										height: 24,
										background: active ? "var(--accent-a4)" : "transparent",
										borderRadius: 6,
									}}
								>
									<Icon width={16} height={16} />
								</Box>
								<Text size="2">{t(item.labelKey)}</Text>
							</Link>
						);
					})}
			</Flex>

			{/* User Profile */}
			<Box p="4" style={{ borderTop: "1px solid var(--gray-a4)" }}>
				{user ? (
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<button
								style={{
									all: "unset",
									boxSizing: "border-box",
									display: "flex",
									alignItems: "center",
									gap: 12,
									width: "100%",
									padding: "8px",
									borderRadius: 8,
									cursor: "pointer",
									transition: "background 0.2s",
								}}
								onMouseOver={(e) =>
									(e.currentTarget.style.background = "var(--gray-a3)")
								}
								onMouseOut={(e) =>
									(e.currentTarget.style.background = "transparent")
								}
							>
								<Avatar
									src={user.image || undefined}
									fallback={user.email?.[0]?.toUpperCase() || "U"}
									size="2"
									radius="full"
								/>
								<Box style={{ flex: 1, minWidth: 0 }}>
									<Text
										size="2"
										weight="medium"
										style={{
											display: "block",
											textOverflow: "ellipsis",
											overflow: "hidden",
											whiteSpace: "nowrap",
										}}
									>
										{user.name || user.email?.split("@")[0]}
									</Text>
									<Text
										size="1"
										color="gray"
										style={{
											display: "block",
											textOverflow: "ellipsis",
											overflow: "hidden",
											whiteSpace: "nowrap",
										}}
									>
										{user.email}
									</Text>
								</Box>
								<GearIcon width={16} height={16} color="var(--gray-9)" />
							</button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="center" side="top">
							<form action={signOutAction}>
								<DropdownMenu.Item asChild color="red">
									<button
										type="submit"
										style={{
											all: "unset",
											display: "flex",
											alignItems: "center",
											gap: 8,
											padding: "4px 8px",
											width: "100%",
											cursor: "pointer",
										}}
									>
										<ExitIcon /> {tCommon("logout")}
									</button>
								</DropdownMenu.Item>
							</form>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				) : null}
			</Box>
		</Flex>
	);
}
