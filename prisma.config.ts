import { defineConfig } from "prisma/config";
import { getDatabaseUrl } from "./src/shared/lib/database-url";

const databaseUrl = resolveDatabaseUrl();

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
	// @ts-ignore
	earlyAccess: true,
});

function resolveDatabaseUrl() {
	try {
		return getDatabaseUrl();
	} catch (error) {
		if (process.argv.includes("generate")) {
			return undefined;
		}

		throw error;
	}
}
