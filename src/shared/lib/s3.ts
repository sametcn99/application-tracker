import { S3Client } from "@aws-sdk/client-s3";

/**
 * S3-compatible client (MinIO in dev / docker-compose).
 *
 * Env vars:
 *   S3_ENDPOINT          e.g. http://minio:9000
 *   S3_REGION            e.g. us-east-1
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   S3_BUCKET            e.g. attachments
 *   S3_FORCE_PATH_STYLE  "true" for MinIO
 */
export const S3_BUCKET = process.env.S3_BUCKET || "attachments";

export const s3 = new S3Client({
	region: process.env.S3_REGION || "us-east-1",
	endpoint: process.env.S3_ENDPOINT,
	forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") === "true",
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
	},
});
