"use server";

import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/prisma";
import { S3_BUCKET, s3 } from "@/shared/lib/s3";

const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES ?? 10_485_760);

export async function uploadAttachmentAction(
	applicationId: string,
	formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
	const file = formData.get("file");
	if (!(file instanceof File) || file.size === 0) {
		return { ok: false, error: "validation.required" };
	}
	if (file.size > MAX_BYTES) {
		return { ok: false, error: "attachments.tooLarge" };
	}

	const id = randomUUID();
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
	const key = applicationId + "/" + id + "__" + safeName;

	const buf = Buffer.from(await file.arrayBuffer());
	await s3.send(
		new PutObjectCommand({
			Bucket: S3_BUCKET,
			Key: key,
			Body: buf,
			ContentType: file.type || "application/octet-stream",
			ContentLength: file.size,
		}),
	);

	const att = await prisma.attachment.create({
		data: {
			applicationId,
			fileName: file.name,
			mimeType: file.type || "application/octet-stream",
			size: file.size,
			storagePath: key,
		},
	});

	await prisma.activityEntry.create({
		data: {
			applicationId,
			type: "ATTACHMENT_ADDED",
			field: "attachment",
			newValue: JSON.stringify({
				id: att.id,
				fileName: file.name,
				size: file.size,
			}),
		},
	});

	revalidatePath("/applications/" + applicationId);
	return { ok: true };
}

export async function deleteAttachmentAction(
	attachmentId: string,
): Promise<void> {
	const att = await prisma.attachment.findUnique({
		where: { id: attachmentId },
	});
	if (!att) return;
	try {
		await s3.send(
			new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: att.storagePath }),
		);
	} catch {
		/* object may already be missing */
	}
	await prisma.attachment.delete({ where: { id: attachmentId } });
	await prisma.activityEntry.create({
		data: {
			applicationId: att.applicationId,
			type: "ATTACHMENT_REMOVED",
			field: "attachment",
			oldValue: JSON.stringify({ fileName: att.fileName }),
		},
	});
	revalidatePath("/applications/" + att.applicationId);
}
