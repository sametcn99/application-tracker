"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { ConfirmationDialog } from "@/shared/components/ConfirmationDialog";
import { deleteCompanyAction } from "../../actions/companies";

export function DeleteCompanyButton({
	id,
	name,
}: {
	id: string;
	name: string;
}) {
	const t = useTranslations("companies");

	return (
		<ConfirmationDialog
			title={t("deleteButton")}
			description={t("deleteConfirm", { name })}
			confirmLabel={t("deleteButton")}
			onConfirm={() => deleteCompanyAction(id)}
			trigger={
				<Button color="red" variant="soft">
					<TrashIcon />
					{t("deleteButton")}
				</Button>
			}
		/>
	);
}
