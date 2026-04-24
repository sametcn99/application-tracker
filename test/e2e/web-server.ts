import { spawn } from "node:child_process";
import { access, cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import {
	GenericContainer,
	type StartedTestContainer,
	Wait,
} from "testcontainers";

const PORT = process.env.PORT ?? "3000";
const POSTGRES_USER = process.env.E2E_POSTGRES_USER ?? "appuser";
const POSTGRES_PASSWORD = process.env.E2E_POSTGRES_PASSWORD ?? "apppassword";
const POSTGRES_DB = process.env.E2E_POSTGRES_DB ?? "appdb";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "change-me";
const ADMIN_NAME =
	process.env.E2E_ADMIN_NAME ?? process.env.ADMIN_NAME ?? "Admin";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID ?? "minioadmin";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY ?? "minioadmin";
const S3_BUCKET = process.env.S3_BUCKET ?? "attachments";
const S3_REGION = process.env.S3_REGION ?? "us-east-1";

let postgresContainer: StartedTestContainer | null = null;
let minioContainer: StartedTestContainer | null = null;
let shuttingDown = false;

function buildRuntimeEnv() {
	if (!postgresContainer || !minioContainer) {
		throw new Error("E2E infrastructure is not ready.");
	}

	const postgresHost = postgresContainer.getHost();
	const postgresPort = postgresContainer.getMappedPort(5432);
	const minioHost = minioContainer.getHost();
	const minioPort = minioContainer.getMappedPort(9000);

	return {
		DATABASE_URL: `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${postgresHost}:${postgresPort}/${POSTGRES_DB}?schema=public`,
		AUTH_SECRET:
			process.env.AUTH_SECRET ??
			"e2e-secret-please-change-please-change-please-change",
		AUTH_TRUST_HOST: "true",
		ADMIN_EMAIL,
		ADMIN_PASSWORD,
		ADMIN_NAME,
		UPLOAD_MAX_BYTES: process.env.UPLOAD_MAX_BYTES ?? "10485760",
		S3_ENDPOINT: `http://${minioHost}:${minioPort}`,
		S3_REGION,
		S3_ACCESS_KEY_ID,
		S3_SECRET_ACCESS_KEY,
		S3_BUCKET,
		S3_FORCE_PATH_STYLE: "true",
		E2E_ADMIN_EMAIL: ADMIN_EMAIL,
		E2E_ADMIN_PASSWORD: ADMIN_PASSWORD,
		PORT,
		HOSTNAME: "127.0.0.1",
	};
}

async function runCommand(
	command: string,
	args: string[],
	env: Record<string, string>,
	label: string,
) {
	console.log(`-> ${label}`);

	await new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: process.cwd(),
			env: { ...process.env, ...env },
			stdio: "inherit",
		});

		child.once("error", reject);
		child.once("exit", (code) => {
			if (code === 0) {
				resolve();
				return;
			}

			reject(new Error(`${label} failed with exit code ${code ?? "unknown"}.`));
		});
	});
}

async function ensureBucket(endpoint: string) {
	const client = new S3Client({
		region: S3_REGION,
		endpoint,
		forcePathStyle: true,
		credentials: {
			accessKeyId: S3_ACCESS_KEY_ID,
			secretAccessKey: S3_SECRET_ACCESS_KEY,
		},
	});
	for (let attempt = 1; attempt <= 20; attempt++) {
		try {
			await client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
			return;
		} catch (error) {
			const httpStatusCode =
				typeof error === "object" && error !== null && "$metadata" in error
					? (error.$metadata as { httpStatusCode?: number }).httpStatusCode
					: undefined;
			const name =
				typeof error === "object" && error !== null && "name" in error
					? String(error.name)
					: "";

			if (
				httpStatusCode === 409 ||
				name === "BucketAlreadyOwnedByYou" ||
				name === "BucketAlreadyExists"
			) {
				return;
			}

			if (attempt === 20) {
				throw error;
			}

			await delay(500);
		}
	}
}

async function syncStandaloneAssets() {
	const standaloneRoot = resolve(".next/standalone");

	await mkdir(resolve(standaloneRoot, ".next"), { recursive: true });
	await cp(resolve(".next/static"), resolve(standaloneRoot, ".next/static"), {
		recursive: true,
		force: true,
	});
	await cp(resolve("public"), resolve(standaloneRoot, "public"), {
		recursive: true,
		force: true,
	});
}
async function cleanup(exitCode = 0) {
	if (shuttingDown) {
		return;
	}

	shuttingDown = true;

	await Promise.allSettled([minioContainer?.stop(), postgresContainer?.stop()]);

	process.exit(exitCode);
}

process.on("SIGINT", () => {
	void cleanup(0);
});

process.on("SIGTERM", () => {
	void cleanup(0);
});

async function main() {
	console.log("-> Starting PostgreSQL test container...");
	postgresContainer = await new GenericContainer(
		process.env.E2E_POSTGRES_IMAGE ?? "postgres:16-alpine",
	)
		.withEnvironment({
			POSTGRES_USER,
			POSTGRES_PASSWORD,
			POSTGRES_DB,
		})
		.withExposedPorts(5432)
		.withWaitStrategy(
			Wait.forLogMessage(/database system is ready to accept connections/i),
		)
		.start();

	console.log("-> Starting MinIO test container...");
	minioContainer = await new GenericContainer(
		process.env.E2E_MINIO_IMAGE ?? "minio/minio:latest",
	)
		.withCommand(["server", "/data"])
		.withEnvironment({
			MINIO_ROOT_USER: S3_ACCESS_KEY_ID,
			MINIO_ROOT_PASSWORD: S3_SECRET_ACCESS_KEY,
		})
		.withExposedPorts(9000)
		.withWaitStrategy(Wait.forHttp("/minio/health/live", 9000))
		.start();

	const runtimeEnv = buildRuntimeEnv();
	await ensureBucket(runtimeEnv.S3_ENDPOINT);

	await runCommand(
		"bun",
		["x", "prisma", "migrate", "deploy"],
		runtimeEnv,
		"Apply Prisma migrations",
	);
	await runCommand(
		"bun",
		["x", "prisma", "generate"],
		runtimeEnv,
		"Generate Prisma client",
	);
	await runCommand("bun", ["run", "db:seed"], runtimeEnv, "Seed database");

	if (process.env.E2E_SKIP_BUILD !== "1") {
		await runCommand(
			"bun",
			["run", "build"],
			runtimeEnv,
			"Build standalone app",
		);
	} else {
		await access(".next/standalone/server.js");
	}

	console.log("-> Syncing standalone static assets...");
	await syncStandaloneAssets();

	console.log("-> Starting standalone Next.js server...");
	Object.assign(process.env, runtimeEnv);
	await import(pathToFileURL(resolve(".next/standalone/server.js")).href);
}

main().catch((error) => {
	console.error(error);
	void cleanup(1);
});
