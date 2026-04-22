import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const aws = vi.hoisted(() => ({
	S3Client: vi.fn(function S3Client(
		this: { config: unknown },
		config: unknown,
	) {
		this.config = config;
	}),
}));

vi.mock("@aws-sdk/client-s3", () => aws);

const ORIGINAL_ENV = { ...process.env };

async function loadS3Module() {
	vi.resetModules();
	return import("@/shared/lib/s3");
}

describe("s3 module", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env = { ...ORIGINAL_ENV };
		delete process.env.S3_BUCKET;
		delete process.env.S3_REGION;
		delete process.env.S3_ENDPOINT;
		delete process.env.S3_ACCESS_KEY_ID;
		delete process.env.S3_SECRET_ACCESS_KEY;
		delete process.env.S3_FORCE_PATH_STYLE;
	});

	afterEach(() => {
		process.env = { ...ORIGINAL_ENV };
	});

	it("uses sane defaults when env vars are absent", async () => {
		const mod = await loadS3Module();
		expect(mod.S3_BUCKET).toBe("attachments");
		expect(aws.S3Client).toHaveBeenCalledWith({
			region: "us-east-1",
			endpoint: undefined,
			forcePathStyle: true,
			credentials: {
				accessKeyId: "minioadmin",
				secretAccessKey: "minioadmin",
			},
		});
	});

	it("honors explicit env configuration", async () => {
		process.env.S3_BUCKET = "custom-bucket";
		process.env.S3_REGION = "eu-west-1";
		process.env.S3_ENDPOINT = "http://localhost:9000";
		process.env.S3_ACCESS_KEY_ID = "key";
		process.env.S3_SECRET_ACCESS_KEY = "secret";
		process.env.S3_FORCE_PATH_STYLE = "false";

		const mod = await loadS3Module();
		expect(mod.S3_BUCKET).toBe("custom-bucket");
		expect(aws.S3Client).toHaveBeenCalledWith({
			region: "eu-west-1",
			endpoint: "http://localhost:9000",
			forcePathStyle: false,
			credentials: {
				accessKeyId: "key",
				secretAccessKey: "secret",
			},
		});
	});
});
