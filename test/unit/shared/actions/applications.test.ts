import { beforeEach, describe, expect, it, vi } from "vitest";

const lib = vi.hoisted(() => ({
	listApplications: vi.fn(),
	listApplicationsPage: vi.fn(),
	createApplication: vi.fn(),
	updateApplication: vi.fn(),
	updateStatus: vi.fn(),
	addComment: vi.fn(),
	deleteApplication: vi.fn(),
}));
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
const nav = vi.hoisted(() => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`REDIRECT:${url}`);
	}),
}));

vi.mock("@/shared/lib/applications", () => lib);
vi.mock("next/cache", () => cache);
vi.mock("next/navigation", () => nav);

import {
	addCommentAction,
	createApplicationAction,
	deleteApplicationAction,
	fetchApplicationsAction,
	updateApplicationAction,
	updateStatusAction,
} from "@/shared/actions/applications";

const validInput = {
	company: "Acme",
	position: "SWE",
	workMode: "REMOTE",
	employmentType: "FULL_TIME",
	priority: "MEDIUM",
	status: "APPLIED",
};

describe("applications server actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("forwards filters and cursor to listApplicationsPage", async () => {
		lib.listApplicationsPage.mockResolvedValueOnce({
			items: [{ id: "x" }],
			nextCursor: null,
			hasMore: false,
		});
		const out = await fetchApplicationsAction(
			{ q: "test" } as never,
			"cursor-1",
		);
		expect(lib.listApplicationsPage).toHaveBeenCalledWith(
			{ q: "test" },
			"cursor-1",
		);
		expect(out).toEqual({
			items: [{ id: "x" }],
			nextCursor: null,
			hasMore: false,
		});
	});

	describe("createApplicationAction", () => {
		it("returns invalid_data on schema failure", async () => {
			const res = await createApplicationAction({
				...validInput,
				position: "",
				company: "",
			} as never);
			expect(res.ok).toBe(false);
			expect((res as { error: string }).error).toBe("invalid_data");
			expect(lib.createApplication).not.toHaveBeenCalled();
		});

		it("creates and revalidates on success", async () => {
			lib.createApplication.mockResolvedValueOnce({ id: "abc" });
			const res = await createApplicationAction(validInput as never);
			expect(res).toEqual({ ok: true, id: "abc" });
			expect(cache.revalidatePath).toHaveBeenCalledWith("/applications");
		});

		it("returns server_error if lib throws", async () => {
			lib.createApplication.mockRejectedValueOnce(new Error("boom"));
			const spy = vi.spyOn(console, "error").mockImplementation(() => {});
			const res = await createApplicationAction(validInput as never);
			expect(res).toEqual({ ok: false, error: "server_error" });
			spy.mockRestore();
		});
	});

	describe("updateApplicationAction", () => {
		it("returns invalid_data on schema failure", async () => {
			const res = await updateApplicationAction("abc", {
				...validInput,
				company: "",
			} as never);
			expect(res.ok).toBe(false);
			expect((res as { error: string }).error).toBe("invalid_data");
			expect(lib.updateApplication).not.toHaveBeenCalled();
		});

		it("revalidates detail and edit paths on success", async () => {
			lib.updateApplication.mockResolvedValueOnce(undefined);
			const res = await updateApplicationAction("abc", validInput as never);
			expect(res).toEqual({ ok: true, id: "abc" });
			expect(cache.revalidatePath).toHaveBeenCalledWith("/applications");
			expect(cache.revalidatePath).toHaveBeenCalledWith("/applications/abc");
			expect(cache.revalidatePath).toHaveBeenCalledWith(
				"/applications/abc/edit",
			);
		});

		it("returns server_error if update throws", async () => {
			lib.updateApplication.mockRejectedValueOnce(new Error("boom"));
			const spy = vi.spyOn(console, "error").mockImplementation(() => {});
			const res = await updateApplicationAction("abc", validInput as never);
			expect(res).toEqual({ ok: false, error: "server_error" });
			spy.mockRestore();
		});
	});

	it("updateStatusAction revalidates both paths", async () => {
		lib.updateStatus.mockResolvedValueOnce(undefined);
		const res = await updateStatusAction("id1", "INTERVIEW");
		expect(res).toEqual({ ok: true });
		expect(lib.updateStatus).toHaveBeenCalledWith("id1", "INTERVIEW");
	});

	it("updateStatusAction returns server_error when updateStatus throws", async () => {
		lib.updateStatus.mockRejectedValueOnce(new Error("nope"));
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const res = await updateStatusAction("id1", "INTERVIEW");
		expect(res).toEqual({ ok: false, error: "server_error" });
		spy.mockRestore();
	});

	it("addCommentAction revalidates detail and activity", async () => {
		lib.addComment.mockResolvedValueOnce(undefined);
		const res = await addCommentAction("id2", "hi");
		expect(res).toEqual({ ok: true });
		expect(cache.revalidatePath).toHaveBeenCalledWith("/applications/id2");
		expect(cache.revalidatePath).toHaveBeenCalledWith("/activity");
	});

	it("addCommentAction returns server_error when addComment throws", async () => {
		lib.addComment.mockRejectedValueOnce(new Error("nope"));
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const res = await addCommentAction("id2", "hi");
		expect(res).toEqual({ ok: false, error: "server_error" });
		spy.mockRestore();
	});

	it("deleteApplicationAction redirects to /applications on success", async () => {
		lib.deleteApplication.mockResolvedValueOnce(undefined);
		await expect(deleteApplicationAction("zzz")).rejects.toThrow(
			"REDIRECT:/applications",
		);
		expect(cache.revalidatePath).toHaveBeenCalledWith("/applications");
		expect(nav.redirect).toHaveBeenCalledWith("/applications");
	});

	it("deleteApplicationAction returns server_error if delete throws", async () => {
		lib.deleteApplication.mockRejectedValueOnce(new Error("nope"));
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const res = await deleteApplicationAction("zzz");
		expect(res).toEqual({ ok: false, error: "server_error" });
		expect(nav.redirect).not.toHaveBeenCalled();
		spy.mockRestore();
	});
});
