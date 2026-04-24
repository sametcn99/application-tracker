import { z } from "zod";

export const passwordPolicySchema = z
	.string()
	.min(12, "settings.passwordPolicy")
	.regex(/[a-z]/, "settings.passwordPolicy")
	.regex(/[A-Z]/, "settings.passwordPolicy")
	.regex(/[0-9]/, "settings.passwordPolicy")
	.regex(/[^A-Za-z0-9]/, "settings.passwordPolicy");

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "validation.required"),
		newPassword: passwordPolicySchema,
		confirmPassword: z.string().min(1, "validation.required"),
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		message: "settings.passwordMismatch",
		path: ["confirmPassword"],
	});

export const preferencesSchema = z.object({
	locale: z
		.string()
		.min(2, "validation.required")
		.max(12, "validation.tooLong"),
	timeZone: z
		.string()
		.min(1, "validation.required")
		.max(80, "validation.tooLong"),
	defaultCurrencyCode: z
		.string()
		.trim()
		.toUpperCase()
		.regex(/^[A-Z]{3}$/, "validation.invalid")
		.or(z.literal("").transform(() => "USD")),
});

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type PreferencesInput = z.input<typeof preferencesSchema>;
