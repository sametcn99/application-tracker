const DEFAULT_POSTGRES_HOST = "postgres";
const DEFAULT_POSTGRES_PORT = "5432";
const DEFAULT_POSTGRES_SCHEMA = "public";

export function getDatabaseUrl(): string {
	if (process.env.DATABASE_URL) {
		return process.env.DATABASE_URL;
	}

	const user = requireEnv("POSTGRES_USER");
	const password = requireEnv("POSTGRES_PASSWORD");
	const database = requireEnv("POSTGRES_DB");
	const host = process.env.POSTGRES_HOST || DEFAULT_POSTGRES_HOST;
	const port = process.env.POSTGRES_PORT || DEFAULT_POSTGRES_PORT;
	const schema = process.env.POSTGRES_SCHEMA || DEFAULT_POSTGRES_SCHEMA;

	return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?schema=${encodeURIComponent(schema)}`;
}

function requireEnv(
	name: "POSTGRES_USER" | "POSTGRES_PASSWORD" | "POSTGRES_DB",
) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} must be set when DATABASE_URL is not provided.`);
	}

	return value;
}
