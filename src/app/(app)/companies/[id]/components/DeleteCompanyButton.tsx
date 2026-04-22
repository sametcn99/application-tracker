"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { deleteCompanyAction } from "../../actions/companies";

export function DeleteCompanyButton({
	id,
	name,
}: {
	id: string;
	name: string;
}) {
	const t = useTranslations("companies");
	const [pending, startTransition] = useTransition();

	return (
		<Button
			color="red"
			variant="soft"
			disabled={pending}
			onClick={() => {
				if (!confirm(t("deleteConfirm", { name }))) return;
				startTransition(async () => {
					await deleteCompanyAction(id);
				});
			}}
		>
			<TrashIcon />
			{t("deleteButton")}
		</Button>
	);
}
