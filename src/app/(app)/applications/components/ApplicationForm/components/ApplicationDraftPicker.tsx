"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import {
	Badge,
	Box,
	Button,
	Card,
	Dialog,
	Flex,
	ScrollArea,
	Separator,
	Text,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
	type DraftSummary,
	deleteAllApplicationDraftsAction,
	deleteApplicationDraftAction,
} from "@/shared/actions/application-drafts";
import { ConfirmationDialog } from "@/shared/components/ConfirmationDialog";
import type {
	DraftContext,
	LocalRecoverySnapshot,
} from "@/shared/lib/application-draft";
import { formatRelative } from "@/shared/lib/format";

type Props = {
	open: boolean;
	context: DraftContext;
	drafts: DraftSummary[];
	localRecovery: LocalRecoverySnapshot | null;
	onClose: () => void;
	onPick: (draft: DraftSummary) => void;
	onPickLocalRecovery: (snapshot: LocalRecoverySnapshot) => void;
	onAfterDelete: (draftId: string) => void;
	onAfterDeleteAll: () => void;
	onClearLocalRecovery: () => void;
};

export function ApplicationDraftPicker({
	open,
	context,
	drafts,
	localRecovery,
	onClose,
	onPick,
	onPickLocalRecovery,
	onAfterDelete,
	onAfterDeleteAll,
	onClearLocalRecovery,
}: Props) {
	const t = useTranslations("applicationDrafts");
	const tCommon = useTranslations("common");
	const [deleting, setDeleting] = useState<string | null>(null);
	const [deletingAll, setDeletingAll] = useState(false);

	const handleDelete = async (id: string) => {
		setDeleting(id);
		try {
			const res = await deleteApplicationDraftAction(id);
			if (res.ok) onAfterDelete(id);
		} finally {
			setDeleting(null);
		}
	};

	const handleDeleteAll = async () => {
		setDeletingAll(true);
		try {
			const res = await deleteAllApplicationDraftsAction(context);
			if (res.ok) onAfterDeleteAll();
		} finally {
			setDeletingAll(false);
		}
	};

	const empty = drafts.length === 0 && !localRecovery;

	return (
		<Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
			<Dialog.Content maxWidth="640px">
				<Dialog.Title>{t("title")}</Dialog.Title>
				<Dialog.Description size="2" mb="3">
					{context.mode === "EDIT"
						? t("descriptionEdit")
						: t("descriptionCreate")}
				</Dialog.Description>

				{empty ? (
					<Text size="2" color="gray">
						{t("empty")}
					</Text>
				) : (
					<ScrollArea style={{ maxHeight: 420 }}>
						<Flex direction="column" gap="2">
							{localRecovery ? (
								<Card>
									<Flex align="center" justify="between" gap="3">
										<Box style={{ minWidth: 0 }}>
											<Flex align="center" gap="2">
												<Badge color="amber">{t("recoveryBadge")}</Badge>
												<Text size="2" weight="medium">
													{t("recoveryLabel")}
												</Text>
											</Flex>
											<Text size="1" color="gray">
												{formatRelative(localRecovery.updatedAt)}
											</Text>
										</Box>
										<Flex gap="2">
											<ConfirmationDialog
												title={t("clearRecoveryConfirmTitle")}
												description={t("clearRecoveryConfirmDescription")}
												confirmLabel={tCommon("delete")}
												onConfirm={onClearLocalRecovery}
												trigger={
													<Button size="1" variant="soft" color="gray">
														{tCommon("delete")}
													</Button>
												}
											/>
											<Button
												size="1"
												onClick={() => onPickLocalRecovery(localRecovery)}
											>
												{t("recover")}
											</Button>
										</Flex>
									</Flex>
								</Card>
							) : null}

							{drafts.map((draft) => (
								<Card key={draft.id}>
									<Flex align="center" justify="between" gap="3">
										<Box style={{ minWidth: 0, flex: 1 }}>
											<Flex align="center" gap="2" wrap="wrap">
												<Text size="2" weight="medium" truncate>
													{draft.label}
												</Text>
												{draft.stale ? (
													<Badge color="orange">{t("staleBadge")}</Badge>
												) : null}
											</Flex>
											<Text size="1" color="gray">
												{formatRelative(draft.updatedAt)}
											</Text>
										</Box>
										<Flex gap="2">
											<ConfirmationDialog
												title={t("deleteConfirmTitle")}
												description={t("deleteConfirmDescription", {
													name: draft.label,
												})}
												onConfirm={() => handleDelete(draft.id)}
												trigger={
													<Button
														size="1"
														variant="soft"
														color="red"
														disabled={deleting === draft.id || deletingAll}
													>
														<TrashIcon />
													</Button>
												}
											/>
											<Button
												size="1"
												onClick={() => onPick(draft)}
												disabled={deleting !== null || deletingAll}
											>
												{t("use")}
											</Button>
										</Flex>
									</Flex>
								</Card>
							))}
						</Flex>
					</ScrollArea>
				)}

				<Separator size="4" my="3" />

				<Flex justify="between" align="center" gap="3" wrap="wrap">
					<ConfirmationDialog
						title={t("deleteAllConfirmTitle")}
						description={t("deleteAllConfirmDescription")}
						confirmLabel={t("deleteAll")}
						confirmDisabled={drafts.length === 0}
						onConfirm={handleDeleteAll}
						trigger={
							<Button
								variant="soft"
								color="red"
								disabled={deletingAll || drafts.length === 0}
							>
								{t("deleteAll")}
							</Button>
						}
					/>
					<Flex gap="2">
						<Dialog.Close>
							<Button variant="soft" color="gray" onClick={onClose}>
								{t("startBlank")}
							</Button>
						</Dialog.Close>
					</Flex>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}
