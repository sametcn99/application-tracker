import path from "node:path";
import { fileTypeFromBuffer } from "file-type";

export const DEFAULT_ALLOWED_ATTACHMENT_MIME_TYPES = [
	"application/pdf",
	"text/plain",
	"image/png",
	"image/jpeg",
] as const;

export const DEFAULT_ALLOWED_ATTACHMENT_EXTENSIONS = [
	".pdf",
	".txt",
	".png",
	".jpg",
	".jpeg",
] as const;

export type AttachmentValidationResult =
	| { ok: true; mimeType: string }
	| { ok: false; error: "attachments.invalidType" };

export function parseAttachmentAllowListFromEnv(
	value: string | undefined,
	defaults: readonly string[],
) {
	const parsed = value
		?.split(",")
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);

	return parsed?.length ? parsed : [...defaults];
}

function normalizeExtension(fileName: string) {
	return path.extname(fileName).trim().toLowerCase();
}

function looksLikePlainText(buffer: Buffer) {
	if (buffer.includes(0)) return false;
	return buffer.toString("utf8").length > 0;
}

export async function validateAttachmentFile(
	file: File,
	buffer: Buffer,
): Promise<AttachmentValidationResult> {
	const allowedMimeTypes = parseAttachmentAllowListFromEnv(
		process.env.UPLOAD_ALLOWED_MIME_TYPES,
		DEFAULT_ALLOWED_ATTACHMENT_MIME_TYPES,
	);
	const allowedExtensions = parseAttachmentAllowListFromEnv(
		process.env.UPLOAD_ALLOWED_EXTENSIONS,
		DEFAULT_ALLOWED_ATTACHMENT_EXTENSIONS,
	);
	const extension = normalizeExtension(file.name);
	if (!allowedExtensions.includes(extension)) {
		return { ok: false, error: "attachments.invalidType" };
	}

	const declaredMimeType = (
		file.type || "application/octet-stream"
	).toLowerCase();
	const detected = await fileTypeFromBuffer(new Uint8Array(buffer));
	const detectedMimeType = detected?.mime.toLowerCase();
	const mimeType =
		detectedMimeType ??
		(looksLikePlainText(buffer) ? "text/plain" : declaredMimeType);

	if (!allowedMimeTypes.includes(mimeType)) {
		return { ok: false, error: "attachments.invalidType" };
	}

	if (
		detectedMimeType &&
		declaredMimeType !== "application/octet-stream" &&
		declaredMimeType !== detectedMimeType
	) {
		return { ok: false, error: "attachments.invalidType" };
	}

	return { ok: true, mimeType };
}
