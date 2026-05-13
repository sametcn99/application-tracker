import { describe, expect, it } from "vitest";
import { applicationFormSchema } from "@/shared/schemas/application";

describe("applicationFormSchema cover letter fields", () => {
	const baseValid = {
		company: "Acme Inc",
		position: "Software Engineer",
		workMode: "REMOTE",
		employmentType: "FULL_TIME",
		priority: "MEDIUM",
		status: "APPLIED",
		appliedAt: new Date(),
	};

	it("accepts application with coverLetterContent", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			coverLetterContent: "Dear Hiring Manager...",
		});
		expect(result.success).toBe(true);
	});

	it("accepts application without cover letter fields", () => {
		const result = applicationFormSchema.safeParse(baseValid);
		expect(result.success).toBe(true);
	});

	it("accepts saveToLetters with coverLetterTitle", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			coverLetterContent: "Dear Hiring Manager...",
			saveToLetters: true,
			coverLetterTitle: "My Cover Letter",
		});
		expect(result.success).toBe(true);
	});

	it("rejects saveToLetters without coverLetterTitle", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			coverLetterContent: "Dear Hiring Manager...",
			saveToLetters: true,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].path).toContain("coverLetterTitle");
		}
	});

	it("rejects coverLetterContent over 50000 chars", () => {
		const result = applicationFormSchema.safeParse({
			...baseValid,
			coverLetterContent: "a".repeat(50001),
		});
		expect(result.success).toBe(false);
	});
});