"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
	buildDraftLabel,
	DRAFT_SCHEMA_VERSION,
	type DraftContext,
	type DraftPayload,
	MAX_DRAFTS_PER_CONTEXT,
} from "@/shared/lib/application-draft";
import { logger } from "@/shared/lib/logger";
import { prisma } from "@/shared/lib/prisma";

type ActionResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: "unauthorized" | "not_found" | "server_error" };

export type DraftSummary = {
	id: string;
	mode: "CREATE" | "EDIT";
	applicationId: string | null;
	label: string;
	updatedAt: string;
	createdAt: string;
	baseApplicationUpdatedAt: string | null;
	stale: boolean;
	payload: DraftPayload;
};

async function requireUserId(): Promise<string | null> {
	const session = await auth();
	const id = session?.user?.id;
	return id ?? null;
}

function whereForContext(userId: string, ctx: DraftContext) {
	return ctx.mode === "CREATE"
		? { userId, mode: "CREATE", applicationId: null }
		: { userId, mode: "EDIT", applicationId: ctx.applicationId };
}

export async function listApplicationDraftsAction(
	ctx: DraftContext,
): Promise<ActionResult<DraftSummary[]>> {
	const userId = await requireUserId();
	if (!userId) return { ok: false, error: "unauthorized" };

	try {
		const [drafts, baseApp] = await Promise.all([
			prisma.applicationDraft.findMany({
				where: whereForContext(userId, ctx),
				orderBy: { updatedAt: "desc" },
				take: MAX_DRAFTS_PER_CONTEXT * 2,
			}),
			ctx.mode === "EDIT"
				? prisma.application.findUnique({
						where: { id: ctx.applicationId },
						select: { updatedAt: true },
					})
				: Promise.resolve(null),
		]);

		const baseUpdatedAt = baseApp?.updatedAt ?? null;

		return {
			ok: true,
			data: drafts.map((d) => ({
				id: d.id,
				mode: d.mode as "CREATE" | "EDIT",
				applicationId: d.applicationId,
				label: d.label ?? buildDraftLabel(d.payload as DraftPayload),
				updatedAt: d.updatedAt.toISOString(),
				createdAt: d.createdAt.toISOString(),
				baseApplicationUpdatedAt:
					d.baseApplicationUpdatedAt?.toISOString() ?? null,
				stale:
					ctx.mode === "EDIT" &&
					baseUpdatedAt != null &&
					d.baseApplicationUpdatedAt != null &&
					d.baseApplicationUpdatedAt.getTime() < baseUpdatedAt.getTime(),
				payload: d.payload as DraftPayload,
			})),
		};
	} catch {
		logger.error("list_application_drafts_failed");
		return { ok: false, error: "server_error" };
	}
}

export async function saveApplicationDraftAction(
	ctx: DraftContext,
	payload: DraftPayload,
	options?: { draftId?: string; label?: string },
): Promise<ActionResult<DraftSummary>> {
	const userId = await requireUserId();
	if (!userId) return { ok: false, error: "unauthorized" };

	try {
		let baseUpdatedAt: Date | null = null;
		if (ctx.mode === "EDIT") {
			const app = await prisma.application.findUnique({
				where: { id: ctx.applicationId },
				select: { updatedAt: true },
			});
			if (!app) return { ok: false, error: "not_found" };
			baseUpdatedAt = app.updatedAt;
		}

		const label = options?.label?.trim() || buildDraftLabel(payload);

		let saved;
		if (options?.draftId) {
			const existing = await prisma.applicationDraft.findFirst({
				where: { id: options.draftId, userId },
				select: { id: true },
			});
			if (!existing) return { ok: false, error: "not_found" };
			saved = await prisma.applicationDraft.update({
				where: { id: options.draftId },
				data: {
					payload: payload as object,
					label,
					schemaVersion: DRAFT_SCHEMA_VERSION,
					baseApplicationUpdatedAt: baseUpdatedAt,
				},
			});
		} else {
			saved = await prisma.applicationDraft.create({
				data: {
					userId,
					mode: ctx.mode,
					applicationId: ctx.mode === "EDIT" ? ctx.applicationId : null,
					payload: payload as object,
					label,
					schemaVersion: DRAFT_SCHEMA_VERSION,
					baseApplicationUpdatedAt: baseUpdatedAt,
				},
			});

			// Enforce per-context cap by deleting oldest extras.
			const all = await prisma.applicationDraft.findMany({
				where: whereForContext(userId, ctx),
				orderBy: { updatedAt: "desc" },
				select: { id: true },
			});
			if (all.length > MAX_DRAFTS_PER_CONTEXT) {
				const toDelete = all.slice(MAX_DRAFTS_PER_CONTEXT).map((d) => d.id);
				await prisma.applicationDraft.deleteMany({
					where: { id: { in: toDelete }, userId },
				});
			}
		}

		revalidatePath("/applications/new");
		if (ctx.mode === "EDIT") {
			revalidatePath(`/applications/${ctx.applicationId}/edit`);
		}

		return {
			ok: true,
			data: {
				id: saved.id,
				mode: saved.mode as "CREATE" | "EDIT",
				applicationId: saved.applicationId,
				label: saved.label ?? label,
				updatedAt: saved.updatedAt.toISOString(),
				createdAt: saved.createdAt.toISOString(),
				baseApplicationUpdatedAt:
					saved.baseApplicationUpdatedAt?.toISOString() ?? null,
				stale: false,
				payload: saved.payload as DraftPayload,
			},
		};
	} catch {
		logger.error("save_application_draft_failed");
		return { ok: false, error: "server_error" };
	}
}

export async function deleteApplicationDraftAction(
	draftId: string,
): Promise<ActionResult<{ id: string }>> {
	const userId = await requireUserId();
	if (!userId) return { ok: false, error: "unauthorized" };

	try {
		const existing = await prisma.applicationDraft.findFirst({
			where: { id: draftId, userId },
			select: { id: true, mode: true, applicationId: true },
		});
		if (!existing) return { ok: false, error: "not_found" };

		await prisma.applicationDraft.delete({ where: { id: draftId } });
		revalidatePath("/applications/new");
		if (existing.applicationId) {
			revalidatePath(`/applications/${existing.applicationId}/edit`);
		}
		return { ok: true, data: { id: draftId } };
	} catch {
		logger.error("delete_application_draft_failed", { draftId });
		return { ok: false, error: "server_error" };
	}
}

export async function deleteAllApplicationDraftsAction(
	ctx: DraftContext,
): Promise<ActionResult<{ count: number }>> {
	const userId = await requireUserId();
	if (!userId) return { ok: false, error: "unauthorized" };

	try {
		const result = await prisma.applicationDraft.deleteMany({
			where: whereForContext(userId, ctx),
		});
		revalidatePath("/applications/new");
		if (ctx.mode === "EDIT") {
			revalidatePath(`/applications/${ctx.applicationId}/edit`);
		}
		return { ok: true, data: { count: result.count } };
	} catch {
		logger.error("delete_all_application_drafts_failed");
		return { ok: false, error: "server_error" };
	}
}
