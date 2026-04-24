import { describe, expect, it } from "vitest";
import {
	changePasswordSchema,
	passwordPolicySchema,
	preferencesSchema,
} from "@/shared/schemas/user-settings";

describe("user settings schemas", () => {
	it("requires strong passwords", () => {
		expect(passwordPolicySchema.safeParse("weak").success).toBe(false);
		expect(passwordPolicySchema.safeParse("Strong-pass-123").success).toBe(
			true,
		);
	});

	it("requires password confirmation to match", () => {
		const result = changePasswordSchema.safeParse({
			currentPassword: "old-password",
			newPassword: "Strong-pass-123",
			confirmPassword: "Different-pass-123",
		});
		expect(result.success).toBe(false);
	});

	it("normalizes default currency code", () => {
		const result = preferencesSchema.parse({
			locale: "en",
			timeZone: "UTC",
			defaultCurrencyCode: "usd",
		});
		expect(result.defaultCurrencyCode).toBe("USD");
	});
});
