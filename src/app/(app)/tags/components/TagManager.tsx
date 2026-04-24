"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import {
	Badge,
	Button,
	Card,
	Flex,
	IconButton,
	Select,
	Table,
	Text,
	TextField,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { ConfirmationDialog } from "@/shared/components/ConfirmationDialog";
import { createTagAction, deleteTagAction } from "../actions/tags";

const COLORS = [
	"gray",
	"blue",
	"green",
	"amber",
	"red",
	"violet",
	"indigo",
	"cyan",
	"pink",
	"yellow",
] as const;

type Tag = {
	id: string;
	name: string;
	color: string;
	_count: { applications: number };
};

export function TagManager({ tags }: { tags: Tag[] }) {
	const t = useTranslations();
	const tCommon = useTranslations("common");
	const [name, setName] = useState("");
	const [color, setColor] = useState<(typeof COLORS)[number]>("gray");
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const formRef = useRef<HTMLFormElement>(null);

	return (
		<Flex direction="column" gap="3">
			<Card>
				<form
					ref={formRef}
					action={(fd) => {
						setError(null);
						startTransition(async () => {
							fd.set("name", name);
							fd.set("color", color);
							const r = await createTagAction(fd);
							if (!r.ok && r.error) {
								try {
									setError(t(r.error as never));
								} catch {
									setError(r.error);
								}
							} else {
								setName("");
								formRef.current?.reset();
							}
						});
					}}
				>
					<Flex gap="2" align="end" wrap="wrap">
						<Flex direction="column" gap="1" style={{ flex: 1, minWidth: 220 }}>
							<Text size="1">{t("tags.name")}</Text>
							<TextField.Root
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t("tags.namePlaceholder")}
								required
							/>
						</Flex>
						<Flex direction="column" gap="1">
							<Text size="1">{t("tags.color")}</Text>
							<Select.Root
								value={color}
								onValueChange={(v) => setColor(v as (typeof COLORS)[number])}
							>
								<Select.Trigger />
								<Select.Content>
									{COLORS.map((c) => (
										<Select.Item key={c} value={c}>
											{c}
										</Select.Item>
									))}
								</Select.Content>
							</Select.Root>
						</Flex>
						<Button type="submit" disabled={pending}>
							{t("tags.addButton")}
						</Button>
					</Flex>
				</form>
				{error && (
					<Text size="2" color="red" mt="2">
						{error}
					</Text>
				)}
			</Card>

			{tags.length === 0 ? (
				<Card>
					<Text color="gray">{t("tags.noTags")}</Text>
				</Card>
			) : (
				<Card>
					<Table.Root variant="surface">
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeaderCell>
									{t("tags.name")}
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell>
									{t("tags.color")}
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell>
									{t("nav.applications")}
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell>
									{t("common.actions")}
								</Table.ColumnHeaderCell>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{tags.map((tag) => (
								<Table.Row key={tag.id}>
									<Table.Cell>
										<Badge color={tag.color as never}>{tag.name}</Badge>
									</Table.Cell>
									<Table.Cell>{tag.color}</Table.Cell>
									<Table.Cell>
										{t("tags.applicationsCount", {
											count: tag._count.applications,
										})}
									</Table.Cell>
									<Table.Cell>
										<ConfirmationDialog
											title={tCommon("delete")}
											description={t("tags.deleteConfirm", { name: tag.name })}
											onConfirm={() => deleteTagAction(tag.id)}
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
				</Card>
			)}
		</Flex>
	);
}
