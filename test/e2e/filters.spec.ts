import { expect, test } from "@playwright/test";

test("applications list filters by status query parameter", async ({
	page,
}) => {
	await page.goto("/applications?status=APPLIED");
	await expect(page).toHaveURL(/status=APPLIED/);
	// Filters bar should reflect the active filter chip somewhere on the page.
	await expect(page.getByText(/applied/i).first()).toBeVisible();
});

test("activity page renders without server errors", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(e.message));
	await page.goto("/activity");
	await expect(page).not.toHaveURL(/\/login/);
	expect(errors).toEqual([]);
});
