import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
	attachment: {
		findUnique: vi.fn(),
	},
}));
const s3Mock = vi.hoisted(() => ({
	send: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/shared/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/shared/lib/s3", () => ({
	S3_BUCKET: "bucket-test",
	s3: s3Mock,
}));

import { GET } from "@/app/api/attachments/[id]/route";

describe("attachment route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		authMock.mockResolvedValue({ user: { id: "user-1" } });
		prismaMock.attachment.findUnique.mockResolvedValue({
			id: "att-1",
			fileName: "resume.pdf",
			mimeType: "application/pdf",
			size: 123,
			storagePath: "app-1/att-1__resume.pdf",
		});
	});

	it("returns 401 when there is no session", async () => {
		authMock.mockResolvedValueOnce(null);

		const response = await GET(new Request("http://localhost"), {
			params: Promise.resolve({ id: "att-1" }),
		});

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Unauthorized");
	});

	it("returns 404 when the attachment does not exist", async () => {
		prismaMock.attachment.findUnique.mockResolvedValueOnce(null);

		const response = await GET(new Request("http://localhost"), {
			params: Promise.resolve({ id: "missing" }),
		});

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Not found");
	});

	it("returns 404 when S3 returns no body", async () => {
		s3Mock.send.mockResolvedValueOnce({ Body: null });

		const response = await GET(new Request("http://localhost"), {
			params: Promise.resolve({ id: "att-1" }),
		});

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("File missing");
	});

	it("returns 404 when S3 throws", async () => {
		s3Mock.send.mockRejectedValueOnce(new Error("boom"));

		const response = await GET(new Request("http://localhost"), {
			params: Promise.resolve({ id: "att-1" }),
		});

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("File missing");
	});

	it("streams the file with download headers when the object exists", async () => {
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(new TextEncoder().encode("hello"));
				controller.close();
			},
		});
		s3Mock.send.mockResolvedValueOnce({ Body: stream });

		const response = await GET(new Request("http://localhost"), {
			params: Promise.resolve({ id: "att-1" }),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Length")).toBe("123");
		expect(response.headers.get("Content-Disposition")).toBe(
			'attachment; filename="resume.pdf"',
		);
		expect(await response.text()).toBe("hello");
	});
});
