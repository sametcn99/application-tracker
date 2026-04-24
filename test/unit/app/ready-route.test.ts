import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
	$queryRaw: vi.fn(),
}));
const s3send = vi.hoisted(() => vi.fn());

vi.mock("@/shared/lib/prisma", () => ({ prisma }));
vi.mock("@/shared/lib/s3", () => ({
	S3_BUCKET: "attachments",
	s3: { send: s3send },
}));
vi.mock("@aws-sdk/client-s3", () => ({
	HeadBucketCommand: class {
		constructor(public input: unknown) {}
	},
}));

import { GET } from "@/app/api/ready/route";

describe("ready route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		prisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
		s3send.mockResolvedValue({});
	});

	it("returns ready when database and storage are available", async () => {
		const response = await GET();
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({ ok: true });
	});

	it("returns unavailable when a dependency fails", async () => {
		s3send.mockRejectedValueOnce(new Error("missing bucket"));
		const response = await GET();
		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toMatchObject({
			ok: false,
			components: { database: "ok", storage: "error" },
		});
	});
});
