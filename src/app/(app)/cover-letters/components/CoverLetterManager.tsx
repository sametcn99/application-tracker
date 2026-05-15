"use client";

import {
	ChevronDownIcon,
	ChevronUpIcon,
	Pencil1Icon,
	PlusIcon,
	TrashIcon,
} from "@radix-ui/react-icons";
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
import styles from "./CoverLetterManager.module.css";

type CoverLetterItem = {
	id: string;
	title: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
};

function countWords(text: string): number {
	const trimmed = text.trim();
	if (trimmed.length === 0) return 0;
	return trimmed.split(/\s+/).length;
}

function ContentCount({ content }: { content: string }) {
	const chars = content.length;
	const words = countWords(content);
	return (
		<Text size="1" color="gray" as="span">
			{words} {words === 1 ? "word" : "words"} · {chars}{" "}
			{chars === 1 ? "char" : "chars"}
		</Text>
	);
}

function CreateForm({
	formRef,
	pending,
	error,
	onSubmit,
}: {
	formRef: React.RefObject<HTMLFormElement | null>;
	pending: boolean;
	error: string | null;
	onSubmit: (formData: FormData) => void;
}) {
	const t = useTranslations();
	const [createContent, setCreateContent] = useState("");

	return (
		<form ref={formRef} action={onSubmit}>
			<Flex direction="column" gap="3">
				<Flex direction="column" gap="1">
					<Text as="label" size="1" color="gray" weight="medium">
						{t("coverLetters.name")}
					</Text>
					<TextField.Root
						name="title"
						placeholder={t("coverLetters.namePlaceholder")}
						required
					/>
				</Flex>
				<Flex direction="column" gap="1">
					<Text as="label" size="1" color="gray" weight="medium">
						{t("coverLetters.content")}
					</Text>
					<TextArea
						name="content"
						placeholder={t("coverLetters.contentPlaceholder")}
						required
						rows={8}
						value={createContent}
						onChange={(e) => setCreateContent(e.target.value)}
					/>
					<ContentCount content={createContent} />
				</Flex>
				<Button type="submit" disabled={pending}>
					<PlusIcon />
					{t("coverLetters.addButton")}
				</Button>
				{error && (
					<Text size="1" color="red">
						{error}
					</Text>
				)}
			</Flex>
		</form>
	);
}

function EditForm({
	item,
	editTitle,
	editContent,
	pending,
	error,
	onTitleChange,
	onContentChange,
	onCancel,
	onSubmit,
}: {
	item: CoverLetterItem;
	editTitle: string;
	editContent: string;
	pending: boolean;
	error: string | null;
	onTitleChange: (value: string) => void;
	onContentChange: (value: string) => void;
	onCancel: () => void;
	onSubmit: (id: string, formData: FormData) => void;
}) {
	const t = useTranslations();
	const tCommon = useTranslations("common");

	return (
		<form action={(formData) => onSubmit(item.id, formData)}>
			<Flex direction="column" gap="3">
				<Flex direction="column" gap="1">
					<Text as="label" size="1" color="gray" weight="medium">
						{t("coverLetters.name")}
					</Text>
					<TextField.Root
						name="title"
						value={editTitle}
						onChange={(e) => onTitleChange(e.target.value)}
						required
					/>
				</Flex>
				<Flex direction="column" gap="1">
					<Text as="label" size="1" color="gray" weight="medium">
						{t("coverLetters.content")}
					</Text>
					<TextArea
						name="content"
						value={editContent}
						onChange={(e) => onContentChange(e.target.value)}
						required
						rows={8}
					/>
					<ContentCount content={editContent} />
				</Flex>
				<Flex gap="2" justify="end">
					<Button
						variant="soft"
						color="gray"
						onClick={onCancel}
						disabled={pending}
						type="button"
					>
						{tCommon("cancel")}
					</Button>
					<Button type="submit" disabled={pending}>
						{t("coverLetters.editButton")}
					</Button>
				</Flex>
				{error && (
					<Text size="1" color="red">
						{error}
					</Text>
				)}
			</Flex>
		</form>
	);
}

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
	const [formCollapsed, setFormCollapsed] = useState(true);

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
		<div className={styles.layout}>
			<div className={styles.formPanel}>
				<div
					className={styles.collapseHeader}
					onClick={() => setFormCollapsed((v) => !v)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							setFormCollapsed((v) => !v);
						}
					}}
					role="button"
					tabIndex={0}
				>
					<Text weight="medium" size="2">
						{t("coverLetters.addButton")}
					</Text>
					{formCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
				</div>
				<div
					className={`${styles.formBody} ${formCollapsed ? styles.formBodyCollapsed : ""}`}
				>
					<Card>
						<CreateForm
							formRef={formRef}
							pending={pending}
							error={editingId ? null : error}
							onSubmit={handleCreate}
						/>
					</Card>
				</div>
			</div>

			<div className={styles.listPanel}>
				{items.length === 0 ? (
					<Text color="gray">{t("coverLetters.emptyState")}</Text>
				) : (
					<Flex direction="column" gap="2">
						{items.map((item) => (
							<Card key={item.id}>
								{editingId === item.id ? (
									<EditForm
										item={item}
										editTitle={editTitle}
										editContent={editContent}
										pending={pending}
										error={editingId === item.id ? error : null}
										onTitleChange={setEditTitle}
										onContentChange={setEditContent}
										onCancel={cancelEdit}
										onSubmit={handleUpdate}
									/>
								) : (
									<Flex align="start" justify="between" gap="3" wrap="wrap">
										<Flex
											direction="column"
											gap="1"
											style={{ flex: 1, minWidth: 0 }}
										>
											<Text weight="medium">{item.title}</Text>
											<Text
												size="2"
												color="gray"
												style={{ whiteSpace: "pre-wrap" }}
											>
												{item.content.slice(0, 150)}
												{item.content.length > 150 ? "…" : ""}
											</Text>
											<Flex gap="2" align="center" wrap="wrap">
												<ContentCount content={item.content} />
												<Text size="1" color="gray">
													· {t("coverLetters.createdAt")}:{" "}
													{formatDate(item.createdAt)}
												</Text>
											</Flex>
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
			</div>
		</div>
	);
}
