"use client";

import { Pencil1Icon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import {
	Button,
	Card,
	Flex,
	IconButton,
	Text,
	TextArea,
	TextField,
} from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { ConfirmationDialog } from "@/shared/components/ConfirmationDialog";
import { formatDate } from "@/shared/lib/format";
import {
	createCoverLetterAction,
	deleteCoverLetterAction,
	updateCoverLetterAction,
} from "../actions/cover-letters";

type CoverLetterItem = {
	id: string;
	title: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
};

export function CoverLetterManager({
	coverLetters,
}: {
	coverLetters: CoverLetterItem[];
}) {
	const t = useTranslations();
	const tCommon = useTranslations("common");
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [items, setItems] = useState<CoverLetterItem[]>(coverLetters);
	const [error, setError] = useState<string | null>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editTitle, setEditTitle] = useState("");
	const [editContent, setEditContent] = useState("");

	useEffect(() => {
		setItems(coverLetters);
	}, [coverLetters]);

	const startEdit = (item: CoverLetterItem) => {
		setEditingId(item.id);
		setEditTitle(item.title);
		setEditContent(item.content);
		setError(null);
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditTitle("");
		setEditContent("");
		setError(null);
	};

	const handleCreate = (formData: FormData) => {
		setError(null);
		startTransition(async () => {
			const result = await createCoverLetterAction(formData);
			if (!result.ok) {
				try {
					setError(t(result.error as never));
				} catch {
					setError(result.error);
				}
				return;
			}
			formRef.current?.reset();
			setItems((current) => {
				if (current.some((item) => item.id === result.data.id)) {
					return current;
				}
				return [
					{
						id: result.data.id,
						title: result.data.title,
						content: result.data.content,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
					...current,
				];
			});
			router.refresh();
		});
	};

	const handleUpdate = (id: string, formData: FormData) => {
		setError(null);
		startTransition(async () => {
			const result = await updateCoverLetterAction(id, formData);
			if (!result.ok) {
				try {
					setError(t(result.error as never));
				} catch {
					setError(result.error);
				}
				return;
			}
			setItems((current) =>
				current.map((item) =>
					item.id === id
						? {
								...item,
								title: result.data.title,
								content: result.data.content,
								updatedAt: new Date(),
							}
						: item,
				),
			);
			setEditingId(null);
			setEditTitle("");
			setEditContent("");
			router.refresh();
		});
	};

	const handleDelete = async (id: string) => {
		setError(null);
		await deleteCoverLetterAction(id);
		setItems((current) => current.filter((item) => item.id !== id));
		router.refresh();
	};

	return (
		<Flex direction="column" gap="4">
			<Card>
				<form ref={formRef} action={handleCreate}>
					<Flex direction="column" gap="2">
						<Flex gap="2" align="end" wrap="wrap">
							<Flex
								direction="column"
								gap="1"
								style={{ flex: 1, minWidth: 240 }}
							>
								<Text size="1" color="gray">
									{t("coverLetters.name")}
								</Text>
								<TextField.Root
									name="title"
									placeholder={t("coverLetters.namePlaceholder")}
									required
								/>
							</Flex>
							<Flex
								direction="column"
								gap="1"
								style={{ flex: 2, minWidth: 240 }}
							>
								<Text size="1" color="gray">
									{t("coverLetters.content")}
								</Text>
								<TextArea
									name="content"
									placeholder={t("coverLetters.contentPlaceholder")}
									required
									rows={3}
								/>
							</Flex>
							<Button type="submit" disabled={pending}>
								<PlusIcon />
								{t("coverLetters.addButton")}
							</Button>
						</Flex>
						{error && !editingId && (
							<Text size="1" color="red">
								{error}
							</Text>
						)}
					</Flex>
				</form>
			</Card>

			{items.length === 0 ? (
				<Text color="gray">{t("coverLetters.emptyState")}</Text>
			) : (
				<Flex direction="column" gap="2">
					{items.map((item) => (
						<Card key={item.id}>
							{editingId === item.id ? (
								<form action={(formData) => handleUpdate(item.id, formData)}>
									<Flex direction="column" gap="2">
										<Flex gap="2" align="end" wrap="wrap">
											<Flex
												direction="column"
												gap="1"
												style={{ flex: 1, minWidth: 240 }}
											>
												<Text size="1" color="gray">
													{t("coverLetters.name")}
												</Text>
												<TextField.Root
													name="title"
													value={editTitle}
													onChange={(e) => setEditTitle(e.target.value)}
													required
												/>
											</Flex>
										</Flex>
										<Flex direction="column" gap="1">
											<Text size="1" color="gray">
												{t("coverLetters.content")}
											</Text>
											<TextArea
												name="content"
												value={editContent}
												onChange={(e) => setEditContent(e.target.value)}
												required
												rows={6}
											/>
										</Flex>
										<Flex gap="2" justify="end">
											<Button
												variant="soft"
												color="gray"
												onClick={cancelEdit}
												disabled={pending}
												type="button"
											>
												{tCommon("cancel")}
											</Button>
											<Button type="submit" disabled={pending}>
												{t("coverLetters.editButton")}
											</Button>
										</Flex>
										{error && editingId === item.id && (
											<Text size="1" color="red">
												{error}
											</Text>
										)}
									</Flex>
								</form>
							) : (
								<Flex align="start" justify="between" gap="3" wrap="wrap">
									<Flex
										direction="column"
										gap="1"
										style={{ flex: 1, minWidth: 0 }}
									>
										<Text weight="medium">{item.title}</Text>
										<Text size="1" color="gray">
											{item.content.slice(0, 100)}
											{item.content.length > 100 ? "…" : ""}
										</Text>
										<Text size="1" color="gray">
											{t("coverLetters.createdAt")}:{" "}
											{formatDate(item.createdAt)}
										</Text>
									</Flex>
									<Flex gap="2">
										<IconButton
											size="1"
											variant="soft"
											onClick={() => startEdit(item)}
											disabled={pending}
										>
											<Pencil1Icon />
										</IconButton>
										<ConfirmationDialog
											title={tCommon("delete")}
											description={t("coverLetters.deleteConfirm")}
											onConfirm={() => handleDelete(item.id)}
											trigger={
												<IconButton
													size="1"
													variant="soft"
													color="red"
													disabled={pending}
												>
													<TrashIcon />
												</IconButton>
											}
										/>
									</Flex>
								</Flex>
							)}
						</Card>
					))}
				</Flex>
			)}
		</Flex>
	);
}
