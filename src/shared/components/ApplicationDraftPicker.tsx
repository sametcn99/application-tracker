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
import { useState, useTransition } from "react";
import {
	type DraftSummary,
	deleteAllApplicationDraftsAction,
	deleteApplicationDraftAction,
} from "@/shared/actions/application-drafts";
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
	const [pending, startTransition] = useTransition();
	const [deleting, setDeleting] = useState<string | null>(null);

	const handleDelete = (id: string) => {
		setDeleting(id);
		startTransition(async () => {
			const res = await deleteApplicationDraftAction(id);
			setDeleting(null);
			if (res.ok) onAfterDelete(id);
		});
	};

	const handleDeleteAll = () => {
		startTransition(async () => {
			const res = await deleteAllApplicationDraftsAction(context);
			if (res.ok) onAfterDeleteAll();
		});
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
											<Button
												size="1"
												variant="soft"
												color="gray"
												onClick={onClearLocalRecovery}
											>
												{tCommon("delete")}
											</Button>
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
											<Button
												size="1"
												variant="soft"
												color="red"
												onClick={() => handleDelete(draft.id)}
												disabled={pending && deleting === draft.id}
											>
												<TrashIcon />
											</Button>
											<Button
												size="1"
												onClick={() => onPick(draft)}
												disabled={pending}
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
					<Button
						variant="soft"
						color="red"
						onClick={handleDeleteAll}
						disabled={pending || drafts.length === 0}
					>
						{t("deleteAll")}
					</Button>
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
