"use client";

import { Button, Flex } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmationDialog } from "./ConfirmationDialog";

type Props = {
	open: boolean;
	onStay: () => void;
	onDiscard: () => Promise<void> | void;
	onSaveDraft: () => Promise<void> | void;
};

export function UnsavedChangesDialog({
	open,
	onStay,
	onDiscard,
	onSaveDraft,
}: Props) {
	const t = useTranslations("unsavedChanges");
	const tCommon = useTranslations("common");
	const [savingDraft, setSavingDraft] = useState(false);
	const [discarding, setDiscarding] = useState(false);

	const handleSave = async () => {
		setSavingDraft(true);
		try {
			await onSaveDraft();
		} finally {
			setSavingDraft(false);
		}
	};

	const handleDiscard = async () => {
		setDiscarding(true);
		try {
			await onDiscard();
		} finally {
			setDiscarding(false);
		}
	};

	return (
		<ConfirmationDialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) onStay();
			}}
			tone="warning"
			title={t("title")}
			description={t("description")}
			maxWidth="480px"
			footer={
				<Flex gap="3" mt="4" justify="end" wrap="wrap">
					<Button
						variant="soft"
						color="gray"
						onClick={onStay}
						disabled={savingDraft || discarding}
					>
						{t("stay")}
					</Button>
					<Button
						variant="soft"
						color="red"
						onClick={handleDiscard}
						disabled={savingDraft || discarding}
					>
						{discarding ? tCommon("loading") : t("discard")}
					</Button>
					<Button
						color="green"
						onClick={handleSave}
						disabled={savingDraft || discarding}
					>
						{savingDraft ? tCommon("loading") : t("saveDraft")}
					</Button>
				</Flex>
			}
		/>
	);
}
