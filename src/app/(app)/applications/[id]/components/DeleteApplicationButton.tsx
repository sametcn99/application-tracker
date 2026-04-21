"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import { Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { deleteApplicationAction } from "@/shared/actions/applications";

export function DeleteApplicationButton({ id }: { id: string }) {
	const t = useTranslations("applications");
	const tCommon = useTranslations("common");
	const [pending, startTransition] = useTransition();

	const handleDelete = () => {
		startTransition(async () => {
			await deleteApplicationAction(id);
		});
	};

	return (
		<Dialog.Root>
			<Dialog.Trigger>
				<Button variant="soft" color="red">
					<TrashIcon />
					{tCommon("delete")}
				</Button>
			</Dialog.Trigger>

			<Dialog.Content maxWidth="450px">
				<Dialog.Title>{t("deleteConfirmTitle")}</Dialog.Title>
				<Dialog.Description size="2" mb="4">
					{t("deleteConfirmDescription")}
				</Dialog.Description>

				<Flex gap="3" mt="4" justify="end">
					<Dialog.Close>
						<Button variant="soft" color="gray">
							{tCommon("cancel")}
						</Button>
					</Dialog.Close>
					<Dialog.Close>
						<Button color="red" disabled={pending} onClick={handleDelete}>
							{pending ? tCommon("loading") : tCommon("delete")}
						</Button>
					</Dialog.Close>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}
