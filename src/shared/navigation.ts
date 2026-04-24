import {
	ActivityLogIcon,
	BookmarkIcon,
	DashboardIcon,
	GearIcon,
	GlobeIcon,
	IdCardIcon,
	ListBulletIcon,
	MixIcon,
	PlusIcon,
} from "@radix-ui/react-icons";

export const MAIN_NAV = [
	{ href: "/", labelKey: "dashboard", icon: DashboardIcon },
	{ href: "/applications", labelKey: "applications", icon: ListBulletIcon },
	{ href: "/companies", labelKey: "companies", icon: IdCardIcon },
	{ href: "/activity", labelKey: "activity", icon: ActivityLogIcon },
] as const;

export const MANAGE_NAV = [
	{ href: "/tags", labelKey: "tags", icon: BookmarkIcon },
	{ href: "/sources", labelKey: "sources", icon: GlobeIcon },
	{ href: "/currencies", labelKey: "currencies", icon: MixIcon },
	{ href: "/settings", labelKey: "settings", icon: GearIcon },
] as const;

export const MOBILE_NAV = [...MAIN_NAV, ...MANAGE_NAV] as const;
