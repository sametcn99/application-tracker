import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
	sourceOption: { upsert: vi.fn(), delete: vi.fn() },
}));
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/prisma", () => ({ prisma }));
vi.mock("next/cache", () => cache);

import {
	createSourceAction,
	deleteSourceAction,
} from "@/app/(app)/sources/actions/sources";

function fd(name?: string) {
	const f = new FormData();
	if (name !== undefined) f.set("name", name);
	return f;
}

describe("sources actions", () => {
	beforeEach(() => vi.clearAllMocks());

	it("rejects empty name", async () => {
		const res = await createSourceAction(fd(""));
		expect(res.ok).toBe(false);
		expect((res as { error: string }).error).toBe("validation.required");
	});

	it("rejects missing name", async () => {
		const res = await createSourceAction(fd());
		expect(res.ok).toBe(false);
	});

	it("trims and upserts on success", async () => {
		prisma.sourceOption.upsert.mockResolvedValueOnce({
			id: "1",
			name: "LinkedIn",
		});
		const res = await createSourceAction(fd("  LinkedIn "));
		expect(res).toEqual({ ok: true, data: { id: "1", name: "LinkedIn" } });
		expect(prisma.sourceOption.upsert).toHaveBeenCalledWith({
			where: { name: "LinkedIn" },
			update: {},
			create: { name: "LinkedIn" },
			select: { id: true, name: true },
		});
		expect(cache.revalidatePath).toHaveBeenCalledWith("/sources");
		expect(cache.revalidatePath).toHaveBeenCalledWith("/applications/new");
	});

	it("rejects names exceeding 100 characters", async () => {
		const res = await createSourceAction(fd("x".repeat(101)));
		expect(res.ok).toBe(false);
		expect((res as { error: string }).error).toBe("validation.tooLong");
	});

	it("deletes a source and revalidates", async () => {
		prisma.sourceOption.delete.mockResolvedValueOnce({});
		await deleteSourceAction("id1");
		expect(prisma.sourceOption.delete).toHaveBeenCalledWith({
			where: { id: "id1" },
		});
		expect(cache.revalidatePath).toHaveBeenCalledWith("/sources");
	});
});
