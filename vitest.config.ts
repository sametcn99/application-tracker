import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": new URL("./src", import.meta.url).pathname,
			"server-only": new URL("./test/stubs/server-only.ts", import.meta.url)
				.pathname,
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./test/setup.ts"],
		include: ["test/unit/**/*.test.{ts,tsx}"],
		exclude: ["node_modules", ".next", "e2e", "test/e2e/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"src/**/*.d.ts",
				"src/**/types.ts",
				"src/**/*.schema.ts",
				"src/app/**/layout.tsx",
				"src/app/**/loading.tsx",
				"src/app/**/error.tsx",
				"src/app/**/not-found.tsx",
				"src/app/**/page.tsx",
				"src/i18n/**",
				"src/proxy.ts",
				"src/types/**",
				"prisma/**",
			],
		},
	},
});
