"use client";

import { Badge, Box, Card, Flex, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ACTIVITY_TYPE_COLORS } from "@/shared/constants/application";
import { decodeValue } from "@/shared/lib/audit";
import { formatRelative } from "@/shared/lib/format";

type Entry = {
	id: string;
	type: string;
	field: string | null;
	oldValue: string | null;
	newValue: string | null;
	comment: string | null;
	createdAt: Date;
};

export function ActivityTimeline({ entries }: { entries: Entry[] }) {
	const t = useTranslations();
	if (entries.length === 0) {
		return (
			<Card>
				<Text color="gray">{t("activity.noActivity")}</Text>
			</Card>
		);
	}
	return (
		<Flex direction="column" gap="2">
			{entries.map((e) => {
				const color =
					ACTIVITY_TYPE_COLORS[e.type as keyof typeof ACTIVITY_TYPE_COLORS] ??
					"gray";
				const oldV = decodeValue(e.oldValue);
				const newV = decodeValue(e.newValue);

				const renderValue = (v: unknown): string => {
					if (v == null) return "—";
					if (Array.isArray(v)) return v.join(", ");
					return String(v);
				};

				const isStatusField = e.field === "status";
				const fieldLabel = e.field
					? (() => {
							try {
								return t(("fields." + e.field) as never);
							} catch {
								return e.field;
							}
						})()
					: null;

				return (
					<Card key={e.id}>
						<Flex justify="between" align="start" gap="3">
							<Flex direction="column" gap="1" style={{ flex: 1 }}>
								<Flex gap="2" align="center">
									<Badge color={color}>
										{t(("activityType." + e.type) as never)}
									</Badge>
									{fieldLabel && (
										<Text size="2" weight="medium">
											{fieldLabel}
										</Text>
									)}
								</Flex>
								{e.type === "COMMENT" && e.comment && (
									<Box
										style={{
											fontSize: "var(--font-size-2)",
											lineHeight: "1.5",
										}}
									>
										<ReactMarkdown remarkPlugins={[remarkGfm]}>
											{e.comment}
										</ReactMarkdown>
									</Box>
								)}
								{(e.type === "FIELD_CHANGE" || e.type === "STATUS_CHANGE") && (
									<Text size="2" color="gray">
										{t("activity.changedFrom")}:{" "}
										<code>
											{isStatusField && typeof oldV === "string"
												? t(("status." + oldV) as never)
												: renderValue(oldV)}
										</code>{" "}
										{t("activity.changedTo")}:{" "}
										<code>
											{isStatusField && typeof newV === "string"
												? t(("status." + newV) as never)
												: renderValue(newV)}
										</code>
									</Text>
								)}
							</Flex>
							<Text size="1" color="gray">
								{formatRelative(e.createdAt)}
							</Text>
						</Flex>
					</Card>
				);
			})}
		</Flex>
	);
}
