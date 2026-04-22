import { describe, expect, it } from "vitest";
import { applicationFormSchema } from "@/shared/schemas/application";

const baseValid = {
	company: "Acme",
	position: "Engineer",
	workMode: "REMOTE",
	employmentType: "FULL_TIME",
	priority: "MEDIUM",
	status: "APPLIED",
};

describe("applicationFormSchema", () => {
	it("accepts a minimal valid payload", () => {
		const result = applicationFormSchema.safeParse(baseValid);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.appliedAt).toBeInstanceOf(Date);
		}
	});

	it("requires company and position", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			company: "",
			position: "",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const fields = result.error.issues.map((i) => i.path.join("."));
			expect(fields).toEqual(expect.arrayContaining(["company", "position"]));
		}
	});

	it("rejects invalid emails and urls", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			contactEmail: "not-an-email",
			jobUrl: "not-a-url",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const fields = result.error.issues.map((i) => i.path.join("."));
			expect(fields).toEqual(
				expect.arrayContaining(["contactEmail", "jobUrl"]),
			);
		}
	});

	it("treats empty optional strings as undefined", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			contactEmail: "",
			jobUrl: "",
			notes: "   ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.contactEmail).toBeUndefined();
			expect(result.data.jobUrl).toBeUndefined();
			expect(result.data.notes).toBeUndefined();
		}
	});

	it("coerces empty enum-like fields and companyId to undefined", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			companyId: "",
			sourceType: "",
			relocationPreference: "",
			companySize: "",
			applicationMethod: "",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.companyId).toBeUndefined();
			expect(result.data.sourceType).toBeUndefined();
			expect(result.data.relocationPreference).toBeUndefined();
			expect(result.data.companySize).toBeUndefined();
			expect(result.data.applicationMethod).toBeUndefined();
		}
	});

	it("coerces optional boolean strings and ignores invalid boolean text", () => {
		const falseResult = applicationFormSchema.safeParse({
			...baseValid,
			needsSponsorship: "false",
		});
		expect(falseResult.success).toBe(true);
		if (falseResult.success) {
			expect(falseResult.data.needsSponsorship).toBe(false);
		}

		const invalidResult = applicationFormSchema.safeParse({
			...baseValid,
			needsSponsorship: "sometimes",
		});
		expect(invalidResult.success).toBe(true);
		if (invalidResult.success) {
			expect(invalidResult.data.needsSponsorship).toBeUndefined();
		}
	});

	it("accepts Date instances for nextStepAt and drops invalid next-step strings", () => {
		const ok = applicationFormSchema.safeParse({
			...baseValid,
			nextStepAt: new Date("2026-04-22T10:00:00Z"),
		});
		expect(ok.success).toBe(true);
		if (ok.success) {
			expect(ok.data.nextStepAt).toBeInstanceOf(Date);
		}

		const invalid = applicationFormSchema.safeParse({
			...baseValid,
			nextStepAt: "garbage",
		});
		expect(invalid.success).toBe(true);
		if (invalid.success) {
			expect(invalid.data.nextStepAt).toBeUndefined();
		}
	});

	it("rejects target salary range with min > max", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			targetSalaryMin: 200_000,
			targetSalaryMax: 100_000,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const issue = result.error.issues.find(
				(i) => i.path.join(".") === "targetSalaryMax",
			);
			expect(issue?.message).toBe("validation.invalidSalaryRange");
		}
	});

	it("requires REFERRAL source type when referralName is set", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			referralName: "Jane Doe",
			sourceType: "JOB_BOARD",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const issue = result.error.issues.find(
				(i) => i.path.join(".") === "referralName",
			);
			expect(issue?.message).toBe("validation.referralRequiresSourceType");
		}
	});

	it("rejects outcomeReason when status is not closed", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			outcomeReason: "NO_RESPONSE",
			status: "APPLIED",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const issue = result.error.issues.find(
				(i) => i.path.join(".") === "outcomeReason",
			);
			expect(issue?.message).toBe(
				"validation.outcomeReasonRequiresClosedStatus",
			);
		}
	});

	it("accepts outcomeReason for REJECTED status", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			status: "REJECTED",
			outcomeReason: "NO_RESPONSE",
		});
		expect(result.success).toBe(true);
	});

	it("flags work-authorization note that mentions sponsor when needsSponsorship is false", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			needsSponsorship: false,
			workAuthorizationNote: "Will need sponsorship eventually",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const issue = result.error.issues.find(
				(i) => i.path.join(".") === "workAuthorizationNote",
			);
			expect(issue?.message).toBe(
				"validation.workAuthorizationNoteConflictsWithSponsorship",
			);
		}
	});

	it("validates timezoneOverlapHours range", () => {
		const tooBig = applicationFormSchema.safeParse({
			...baseValid,
			timezoneOverlapHours: 25,
		});
		expect(tooBig.success).toBe(false);

		const ok = applicationFormSchema.safeParse({
			...baseValid,
			timezoneOverlapHours: 8,
		});
		expect(ok.success).toBe(true);
	});

	it("coerces officeDaysPerWeek strings within range and drops blanks", () => {
		const ok = applicationFormSchema.safeParse({
			...baseValid,
			officeDaysPerWeek: "3",
		});
		expect(ok.success).toBe(true);
		if (ok.success) {
			expect(ok.data.officeDaysPerWeek).toBe(3);
		}

		const blank = applicationFormSchema.safeParse({
			...baseValid,
			officeDaysPerWeek: "",
		});
		expect(blank.success).toBe(true);
		if (blank.success) {
			expect(blank.data.officeDaysPerWeek).toBeUndefined();
		}
	});

	it("coerces date input from string", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			appliedAt: "2026-04-22",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.appliedAt).toBeInstanceOf(Date);
		}
	});

	it("falls back to current date for invalid appliedAt", () => {
		const before = Date.now();
		const result = applicationFormSchema.safeParse({
			...baseValid,
			appliedAt: "garbage",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			const ts = result.data.appliedAt.getTime();
			expect(ts).toBeGreaterThanOrEqual(before - 1_000);
		}
	});
});
