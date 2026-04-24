import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { S3_BUCKET, s3 } from "@/shared/lib/s3";

type ComponentStatus = "ok" | "error";

export async function GET() {
	const components: Record<"database" | "storage", ComponentStatus> = {
		database: "ok",
		storage: "ok",
	};

	try {
		await prisma.$queryRaw`SELECT 1`;
	} catch {
		components.database = "error";
	}

	try {
		await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
	} catch {
		components.storage = "error";
	}

	const ok = Object.values(components).every((status) => status === "ok");
	return NextResponse.json(
		{ ok, service: "application-tracker", components },
		{ status: ok ? 200 : 503 },
	);
}
