import { z } from "zod";
import {
	EMPLOYMENT_TYPES,
	NEXT_ACTION_TYPES,
	OUTCOME_REASONS,
	PRIORITIES,
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
		jobUrl: z
			.string()
			.url("validation.invalidUrl")
			.optional()
			.or(z.literal("").transform(() => undefined)),
		appliedAt: z.preprocess((v) => {
			if (!v || v === "") return new Date();
			if (v instanceof Date) return v;
			const d = new Date(v as string);
			return Number.isNaN(d.getTime()) ? new Date() : d;
		}, z.date()),
		status: z.enum(STATUSES),
		outcomeReason: optionalEnum(OUTCOME_REASONS),
		contactName: optionalStr(150),
		contactEmail: z
			.string()
			.email("validation.invalidEmail")
			.optional()
			.or(z.literal("").transform(() => undefined)),
		contactPhone: optionalStr(50),
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
	});

export type ApplicationFormInput = z.input<typeof applicationFormSchema>;
export type ApplicationFormValues = z.output<typeof applicationFormSchema>;
