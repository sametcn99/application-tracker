"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { deleteApplicationAction } from "@/shared/actions/applications";
import { ConfirmationDialog } from "@/shared/components/ConfirmationDialog";

export function DeleteApplicationButton({ id }: { id: string }) {
	const t = useTranslations("applications");
	const tCommon = useTranslations("common");

	return (
		<ConfirmationDialog
			title={t("deleteConfirmTitle")}
			description={t("deleteConfirmDescription")}
			confirmLabel={tCommon("delete")}
			onConfirm={() => deleteApplicationAction(id)}
			trigger={
				<Button variant="soft" color="red">
					<TrashIcon />
					{tCommon("delete")}
				</Button>
			}
		/>
	);
}
