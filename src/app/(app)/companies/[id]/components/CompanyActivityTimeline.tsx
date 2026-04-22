"use client";

import { Button, Card, Flex, Text, TextArea } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { addCompanyNoteAction } from "../../actions/companies";

type Activity = {
	id: string;
	type: string;
	field: string | null;
	oldValue: string | null;
	newValue: string | null;
	comment: string | null;
	createdAt: string;
};

function translateLabel(
	translate: (key: never) => string,
	key: string | null,
): string | null {
	if (!key) return null;
	try {
		return translate(key as never);
	} catch {
		return key;
	}
}

function decode(v: string | null): string {
	if (!v) return "—";
	try {
		const parsed = JSON.parse(v);
		return parsed === null ? "—" : String(parsed);
	} catch {
		return v;
	}
}

export function CompanyActivityTimeline({
	companyId,
	activities,
}: {
	companyId: string;
	activities: Activity[];
}) {
	const t = useTranslations("companyForm");
	const tType = useTranslations("activityType");
	const tFields = useTranslations("fields");
	const tCommon = useTranslations("comments");
	const [note, setNote] = useState("");
	const [pending, startTransition] = useTransition();

	return (
		<Flex direction="column" gap="4">
			<Card>
				<Flex direction="column" gap="2">
					<Text size="2" weight="medium">
						{t("notesTitle")}
					</Text>
					<TextArea
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder={t("notePlaceholder")}
						rows={3}
					/>
					<Flex justify="end">
						<Button
							disabled={pending || !note.trim()}
							onClick={() => {
								startTransition(async () => {
									const result = await addCompanyNoteAction(companyId, note);
									if (result.ok) setNote("");
								});
							}}
						>
							{pending ? tCommon("submitting") : t("addNote")}
						</Button>
					</Flex>
				</Flex>
			</Card>

			<Flex direction="column" gap="2">
				{activities.length === 0 ? (
					<Card>
						<Text color="gray">—</Text>
					</Card>
				) : (
					activities.map((a) => (
						<Card key={a.id}>
							{(() => {
								const activityLabel = translateLabel(tType, a.type) ?? a.type;
								const fieldLabel = translateLabel(tFields, a.field);

								return (
									<Flex direction="column" gap="1">
										<Flex justify="between" align="center" wrap="wrap" gap="2">
											<Text size="2" weight="medium">
												{activityLabel}
												{fieldLabel && ` · ${fieldLabel}`}
											</Text>
											<Text size="1" color="gray">
												{new Date(a.createdAt).toLocaleString()}
											</Text>
										</Flex>
										{a.type === "FIELD_CHANGE" && (
											<Text size="1" color="gray">
												{decode(a.oldValue)} → {decode(a.newValue)}
											</Text>
										)}
										{a.comment &&
											a.type !== "LINKED_APPLICATION" &&
											a.type !== "UNLINKED_APPLICATION" && (
												<Text size="2" style={{ whiteSpace: "pre-wrap" }}>
													{a.comment}
												</Text>
											)}
									</Flex>
								);
							})()}
						</Card>
					))
				)}
			</Flex>
		</Flex>
	);
}
