"use client";

import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import {
	Button,
	Card,
	Flex,
	IconButton,
	Text,
	TextField,
} from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { createSourceAction, deleteSourceAction } from "../actions/sources";

type SourceItem = {
	id: string;
	name: string;
	applicationsCount: number;
};

export function SourceManager({ sources }: { sources: SourceItem[] }) {
	const t = useTranslations();
	const tSources = useTranslations("sources");
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const tx = (key: string) => (key.includes(".") ? t(key as never) : key);

	return (
		<Flex direction="column" gap="4">
			<Card>
				<form
					ref={formRef}
					action={(formData) =>
						startTransition(async () => {
							const result = await createSourceAction(formData);
							if (!result.ok) {
								setError(tx(result.error));
								return;
							}

							setError(null);
							formRef.current?.reset();
							router.refresh();
						})
					}
				>
					<Flex direction="column" gap="2">
						<Flex gap="2" align="end" wrap="wrap">
							<Flex
								direction="column"
								gap="1"
								style={{ flex: 1, minWidth: 240 }}
							>
								<Text size="1" color="gray">
									{tSources("name")}
								</Text>
								<TextField.Root
									name="name"
									placeholder={tSources("namePlaceholder")}
									required
								/>
							</Flex>
							<Button type="submit" disabled={pending}>
								<PlusIcon />
								{tSources("addButton")}
							</Button>
						</Flex>
						{error && (
							<Text size="1" color="red">
								{error}
							</Text>
						)}
					</Flex>
				</form>
			</Card>

			{sources.length === 0 ? (
				<Text color="gray">{tSources("noSources")}</Text>
			) : (
				<Flex direction="column" gap="2">
					{sources.map((source) => (
						<Card key={source.id}>
							<Flex align="center" justify="between" gap="3" wrap="wrap">
								<Flex direction="column" gap="1">
									<Text weight="medium">{source.name}</Text>
									<Text size="1" color="gray">
										{tSources("applicationsCount", {
											count: source.applicationsCount,
										})}
									</Text>
								</Flex>
								<IconButton
									size="1"
									variant="soft"
									color="red"
									disabled={pending}
									onClick={() => {
										if (
											confirm(tSources("deleteConfirm", { name: source.name }))
										) {
											startTransition(async () => {
												setError(null);
												await deleteSourceAction(source.id);
												router.refresh();
											});
										}
									}}
								>
									<TrashIcon />
								</IconButton>
							</Flex>
						</Card>
					))}
				</Flex>
			)}
		</Flex>
	);
}
