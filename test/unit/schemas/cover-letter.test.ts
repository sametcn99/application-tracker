import { describe, expect, it } from "vitest";
import { coverLetterSchema } from "@/shared/schemas/cover-letter";

describe("coverLetterSchema", () => {
	it("validates a valid cover letter", () => {
		const result = coverLetterSchema.safeParse({
			title: "Software Engineer Cover Letter",
			content: "Dear Hiring Manager,\n\nI am writing to express my interest...",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty title", () => {
		const result = coverLetterSchema.safeParse({
			title: "",
			content: "Some content",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty content", () => {
		const result = coverLetterSchema.safeParse({
			title: "Some title",
			content: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects title over 200 chars", () => {
		const result = coverLetterSchema.safeParse({
			title: "a".repeat(201),
			content: "Some content",
		});
		expect(result.success).toBe(false);
	});

	it("rejects content over 50000 chars", () => {
		const result = coverLetterSchema.safeParse({
			title: "Some title",
			content: "a".repeat(50001),
		});
		expect(result.success).toBe(false);
	});

	it("accepts content at exactly 50000 chars", () => {
		const result = coverLetterSchema.safeParse({
			title: "Some title",
			content: "a".repeat(50000),
		});
		expect(result.success).toBe(true);
	});
});