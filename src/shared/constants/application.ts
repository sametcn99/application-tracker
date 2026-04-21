export const WORK_MODES = ["REMOTE", "HYBRID", "ONSITE"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const EMPLOYMENT_TYPES = [
	"FULL_TIME",
	"PART_TIME",
	"CONTRACT",
	"INTERN",
	"FREELANCE",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const SOURCE_TYPES = [
	"JOB_BOARD",
	"COMPANY_SITE",
	"REFERRAL",
	"RECRUITER",
	"NETWORK",
	"OTHER",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const NEXT_ACTION_TYPES = [
	"FOLLOW_UP",
	"RECRUITER_CALL",
	"PHONE_SCREEN",
	"TECH_INTERVIEW",
	"TAKE_HOME",
	"ONSITE",
	"OFFER_DISCUSSION",
	"WAITING",
	"OTHER",
] as const;
export type NextActionType = (typeof NEXT_ACTION_TYPES)[number];

export const OUTCOME_REASONS = [
	"NO_RESPONSE",
	"ROLE_CLOSED",
	"SALARY_MISMATCH",
	"LOCATION_MISMATCH",
	"SKILL_MISMATCH",
	"FAILED_SCREEN",
	"FAILED_INTERVIEW",
	"ACCEPTED_OTHER",
	"WITHDREW_BY_CHOICE",
	"OTHER",
] as const;
export type OutcomeReason = (typeof OUTCOME_REASONS)[number];

export const RELOCATION_PREFERENCES = [
	"OPEN",
	"CONDITIONAL",
	"NOT_OPEN",
] as const;
export type RelocationPreference = (typeof RELOCATION_PREFERENCES)[number];

export const COMPANY_SIZES = [
	"STARTUP",
	"SMALL",
	"MID_SIZE",
	"LARGE",
	"ENTERPRISE",
] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export const APPLICATION_METHODS = [
	"EASY_APPLY",
	"COMPANY_ATS",
	"REFERRAL",
	"RECRUITER_DIRECT",
	"EMAIL",
	"OTHER",
] as const;
export type ApplicationMethod = (typeof APPLICATION_METHODS)[number];

export const STATUSES = [
	"APPLIED",
	"SCREENING",
	"INTERVIEW",
	"OFFER",
	"REJECTED",
	"WITHDRAWN",
	"ON_HOLD",
] as const;
export type Status = (typeof STATUSES)[number];

export type StatusColor =
	| "blue"
	| "amber"
	| "violet"
	| "green"
	| "red"
	| "gray"
	| "yellow";

export const STATUS_COLORS: Record<Status, StatusColor> = {
	APPLIED: "blue",
	SCREENING: "amber",
	INTERVIEW: "violet",
	OFFER: "green",
	REJECTED: "red",
	WITHDRAWN: "gray",
	ON_HOLD: "yellow",
};

export const PRIORITY_COLORS: Record<Priority, StatusColor> = {
	HIGH: "red",
	MEDIUM: "amber",
	LOW: "gray",
};

export const ACTIVITY_TYPES = [
	"CREATED",
	"FIELD_CHANGE",
	"STATUS_CHANGE",
	"COMMENT",
	"ATTACHMENT_ADDED",
	"ATTACHMENT_REMOVED",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type ActivityTypeColor =
	| "gray"
	| "blue"
	| "green"
	| "amber"
	| "violet"
	| "red";

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, ActivityTypeColor> = {
	CREATED: "green",
	FIELD_CHANGE: "blue",
	STATUS_CHANGE: "violet",
	COMMENT: "gray",
	ATTACHMENT_ADDED: "amber",
	ATTACHMENT_REMOVED: "red",
};

export const TRACKED_FIELDS = [
	"company",
	"position",
	"listingDetails",
	"location",
	"workMode",
	"employmentType",
	"priority",
	"salaryMin",
	"salaryMax",
	"targetSalaryMin",
	"targetSalaryMax",
	"currency",
	"source",
	"sourceType",
	"referralName",
	"jobUrl",
	"appliedAt",
	"status",
	"contactName",
	"contactRole",
	"contactEmail",
	"contactPhone",
	"contactProfileUrl",
	"resumeVersion",
	"coverLetterVersion",
	"portfolioUrl",
	"needsSponsorship",
	"relocationPreference",
	"workAuthorizationNote",
	"team",
	"department",
	"companySize",
	"industry",
	"applicationMethod",
	"timezoneOverlapHours",
	"officeDaysPerWeek",
	"notes",
	"nextStepAt",
	"nextStepNote",
	"outcomeReason",
	"nextActionType",
] as const;
export type TrackedField = (typeof TRACKED_FIELDS)[number];
