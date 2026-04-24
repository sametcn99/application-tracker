"use client";

import { TrashIcon, UploadIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, IconButton, Table, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import {
	deleteAttachmentAction,
	uploadAttachmentAction,
} from "@/shared/actions/attachments";
import { ConfirmationDialog } from "@/shared/components/ConfirmationDialog";
import { formatRelative } from "@/shared/lib/format";

type Attachment = {
	id: string;
	fileName: string;
	size: number;
	mimeType: string;
	createdAt: Date;
};

export function AttachmentList({
	applicationId,
	attachments,
}: {
	applicationId: string;
	attachments: Attachment[];
}) {
	const t = useTranslations();
	const tCommon = useTranslations("common");
	const inputRef = useRef<HTMLInputElement>(null);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const onPick = (file: File) => {
		setError(null);
		const fd = new FormData();
		fd.append("file", file);
		startTransition(async () => {
			const r = await uploadAttachmentAction(applicationId, fd);
			if (!r.ok && r.error) {
				const e = r.error;
				try {
					setError(t(e as never));
				} catch {
					setError(e);
				}
			}
			if (inputRef.current) inputRef.current.value = "";
		});
	};

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Flex justify="between" align="center">
					<Text weight="medium">{t("attachments.title")}</Text>
					<Button disabled={pending} onClick={() => inputRef.current?.click()}>
						<UploadIcon />{" "}
						{pending ? t("attachments.uploading") : t("attachments.upload")}
					</Button>
					<input
						ref={inputRef}
						type="file"
						hidden
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) onPick(f);
						}}
					/>
				</Flex>
				{error && (
					<Text size="2" color="red">
						{error}
					</Text>
				)}

				{attachments.length === 0 ? (
					<Text color="gray" size="2">
						{t("attachments.noAttachments")}
					</Text>
				) : (
					<Table.Root variant="surface">
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeaderCell>
									{t("attachments.name")}
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell>
									{t("attachments.size")}
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell>
									{t("attachments.uploadedAt")}
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell>
									{t("common.actions")}
								</Table.ColumnHeaderCell>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{attachments.map((a) => (
								<Table.Row key={a.id}>
									<Table.Cell>
										<a
											href={"/api/attachments/" + a.id}
											target="_blank"
											rel="noreferrer"
										>
											{a.fileName}
										</a>
									</Table.Cell>
									<Table.Cell>{(a.size / 1024).toFixed(1)} KB</Table.Cell>
									<Table.Cell>{formatRelative(a.createdAt)}</Table.Cell>
									<Table.Cell>
										<ConfirmationDialog
											title={tCommon("delete")}
											description={t("attachments.deleteConfirm", {
												name: a.fileName,
											})}
											onConfirm={() => deleteAttachmentAction(a.id)}
											trigger={
												<IconButton
													variant="ghost"
													color="red"
													disabled={pending}
												>
													<TrashIcon />
												</IconButton>
											}
										/>
									</Table.Cell>
								</Table.Row>
							))}
						</Table.Body>
					</Table.Root>
				)}
			</Flex>
		</Card>
	);
}
