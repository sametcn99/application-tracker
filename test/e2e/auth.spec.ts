import { expect, test } from "@playwright/test";

test("dashboard renders for authenticated user", async ({ page }) => {
	await page.goto("/");
	await expect(page).not.toHaveURL(/\/login/);
	// AppShell sidebar lists key sections.
	await expect(
		page.getByRole("link", { name: /applications/i }).first(),
	).toBeVisible();
});

test("login page is publicly reachable", async ({ browser }) => {
	const context = await browser.newContext({ storageState: undefined });
	const page = await context.newPage();
	await page.goto("/login");
	await expect(page.getByLabel(/email/i)).toBeVisible();
	await expect(page.getByLabel(/password/i)).toBeVisible();
	await context.close();
});

test("anonymous user is redirected to login with callbackUrl", async ({
	browser,
}) => {
	const context = await browser.newContext({ storageState: undefined });
	const page = await context.newPage();

	await page.goto("/applications/new");
	await expect(page).toHaveURL(/\/login/);
	expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe(
		"/applications/new",
	);
	await expect(page.getByLabel(/email/i)).toBeVisible();

	await context.close();
});

test("invalid credentials keep user on login and show an error", async ({
	browser,
}) => {
	const context = await browser.newContext({ storageState: undefined });
	const page = await context.newPage();

	await page.goto("/login");
	await page.getByLabel(/email/i).fill("wrong@example.com");
	await page.getByLabel(/password/i).fill("definitely-wrong");
	await page.getByRole("button", { name: /sign in/i }).click();

	await expect(page).toHaveURL(/\/login/);
	await expect(page.getByText(/invalid email or password\./i)).toBeVisible();

	await context.close();
});

test("authenticated user visiting login is redirected back to dashboard", async ({
	page,
}) => {
	await page.goto("/login");
	await expect(page).not.toHaveURL(/\/login/);
	await expect(
		page.getByRole("link", { name: /applications/i }).first(),
	).toBeVisible();
});
