import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
	testDir: "./test/e2e",
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [["github"], ["list"]] : "list",
	use: {
		baseURL: BASE_URL,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},
	projects: [
		{
			name: "setup",
			testMatch: /.*\.setup\.ts/,
		},
		{
			name: "chromium",
			dependencies: ["setup"],
			use: {
				...devices["Desktop Chrome"],
				storageState: "test/e2e/.auth/admin.json",
			},
		},
	],
	webServer: process.env.E2E_NO_WEB_SERVER
		? undefined
		: {
				command: "bun run test:e2e:server",
				url: BASE_URL,
				reuseExistingServer: !!process.env.E2E_REUSE_EXISTING_SERVER,
				timeout: 300_000,
				stdout: "pipe",
				stderr: "pipe",
			},
});
