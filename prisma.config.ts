import { defineConfig } from "prisma/config";
import { getDatabaseUrl } from "./src/shared/lib/database-url";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: getDatabaseUrl(),
	},
	// @ts-ignore
	earlyAccess: true,
});
