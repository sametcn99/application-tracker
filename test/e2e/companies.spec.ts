import { expect, test } from "@playwright/test";

const createRunId = () =>
	`${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

test("companies page lists companies and supports navigation to new", async ({
	page,
}) => {
	await page.goto("/companies");
	await expect(
		page.getByRole("heading", { name: /companies/i }).first(),
	).toBeVisible();
	const newBtn = page.getByRole("link", { name: /new company/i });
	if (await newBtn.isVisible().catch(() => false)) {
		await newBtn.click({ force: true });
		await expect(page).toHaveURL(/\/companies\/new/);
		await expect(page.getByPlaceholder(/acme inc\./i)).toBeVisible();
	}
});

test("company form shows validation errors for invalid URLs", async ({
	page,
}) => {
	await page.goto("/companies/new");
	await page
		.getByPlaceholder(/acme inc\./i)
		.fill(`Invalid URL Co ${createRunId()}`);
	await page
		.getByPlaceholder("https://acme.example.com", { exact: true })
		.fill("not-a-valid-url");
	await page
		.getByRole("button", { name: /create|save|submit/i })
		.first()
		.click();

	await expect(page).toHaveURL(/\/companies\/new/);
	await expect(page.getByText("Invalid URL.")).toBeVisible();
});

test("create a company end-to-end", async ({ page }) => {
	const name = `E2E Co ${createRunId()}`;

	await page.goto("/companies/new");
	await page.getByPlaceholder(/acme inc\./i).fill(name);
	await page
		.getByRole("button", { name: /create|save|submit/i })
		.first()
		.click();

	await expect(page.getByRole("heading", { name: name }).first()).toBeVisible({
		timeout: 15_000,
	});
});

test("duplicate company names are rejected without navigation", async ({
	page,
}) => {
	const name = `Dup Co ${createRunId()}`;

	await page.goto("/companies/new");
	await page.getByPlaceholder(/acme inc\./i).fill(name);
	await page
		.getByRole("button", { name: /create|save|submit/i })
		.first()
		.click();
	await expect(page.getByRole("heading", { name }).first()).toBeVisible({
		timeout: 15_000,
	});

	await page.goto("/companies/new");
	await page.getByPlaceholder(/acme inc\./i).fill(name);
	await page
		.getByRole("button", { name: /create|save|submit/i })
		.first()
		.click();

	await expect(page).toHaveURL(/\/companies\/new/);
	await expect(
		page.getByText(/a company with this name already exists\./i),
	).toBeVisible();
});
