import { z } from "zod";

const optionalUrl = z
	.string()
	.url("validation.invalidUrl")
	.optional()
	.or(z.literal("").transform(() => undefined));

const optionalStr = (max = 500) =>
	z
		.string()
		.max(max, "validation.tooLong")
		.optional()
		.transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const optionalEnum = <T extends [string, ...string[]]>(values: T) =>
	z
		.enum(values)
		.optional()
		.or(z.literal("").transform(() => undefined));

// Coerce so HTML number inputs ("" or string numbers) are accepted.
const optionalInt = (min?: number, max?: number) =>
	z.preprocess(
		(v) => {
			if (v === "" || v === null || v === undefined) return undefined;
			const n = typeof v === "number" ? v : Number(v);
			return Number.isFinite(n) ? n : undefined;
		},
		z
			.number()
			.int("validation.invalid")
			.refine(
				(n) => (min === undefined ? true : n >= min),
				"validation.invalid",
			)
			.refine(
				(n) => (max === undefined ? true : n <= max),
				"validation.invalid",
			)
			.optional(),
	);

const optionalFloat = (min?: number, max?: number) =>
	z.preprocess(
		(v) => {
			if (v === "" || v === null || v === undefined) return undefined;
			const n = typeof v === "number" ? v : Number(v);
			return Number.isFinite(n) ? n : undefined;
		},
		z
			.number()
			.refine(
				(n) => (min === undefined ? true : n >= min),
				"validation.invalid",
			)
			.refine(
				(n) => (max === undefined ? true : n <= max),
				"validation.invalid",
			)
			.optional(),
	);

export const companyFormSchema = z.object({
	name: z.string().min(1, "validation.required").max(200, "validation.tooLong"),
	legalName: optionalStr(200),
	aliases: optionalStr(500),
	description: optionalStr(2_000),
	tagline: optionalStr(280),
	foundedYear: optionalInt(1700, 2100),
	companyType: optionalEnum([
		"PUBLIC",
		"PRIVATE",
		"NONPROFIT",
		"GOVERNMENT",
		"STARTUP",
		"SUBSIDIARY",
		"OTHER",
	]),
	industry: optionalStr(150),
	subIndustry: optionalStr(150),
	companySize: optionalEnum([
		"STARTUP",
		"SMALL",
		"MID_SIZE",
		"LARGE",
		"ENTERPRISE",
	]),
	stockSymbol: optionalStr(20),
	parentCompany: optionalStr(200),
	location: optionalStr(200),
	headquarters: optionalStr(200),
	country: optionalStr(100),
	timezone: optionalStr(80),
	officeLocations: optionalStr(2_000),
	website: optionalUrl,
	careersUrl: optionalUrl,
	linkedinUrl: optionalUrl,
	twitterUrl: optionalUrl,
	githubUrl: optionalUrl,
	glassdoorUrl: optionalUrl,
	crunchbaseUrl: optionalUrl,
	blogUrl: optionalUrl,
	youtubeUrl: optionalUrl,
	revenue: optionalStr(80),
	fundingStage: optionalEnum([
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
	]),
	fundingTotal: optionalStr(80),
	valuation: optionalStr(80),
	employeeCount: optionalInt(0, 10_000_000),
	ceo: optionalStr(200),
	techStack: optionalStr(2_000),
	benefits: optionalStr(5_000),
	workCulture: optionalStr(5_000),
	remotePolicy: optionalEnum([
		"FULLY_REMOTE",
		"HYBRID",
		"ONSITE",
		"FLEXIBLE",
		"UNKNOWN",
	]),
	hiringStatus: optionalEnum([
		"ACTIVELY_HIRING",
		"LIMITED",
		"FROZEN",
		"UNKNOWN",
	]),
	glassdoorRating: optionalFloat(0, 5),
	mainContactName: optionalStr(200),
	mainContactRole: optionalStr(200),
	mainContactEmail: optionalStr(200),
	mainContactPhone: optionalStr(80),
	mainPhone: optionalStr(80),
	mainEmail: optionalStr(200),
	rating: optionalInt(1, 5),
	priority: optionalEnum(["HIGH", "MEDIUM", "LOW"]),
	trackingStatus: optionalEnum([
		"INTERESTED",
		"RESEARCHING",
		"APPLIED",
		"TALKING",
		"ARCHIVED",
	]),
	pros: optionalStr(5_000),
	cons: optionalStr(5_000),
	notes: optionalStr(20_000),
});

export type CompanyFormInput = z.input<typeof companyFormSchema>;
