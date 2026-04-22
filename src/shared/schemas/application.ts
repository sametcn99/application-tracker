import { z } from "zod";
import {
	APPLICATION_METHODS,
	COMPANY_SIZES,
	EMPLOYMENT_TYPES,
	NEXT_ACTION_TYPES,
	OUTCOME_REASONS,
	PRIORITIES,
	RELOCATION_PREFERENCES,
	SOURCE_TYPES,
	STATUSES,
	WORK_MODES,
} from "@/shared/constants/application";

const optionalStr = (max = 500) =>
	z
		.string()
		.max(max, "validation.tooLong")
		.optional()
		.transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const optionalInt = z.preprocess((v) => {
	if (v === "" || v === undefined || v === null) return undefined;
	const n = typeof v === "string" ? Number(v) : v;
	return Number.isFinite(n) ? n : undefined;
}, z
	.number()
	.int()
	.nonnegative({ message: "validation.invalidNumber" })
	.optional());

const optionalDate = z.preprocess((v) => {
	if (!v || v === "") return undefined;
	if (v instanceof Date) return v;
	const d = new Date(v as string);
	return Number.isNaN(d.getTime()) ? undefined : d;
}, z.date({ message: "validation.invalidDate" }).optional());

const optionalUrl = z
	.string()
	.url("validation.invalidUrl")
	.optional()
	.or(z.literal("").transform(() => undefined));

const optionalBoolean = z.preprocess((v) => {
	if (v === "" || v === undefined || v === null) return undefined;
	if (typeof v === "boolean") return v;
	if (v === "true") return true;
	if (v === "false") return false;
	return undefined;
}, z.boolean().optional());

const optionalIntInRange = (min: number, max: number) =>
	z.preprocess((v) => {
		if (v === "" || v === undefined || v === null) return undefined;
		const n = typeof v === "string" ? Number(v) : v;
		return Number.isFinite(n) ? n : undefined;
	}, z
		.number({ message: "validation.invalidNumber" })
		.int("validation.invalidNumber")
		.min(min, "validation.invalidNumber")
		.max(max, "validation.invalidNumber")
		.optional());

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
	z
		.enum(values)
		.optional()
		.or(z.literal("").transform(() => undefined));

export const applicationFormSchema = z
	.object({
		company: z
			.string()
			.min(1, "validation.required")
			.max(200, "validation.tooLong"),
		companyId: z
			.string()
			.optional()
			.or(z.literal("").transform(() => undefined)),
		companyWebsite: optionalUrl,
		companyCareersUrl: optionalUrl,
		companyLinkedinUrl: optionalUrl,
		companyLocation: optionalStr(200),
		position: z
			.string()
			.min(1, "validation.required")
			.max(200, "validation.tooLong"),
		listingDetails: optionalStr(10_000),
		location: optionalStr(200),
		workMode: z.enum(WORK_MODES),
		employmentType: z.enum(EMPLOYMENT_TYPES),
		priority: z.enum(PRIORITIES),
		salaryMin: optionalInt,
		salaryMax: optionalInt,
		targetSalaryMin: optionalInt,
		targetSalaryMax: optionalInt,
		currency: optionalStr(10),
		source: optionalStr(100),
		sourceType: optionalEnum(SOURCE_TYPES),
		referralName: optionalStr(150),
		jobUrl: optionalUrl,
		appliedAt: z.preprocess((v) => {
			if (!v || v === "") return new Date();
			if (v instanceof Date) return v;
			const d = new Date(v as string);
			return Number.isNaN(d.getTime()) ? new Date() : d;
		}, z.date()),
		status: z.enum(STATUSES),
		outcomeReason: optionalEnum(OUTCOME_REASONS),
		contactName: optionalStr(150),
		contactRole: optionalStr(100),
		contactEmail: z
			.string()
			.email("validation.invalidEmail")
			.optional()
			.or(z.literal("").transform(() => undefined)),
		contactPhone: optionalStr(50),
		contactProfileUrl: optionalUrl,
		resumeVersion: optionalStr(100),
		coverLetterVersion: optionalStr(100),
		portfolioUrl: optionalUrl,
		needsSponsorship: optionalBoolean,
		relocationPreference: optionalEnum(RELOCATION_PREFERENCES),
		workAuthorizationNote: optionalStr(1_000),
		team: optionalStr(150),
		department: optionalStr(150),
		companySize: optionalEnum(COMPANY_SIZES),
		industry: optionalStr(150),
		applicationMethod: optionalEnum(APPLICATION_METHODS),
		timezoneOverlapHours: optionalIntInRange(0, 24),
		officeDaysPerWeek: optionalIntInRange(0, 7),
		notes: optionalStr(20_000),
		nextStepAt: optionalDate,
		nextStepNote: optionalStr(500),
		nextActionType: optionalEnum(NEXT_ACTION_TYPES),
		tagIds: z.array(z.string()).optional().default([]),
	})
	.superRefine((values, ctx) => {
		if (
			values.targetSalaryMin != null &&
			values.targetSalaryMax != null &&
			values.targetSalaryMin > values.targetSalaryMax
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "validation.invalidSalaryRange",
				path: ["targetSalaryMax"],
			});
		}

		if (values.referralName && values.sourceType !== "REFERRAL") {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "validation.referralRequiresSourceType",
				path: ["referralName"],
			});
		}

		if (
			values.outcomeReason &&
			values.status !== "REJECTED" &&
			values.status !== "WITHDRAWN"
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "validation.outcomeReasonRequiresClosedStatus",
				path: ["outcomeReason"],
			});
		}

		if (
			values.needsSponsorship === false &&
			values.workAuthorizationNote &&
			values.workAuthorizationNote.toLowerCase().includes("sponsor")
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "validation.workAuthorizationNoteConflictsWithSponsorship",
				path: ["workAuthorizationNote"],
			});
		}
	});

export type ApplicationFormInput = z.input<typeof applicationFormSchema>;
export type ApplicationFormValues = z.output<typeof applicationFormSchema>;
