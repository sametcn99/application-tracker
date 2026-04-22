import { expect, test } from "@playwright/test";

const createRunId = () =>
	`${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

test("application form blocks submit when required fields are missing", async ({
	page,
}) => {
	await page.goto("/applications/new");
	await page.getByRole("button", { name: /^(create|save|submit)/i }).click();

	await expect(page).toHaveURL(/\/applications\/new/);
	await expect(page.getByText("This field is required.")).toHaveCount(2);
});

test("create → view → delete an application end-to-end", async ({ page }) => {
	const runId = createRunId();
	const company = `Acme E2E ${runId}`;
	const position = `SWE Smoke ${runId}`;

	// Create
	await page.goto("/applications/new");
	await page.locator('input[name="company"]').fill(company);
	await page.locator('input[name="position"]').fill(position);
	await page.getByRole("button", { name: /^(create|save|submit)/i }).click();

	// We should land on detail or list with the new entry visible.
	await expect(
		page.getByRole("heading", { name: position }).first(),
	).toBeVisible({ timeout: 15_000 });

	// A non-matching query should show the empty state and reset should recover the item.
	await page.goto("/applications");
	const search = page.getByPlaceholder(/search/i).first();
	if (await search.isVisible().catch(() => false)) {
		await search.fill(`missing-${runId}`);
		await search.blur();
		await expect(page).toHaveURL(new RegExp(`q=missing-${runId}`));
		await expect(
			page.getByText(/no applications match your filters\./i),
		).toBeVisible();
		await page.getByRole("button", { name: /reset filters/i }).click();
		await expect(page).toHaveURL(/\/applications\/?$/);
	}
	await expect(
		page.getByRole("link", { name: new RegExp(position, "i") }).first(),
	).toBeVisible();

	// Open detail via the link.
	await page
		.getByRole("link", { name: new RegExp(position, "i") })
		.first()
		.click();
	await expect(
		page.getByRole("heading", { name: position }).first(),
	).toBeVisible();

	// Delete the application.
	const deleteBtn = page.getByRole("button", { name: /delete/i }).first();
	if (await deleteBtn.isVisible().catch(() => false)) {
		page.once("dialog", (d) => d.accept());
		await deleteBtn.click();
		// Some implementations use a Radix dialog with a confirm button.
		const confirm = page.getByRole("button", { name: /^(confirm|delete)$/i });
		if (await confirm.isVisible().catch(() => false)) {
			await confirm.click();
		}
		await expect(page).toHaveURL(/\/applications\/?$/, { timeout: 15_000 });
	}
});
