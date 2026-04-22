import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { expect, test as setup } from "@playwright/test";

const STATE_PATH = "test/e2e/.auth/admin.json";

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "change-me";

setup("authenticate as admin", async ({ page }) => {
	mkdirSync(dirname(STATE_PATH), { recursive: true });

	await page.goto("/login");
	await page.getByLabel(/email/i).fill(EMAIL);
	await page.getByLabel(/password/i).fill(PASSWORD);
	await page.getByRole("button").first().click();

	// Successful login should land on a protected page (not /login).
	await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

	await page.context().storageState({ path: STATE_PATH });
});
