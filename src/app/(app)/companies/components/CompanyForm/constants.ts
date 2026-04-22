export const NONE_VALUE = "__none__";

export const COMPANY_SIZES = [
	"STARTUP",
	"SMALL",
	"MID_SIZE",
	"LARGE",
	"ENTERPRISE",
] as const;

export const COMPANY_TYPES = [
	"PUBLIC",
	"PRIVATE",
	"NONPROFIT",
	"GOVERNMENT",
	"STARTUP",
	"SUBSIDIARY",
	"OTHER",
] as const;

export const FUNDING_STAGES = [
	"SEED",
	"SERIES_A",
	"SERIES_B",
	"SERIES_C",
	"SERIES_D",
	"LATE_STAGE",
	"IPO",
	"BOOTSTRAPPED",
	"ACQUIRED",
	"UNKNOWN",
] as const;

export const REMOTE_POLICIES = [
	"FULLY_REMOTE",
	"HYBRID",
	"ONSITE",
	"FLEXIBLE",
	"UNKNOWN",
] as const;

export const HIRING_STATUSES = [
	"ACTIVELY_HIRING",
	"LIMITED",
	"FROZEN",
	"UNKNOWN",
] as const;

export const PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;

export const TRACKING_STATUSES = [
	"INTERESTED",
	"RESEARCHING",
	"APPLIED",
	"TALKING",
	"ARCHIVED",
] as const;
