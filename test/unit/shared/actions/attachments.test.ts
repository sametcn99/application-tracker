import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => {
	const mocked = {
		attachment: {
			create: vi.fn(),
			findUnique: vi.fn(),
			delete: vi.fn(),
		},
		activityEntry: {
			create: vi.fn(),
		},
	};
	return {
		...mocked,
		$transaction: vi.fn(async (callback) => callback(mocked)),
	};
});
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
const s3send = vi.hoisted(() => vi.fn());

vi.mock("@/shared/lib/prisma", () => ({ prisma }));
vi.mock("next/cache", () => cache);
vi.mock("@/shared/lib/s3", () => ({
	s3: { send: s3send },
	S3_BUCKET: "test-bucket",
}));
vi.mock("@aws-sdk/client-s3", () => ({
	PutObjectCommand: class {
		constructor(public input: unknown) {}
	},
	DeleteObjectCommand: class {
		constructor(public input: unknown) {}
	},
}));

import {
	deleteAttachmentAction,
	uploadAttachmentAction,
} from "@/shared/actions/attachments";

function fileFrom(name: string, type: string, content = "hello") {
	return new File([content], name, { type });
}

describe("uploadAttachmentAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		s3send.mockResolvedValue({});
	});

	it("rejects when no file is provided", async () => {
		const fd = new FormData();
		const res = await uploadAttachmentAction("app1", fd);
		expect(res).toEqual({ ok: false, error: "validation.required" });
	});

	it("rejects empty files", async () => {
		const fd = new FormData();
		fd.append("file", new File([], "empty.pdf", { type: "application/pdf" }));
		const res = await uploadAttachmentAction("app1", fd);
		expect(res).toEqual({ ok: false, error: "validation.required" });
	});

	it("rejects files larger than the configured cap", async () => {
		const original = process.env.UPLOAD_MAX_BYTES;
		process.env.UPLOAD_MAX_BYTES = "5";
		vi.resetModules();
		// Re-import fresh module so the new env value applies.
		const mod = await import("@/shared/actions/attachments");
		const fd = new FormData();
		fd.append("file", fileFrom("big.txt", "text/plain", "this is too big"));
		const res = await mod.uploadAttachmentAction("app1", fd);
		expect(res).toEqual({ ok: false, error: "attachments.tooLarge" });
		process.env.UPLOAD_MAX_BYTES = original;
		vi.resetModules();
	});

	it("uploads to S3, persists the attachment, logs activity, and revalidates", async () => {
		prisma.attachment.create.mockResolvedValueOnce({ id: "att1" });
		const fd = new FormData();
		fd.append("file", fileFrom("My Resume!.pdf", "application/pdf"));
		const res = await uploadAttachmentAction("app1", fd);
		expect(res).toEqual({ ok: true });
		expect(s3send).toHaveBeenCalledTimes(1);
		const putArg = (s3send.mock.calls[0][0] as { input: { Key: string } })
			.input;
		expect(putArg.Key).toMatch(/^app1\/.+__My_Resume_\.pdf$/);
		expect(prisma.attachment.create).toHaveBeenCalled();
		expect(prisma.activityEntry.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					applicationId: "app1",
					type: "ATTACHMENT_ADDED",
				}),
			}),
		);
		expect(cache.revalidatePath).toHaveBeenCalledWith("/applications/app1");
	});
});

describe("deleteAttachmentAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		s3send.mockResolvedValue({});
	});

	it("is a no-op when the attachment does not exist", async () => {
		prisma.attachment.findUnique.mockResolvedValueOnce(null);
		await deleteAttachmentAction("missing");
		expect(s3send).not.toHaveBeenCalled();
		expect(prisma.attachment.delete).not.toHaveBeenCalled();
		expect(cache.revalidatePath).not.toHaveBeenCalled();
	});

	it("deletes from S3 and DB, logs activity, and revalidates", async () => {
		prisma.attachment.findUnique.mockResolvedValueOnce({
			id: "a1",
			applicationId: "app1",
			storagePath: "app1/key",
			fileName: "cv.pdf",
		});
		await deleteAttachmentAction("a1");
		expect(s3send).toHaveBeenCalledTimes(1);
		expect(prisma.attachment.delete).toHaveBeenCalledWith({
			where: { id: "a1" },
		});
		expect(prisma.activityEntry.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					applicationId: "app1",
					type: "ATTACHMENT_REMOVED",
				}),
			}),
		);
		expect(cache.revalidatePath).toHaveBeenCalledWith("/applications/app1");
	});

	it("ignores S3 errors and still removes the DB row", async () => {
		prisma.attachment.findUnique.mockResolvedValueOnce({
			id: "a1",
			applicationId: "app1",
			storagePath: "app1/key",
			fileName: "cv.pdf",
		});
		s3send.mockRejectedValueOnce(new Error("not found"));
		await deleteAttachmentAction("a1");
		expect(prisma.attachment.delete).toHaveBeenCalled();
	});
});
