import { GetObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";
import { S3_BUCKET, s3 } from "@/shared/lib/s3";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth();
	if (!session) return new Response("Unauthorized", { status: 401 });

	const { id } = await params;
	const att = await prisma.attachment.findUnique({ where: { id } });
	if (!att) return new Response("Not found", { status: 404 });

	try {
		const obj = await s3.send(
			new GetObjectCommand({ Bucket: S3_BUCKET, Key: att.storagePath }),
		);
		const body = obj.Body;
		if (!body) return new Response("File missing", { status: 404 });

		const stream = body as unknown as ReadableStream;
		return new Response(stream, {
			headers: {
				"Content-Type": att.mimeType,
				"Content-Disposition":
					'attachment; filename="' + encodeURIComponent(att.fileName) + '"',
				"Content-Length": String(att.size),
			},
		});
	} catch {
		return new Response("File missing", { status: 404 });
	}
}
