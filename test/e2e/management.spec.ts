import { expect, test } from "@playwright/test";

const createRunId = () =>
	`${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

test("sources page creates a source and ignores duplicate submissions", async ({
	page,
}) => {
	const name = `Portfolio ${createRunId()}`;
	const addSourceButton = page.getByRole("button", { name: /add source/i });

	await page.goto("/sources");
	await expect(page.getByRole("heading", { name: /sources/i })).toBeVisible();
	await page.getByPlaceholder(/company website/i).fill(name);
	await expect(addSourceButton).toBeEnabled();
	await addSourceButton.click();

	const sourceCards = page
		.locator(".rt-Card")
		.filter({ has: page.getByText(name, { exact: true }) });
	await expect(sourceCards).toHaveCount(1);

	await page.getByPlaceholder(/company website/i).fill(name);
	await expect(addSourceButton).toBeEnabled();
	await addSourceButton.click();
	await expect(sourceCards).toHaveCount(1);
});

test("sources page deletes a created source", async ({ page }) => {
	const name = `Delete Source ${createRunId()}`;
	const addSourceButton = page.getByRole("button", { name: /add source/i });

	await page.goto("/sources");
	await page.getByPlaceholder(/company website/i).fill(name);
	await expect(addSourceButton).toBeEnabled();
	await addSourceButton.click();

	const sourceCard = page
		.locator(".rt-Card")
		.filter({ has: page.getByText(name, { exact: true }) });
	await expect(sourceCard).toHaveCount(1);

	await sourceCard.getByRole("button").click();
	await page
		.getByRole("alertdialog")
		.getByRole("button", { name: /^delete$/i })
		.click();
	await expect(sourceCard).toHaveCount(0);
});

test("currencies page falls back to a manual rate for unknown codes", async ({
	page,
}) => {
	const runId = createRunId();
	const code = `XZ${runId.slice(-3).toUpperCase()}`;
	const rawCode = code.toLowerCase();
	const name = `Manual Currency ${runId}`;
	const addCurrencyButton = page.getByRole("button", {
		name: /add currency/i,
	});

	await page.goto("/currencies");
	await expect(
		page.getByRole("heading", { name: /currencies/i }),
	).toBeVisible();
	await page.getByPlaceholder("EUR", { exact: true }).fill(rawCode);
	await page.getByPlaceholder("Euro", { exact: true }).fill(name);
	await expect(addCurrencyButton).toBeEnabled();
	await addCurrencyButton.click();

	await expect(
		page.getByText(/live exchange rate could not be fetched/i),
	).toBeVisible();

	await page.getByPlaceholder("EUR", { exact: true }).fill(rawCode);
	await page.getByPlaceholder("Euro", { exact: true }).fill(name);
	await page.getByPlaceholder("1.08", { exact: true }).fill("1.25");
	await expect(addCurrencyButton).toBeEnabled();
	await addCurrencyButton.click();

	const currencyCard = page
		.locator(".rt-Card")
		.filter({ has: page.getByText(code, { exact: true }) })
		.first();
	await expect(currencyCard.getByText(code, { exact: true })).toBeVisible({
		timeout: 15_000,
	});
	await expect(currencyCard.getByText(name, { exact: true })).toBeVisible();
	await expect(currencyCard.getByText("Manual", { exact: true })).toBeVisible();
	await expect(currencyCard.getByText(`1 ${code} = $1.25`)).toBeVisible();
});

test("currencies page can switch the default currency", async ({ page }) => {
	await page.goto("/currencies");
	await expect(
		page.getByRole("heading", { name: /currencies/i }),
	).toBeVisible();

	const eurCard = page
		.locator(".rt-Card")
		.filter({ has: page.getByText("EUR", { exact: true }) })
		.first();
	await eurCard.getByRole("button", { name: /set default/i }).click();
	await page.reload();

	const eurDefaultCard = page
		.locator(".rt-Card")
		.filter({ has: page.getByText("EUR", { exact: true }) })
		.first();
	await expect(eurDefaultCard).toContainText("Default selection");
	await expect(eurDefaultCard).toContainText("Default");
});

test("tags page creates a tag with the default color", async ({ page }) => {
	const name = `tag-${createRunId()}`;

	await page.goto("/tags");
	await expect(page.getByRole("heading", { name: /tags/i })).toBeVisible();
	await page.getByPlaceholder(/backend/i).fill(name);
	await page.getByRole("button", { name: /^add$/i }).click();

	const tagRow = page
		.getByRole("row")
		.filter({ has: page.getByText(name, { exact: true }) });
	await expect(tagRow).toHaveCount(1);
	await expect(tagRow.first()).toContainText("gray");
});

test("tags page deletes a created tag", async ({ page }) => {
	const name = `delete-tag-${createRunId()}`;

	await page.goto("/tags");
	await page.getByPlaceholder(/backend/i).fill(name);
	await page.getByRole("button", { name: /^add$/i }).click();

	const tagRow = page
		.getByRole("row")
		.filter({ has: page.getByText(name, { exact: true }) });
	await expect(tagRow).toHaveCount(1);

	await tagRow.getByRole("button").click();
	await page
		.getByRole("alertdialog")
		.getByRole("button", { name: /^delete$/i })
		.click();
	await expect(tagRow).toHaveCount(0);
});
