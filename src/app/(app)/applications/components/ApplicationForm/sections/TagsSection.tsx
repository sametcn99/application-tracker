"use client";

import { Card, Checkbox, Flex, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { useTx } from "../hooks/useTx";
import type { SectionBaseProps, Tag } from "../types";

type Props = SectionBaseProps & {
	tags: Tag[];
};

export function TagsSection({ form, tags }: Props) {
	const { t } = useTx();
	const { control } = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Flex align="center" justify="between" gap="3">
					<Heading size="4">{t("applicationForm.sections.tags")}</Heading>
					<Link href="/tags" style={{ fontSize: 12 }}>
						{t("applicationForm.manageTags")}
					</Link>
				</Flex>
				<Controller
					control={control}
					name="tagIds"
					render={({ field }) => {
						const selected = new Set(field.value ?? []);
						return (
							<Flex gap="3" wrap="wrap">
								{tags.length === 0 && (
									<Text size="2" color="gray">
										{t("applicationForm.noTags")}
									</Text>
								)}
								{tags.map((tag) => (
									<Text as="label" size="2" key={tag.id}>
										<Flex gap="2" align="center">
											<Checkbox
												checked={selected.has(tag.id)}
												onCheckedChange={(c) => {
													const next = new Set(selected);
													if (c) next.add(tag.id);
													else next.delete(tag.id);
													field.onChange(Array.from(next));
												}}
											/>
											{tag.name}
										</Flex>
									</Text>
								))}
							</Flex>
						);
					}}
				/>
			</Flex>
		</Card>
	);
}
