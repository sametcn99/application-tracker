import { Buffer } from "node:buffer";
import { expect, type Page, test } from "@playwright/test";

const createRunId = () =>
	`${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function createApplication(page: Page, runId: string) {
	const company = `Detail Co ${runId}`;
	const position = `Detail Role ${runId}`;

	await page.goto("/applications/new");
	await page.locator('input[name="company"]').fill(company);
	await page.locator('input[name="position"]').fill(position);
	await page.getByRole("button", { name: /^(create|save|submit)/i }).click();
	await expect(
		page.getByRole("heading", { name: position }).first(),
	).toBeVisible({ timeout: 15_000 });

	return { company, position };
}

test("application detail records comment and attachment activity", async ({
	page,
}) => {
	const runId = createRunId();
	const note = `detail-note-${runId}`;
	const fileName = `attachment-${runId}.txt`;
	const { position } = await createApplication(page, runId);

	await page.getByRole("tab", { name: /activity/i }).click();
	await page.getByPlaceholder(/write a note/i).fill(note);
	await page.getByRole("button", { name: /add comment/i }).click();
	await expect(page.getByRole("button", { name: /add comment/i })).toBeEnabled({
		timeout: 30_000,
	});

	await page.getByRole("tab", { name: /activity/i }).click();
	const commentCard = page
		.locator(".rt-Card")
		.filter({ has: page.getByText(note, { exact: true }) })
		.first();
	await expect(commentCard).toContainText("Comment");
	await expect(commentCard).toContainText(note);

	await page.getByRole("tab", { name: /attachments/i }).click();
	await page.locator('input[type="file"]').setInputFiles({
		name: fileName,
		mimeType: "text/plain",
		buffer: Buffer.from(`attachment-body-${runId}`),
	});
	await expect(page.getByRole("button", { name: /upload/i })).toBeEnabled({
		timeout: 30_000,
	});

	await page.getByRole("tab", { name: /attachments/i }).click();
	const attachmentRow = page
		.getByRole("row")
		.filter({ has: page.getByRole("link", { name: fileName, exact: true }) });
	await expect(attachmentRow).toHaveCount(1);

	await attachmentRow.getByRole("button").click();
	await page.getByRole("tab", { name: /attachments/i }).click();
	await expect(page.getByText(/no attachments uploaded\./i)).toBeVisible();

	await page.getByRole("tab", { name: /activity/i }).click();
	await expect(page.getByText(/attachment added/i)).toBeVisible();
	await expect(page.getByText(/attachment removed/i)).toBeVisible();
	await expect(page.getByText(note, { exact: true })).toBeVisible();

	await page.goto("/activity");
	const feedCard = page
		.locator(".rt-Card")
		.filter({ has: page.getByText(note, { exact: true }) })
		.first();
	await expect(feedCard).toContainText(position);
	await expect(feedCard).toContainText("Comment");
	await expect(feedCard).toContainText(note);
});

test("attachments reject oversized uploads", async ({ page }) => {
	const runId = createRunId();
	await createApplication(page, runId);

	await page.getByRole("tab", { name: /attachments/i }).click();
	await page.locator('input[type="file"]').setInputFiles({
		name: `too-large-${runId}.bin`,
		mimeType: "application/octet-stream",
		buffer: Buffer.alloc(11 * 1024 * 1024, 1),
	});

	await expect(page.getByText(/file is too large\./i)).toBeVisible();
	await expect(page.getByText(/no attachments uploaded\./i)).toBeVisible();
});
