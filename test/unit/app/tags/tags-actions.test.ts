import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
	tag: { create: vi.fn(), delete: vi.fn() },
}));
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/prisma", () => ({ prisma }));
vi.mock("next/cache", () => cache);

import {
	createTagAction,
	deleteTagAction,
} from "@/app/(app)/tags/actions/tags";

function fd(values: Record<string, string>) {
	const f = new FormData();
	for (const [k, v] of Object.entries(values)) f.set(k, v);
	return f;
}

describe("tags actions", () => {
	beforeEach(() => vi.clearAllMocks());

	it("rejects empty name", async () => {
		const res = await createTagAction(fd({ name: "  " }));
		expect(res).toEqual({ ok: false, error: "validation.required" });
		expect(prisma.tag.create).not.toHaveBeenCalled();
	});

	it("creates a tag with default color when omitted", async () => {
		prisma.tag.create.mockResolvedValueOnce({ id: "1" });
		const res = await createTagAction(fd({ name: "react" }));
		expect(res).toEqual({ ok: true });
		expect(prisma.tag.create).toHaveBeenCalledWith({
			data: { name: "react", color: "gray" },
		});
		expect(cache.revalidatePath).toHaveBeenCalledWith("/tags");
	});

	it("creates a tag with provided color", async () => {
		prisma.tag.create.mockResolvedValueOnce({ id: "2" });
		await createTagAction(fd({ name: "ts", color: "blue" }));
		expect(prisma.tag.create).toHaveBeenCalledWith({
			data: { name: "ts", color: "blue" },
		});
	});

	it("deletes a tag and revalidates both paths", async () => {
		prisma.tag.delete.mockResolvedValueOnce({});
		await deleteTagAction("abc");
		expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: "abc" } });
		expect(cache.revalidatePath).toHaveBeenCalledWith("/tags");
		expect(cache.revalidatePath).toHaveBeenCalledWith("/applications");
	});
});
