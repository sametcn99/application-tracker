const DEFAULT_POSTGRES_HOST = "postgres";
const DEFAULT_POSTGRES_PORT = "5432";
const DEFAULT_POSTGRES_SCHEMA = "public";

export function getDatabaseUrl(): string {
	if (process.env.DATABASE_URL) {
		return process.env.DATABASE_URL;
	}

	const user = process.env.POSTGRES_USER || "appuser";
	const password =
		process.env.POSTGRES_PASSWORD || "change-me-postgres-password";
	const database = process.env.POSTGRES_DB || "appdb";
	const host = process.env.POSTGRES_HOST || DEFAULT_POSTGRES_HOST;
	const port = process.env.POSTGRES_PORT || DEFAULT_POSTGRES_PORT;
	const schema = process.env.POSTGRES_SCHEMA || DEFAULT_POSTGRES_SCHEMA;

	return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?schema=${encodeURIComponent(schema)}`;
}
