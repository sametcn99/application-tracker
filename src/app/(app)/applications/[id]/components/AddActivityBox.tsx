"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button, Callout, Card, Flex, Text, TextArea } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { addCommentAction } from "@/shared/actions/applications";

export function AddActivityBox({ applicationId }: { applicationId: string }) {
	const t = useTranslations("comments");
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const onSubmit = (formData: FormData) => {
		const comment = formData.get("comment")?.toString();
		if (!comment?.trim()) return;

		setError(null);
		startTransition(async () => {
			const result = await addCommentAction(applicationId, comment);
			if (result && !result.ok) {
				setError(t("errorAddingActivity") ?? "Failed to add activity");
			} else {
				const form = document.getElementById(
					"add-activity-form",
				) as HTMLFormElement;
				if (form) form.reset();
			}
		});
	};

	return (
		<Card size="2">
			<form id="add-activity-form" action={onSubmit}>
				<Flex direction="column" gap="3">
					<Text size="2" weight="medium">
						{t("addNoteTitle", {
							defaultMessage: "Add a Note (Markdown supported)",
						})}
					</Text>
					<TextArea
						name="comment"
						placeholder={t("addPlaceholder", {
							defaultMessage: "Write a note...",
						})}
						rows={3}
						disabled={pending}
						style={{
							fontFamily: "var(--font-mono, monospace)",
							fontSize: "14px",
						}}
					/>
					{error && (
						<Callout.Root color="red" size="1">
							<Callout.Icon>
								<ExclamationTriangleIcon />
							</Callout.Icon>
							<Callout.Text>{error}</Callout.Text>
						</Callout.Root>
					)}
					<Flex justify="end">
						<Button type="submit" disabled={pending} size="2">
							{pending
								? t("submitting", { defaultMessage: "Submitting..." })
								: t("addButton", { defaultMessage: "Add Note" })}
						</Button>
					</Flex>
				</Flex>
			</form>
		</Card>
	);
}
