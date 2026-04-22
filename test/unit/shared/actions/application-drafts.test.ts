import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
	applicationDraft: {
		findMany: vi.fn(),
		findFirst: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		deleteMany: vi.fn(),
	},
	application: {
		findUnique: vi.fn(),
	},
}));
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/lib/prisma", () => ({ prisma }));
vi.mock("next/cache", () => cache);
vi.mock("@/auth", () => ({ auth: authMock }));

import {
	deleteAllApplicationDraftsAction,
	deleteApplicationDraftAction,
	listApplicationDraftsAction,
	saveApplicationDraftAction,
} from "@/shared/actions/application-drafts";

const userSession = { user: { id: "u1" } };
const ctxCreate = { mode: "CREATE" } as const;
const ctxEdit = { mode: "EDIT", applicationId: "app1" } as const;

describe("application drafts actions: auth gate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		authMock.mockResolvedValue(null);
	});

	it("rejects every action when the user is unauthenticated", async () => {
		await expect(listApplicationDraftsAction(ctxCreate)).resolves.toEqual({
			ok: false,
			error: "unauthorized",
		});
		await expect(
			saveApplicationDraftAction(ctxCreate, { company: "Acme" }),
		).resolves.toEqual({ ok: false, error: "unauthorized" });
		await expect(deleteApplicationDraftAction("d1")).resolves.toEqual({
			ok: false,
			error: "unauthorized",
		});
		await expect(deleteAllApplicationDraftsAction(ctxCreate)).resolves.toEqual({
			ok: false,
			error: "unauthorized",
		});
	});
});

describe("listApplicationDraftsAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		authMock.mockResolvedValue(userSession);
	});

	it("returns drafts and marks staleness against base updatedAt", async () => {
		const baseUpdated = new Date("2024-02-01");
		const draftBase = new Date("2024-01-01");
		prisma.applicationDraft.findMany.mockResolvedValueOnce([
			{
				id: "d1",
				mode: "EDIT",
				applicationId: "app1",
				label: "Custom",
				payload: { company: "Acme" },
				updatedAt: new Date("2024-02-15"),
				createdAt: new Date("2024-01-15"),
				baseApplicationUpdatedAt: draftBase,
			},
		]);
		prisma.application.findUnique.mockResolvedValueOnce({
			updatedAt: baseUpdated,
		});
		const res = await listApplicationDraftsAction(ctxEdit);
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.data[0].stale).toBe(true);
			expect(res.data[0].label).toBe("Custom");
		}
	});

	it("returns server_error when prisma throws", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		prisma.applicationDraft.findMany.mockRejectedValueOnce(new Error("boom"));
		const res = await listApplicationDraftsAction(ctxCreate);
		expect(res).toEqual({ ok: false, error: "server_error" });
		spy.mockRestore();
	});
});

describe("saveApplicationDraftAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		authMock.mockResolvedValue(userSession);
	});

	it("returns not_found when editing a missing application", async () => {
		prisma.application.findUnique.mockResolvedValueOnce(null);
		const res = await saveApplicationDraftAction(ctxEdit, { company: "Acme" });
		expect(res).toEqual({ ok: false, error: "not_found" });
	});

	it("creates a new draft and revalidates the new-application path", async () => {
		const created = {
			id: "d1",
			mode: "CREATE",
			applicationId: null,
			label: "Acme",
			payload: { company: "Acme" },
			updatedAt: new Date("2024-03-01"),
			createdAt: new Date("2024-03-01"),
			baseApplicationUpdatedAt: null,
		};
		prisma.applicationDraft.create.mockResolvedValueOnce(created);
		prisma.applicationDraft.findMany.mockResolvedValueOnce([{ id: "d1" }]);
		const res = await saveApplicationDraftAction(ctxCreate, {
			company: "Acme",
		});
		expect(res.ok).toBe(true);
		expect(prisma.applicationDraft.deleteMany).not.toHaveBeenCalled();
		expect(cache.revalidatePath).toHaveBeenCalledWith("/applications/new");
	});

	it("trims excess drafts beyond the per-context cap", async () => {
		const created = {
			id: "new",
			mode: "CREATE",
			applicationId: null,
			label: "x",
			payload: {},
			updatedAt: new Date(),
			createdAt: new Date(),
			baseApplicationUpdatedAt: null,
		};
		prisma.applicationDraft.create.mockResolvedValueOnce(created);
		// Pretend we exceed the cap by returning many ids.
		const many = Array.from({ length: 60 }, (_, i) => ({ id: `d${i}` }));
		prisma.applicationDraft.findMany.mockResolvedValueOnce(many);
		await saveApplicationDraftAction(ctxCreate, { company: "X" });
		expect(prisma.applicationDraft.deleteMany).toHaveBeenCalled();
	});

	it("updates an existing draft when draftId is supplied", async () => {
		prisma.applicationDraft.findFirst.mockResolvedValueOnce({ id: "d1" });
		prisma.applicationDraft.update.mockResolvedValueOnce({
			id: "d1",
			mode: "CREATE",
			applicationId: null,
			label: "Hello",
			payload: { company: "Acme" },
			updatedAt: new Date(),
			createdAt: new Date(),
			baseApplicationUpdatedAt: null,
		});
		const res = await saveApplicationDraftAction(
			ctxCreate,
			{ company: "Acme" },
			{ draftId: "d1", label: "Hello" },
		);
		expect(res.ok).toBe(true);
		expect(prisma.applicationDraft.update).toHaveBeenCalled();
	});

	it("returns not_found when updating a draft that does not belong to user", async () => {
		prisma.applicationDraft.findFirst.mockResolvedValueOnce(null);
		const res = await saveApplicationDraftAction(
			ctxCreate,
			{ company: "Acme" },
			{ draftId: "missing" },
		);
		expect(res).toEqual({ ok: false, error: "not_found" });
	});
});

describe("deleteApplicationDraftAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		authMock.mockResolvedValue(userSession);
	});

	it("returns not_found when missing", async () => {
		prisma.applicationDraft.findFirst.mockResolvedValueOnce(null);
		const res = await deleteApplicationDraftAction("missing");
		expect(res).toEqual({ ok: false, error: "not_found" });
	});

	it("deletes the draft and revalidates edit path when applicable", async () => {
		prisma.applicationDraft.findFirst.mockResolvedValueOnce({
			id: "d1",
			mode: "EDIT",
			applicationId: "app1",
		});
		const res = await deleteApplicationDraftAction("d1");
		expect(res).toEqual({ ok: true, data: { id: "d1" } });
		expect(cache.revalidatePath).toHaveBeenCalledWith("/applications/new");
		expect(cache.revalidatePath).toHaveBeenCalledWith(
			"/applications/app1/edit",
		);
	});

	it("returns server_error when delete throws", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		prisma.applicationDraft.findFirst.mockResolvedValueOnce({
			id: "d1",
			mode: "CREATE",
			applicationId: null,
		});
		prisma.applicationDraft.delete.mockRejectedValueOnce(new Error("boom"));
		const res = await deleteApplicationDraftAction("d1");
		expect(res).toEqual({ ok: false, error: "server_error" });
		spy.mockRestore();
	});
});

describe("deleteAllApplicationDraftsAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		authMock.mockResolvedValue(userSession);
	});

	it("returns deleted count and revalidates", async () => {
		prisma.applicationDraft.deleteMany.mockResolvedValueOnce({ count: 3 });
		const res = await deleteAllApplicationDraftsAction(ctxEdit);
		expect(res).toEqual({ ok: true, data: { count: 3 } });
		expect(cache.revalidatePath).toHaveBeenCalledWith(
			"/applications/app1/edit",
		);
	});

	it("returns server_error when bulk delete throws", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		prisma.applicationDraft.deleteMany.mockRejectedValueOnce(new Error("boom"));
		const res = await deleteAllApplicationDraftsAction(ctxCreate);
		expect(res).toEqual({ ok: false, error: "server_error" });
		spy.mockRestore();
	});
});
