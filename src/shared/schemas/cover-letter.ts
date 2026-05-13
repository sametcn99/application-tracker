import { z } from "zod";

export const coverLetterSchema = z.object({
	title: z
		.string()
		.min(1, "validation.required")
		.max(200, "validation.tooLong"),
	content: z
		.string()
		.min(1, "validation.required")
		.max(50000, "validation.tooLong"),
});

export type CoverLetterFormInput = z.infer<typeof coverLetterSchema>;
