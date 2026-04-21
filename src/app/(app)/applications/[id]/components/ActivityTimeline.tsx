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
				const translateKey = (key: string): string => {
					try {
						return t(key as never);
					} catch {
						return key;
					}
				};

				const renderValue = (field: string | null, v: unknown): string => {
					if (v == null) return "—";
					if (typeof v === "boolean")
						return v ? t("common.yes") : t("common.no");
					if (Array.isArray(v)) return v.join(", ");
					if (typeof v === "string") {
						switch (field) {
							case "status":
								return translateKey("status." + v);
							case "workMode":
								return translateKey("workMode." + v);
							case "employmentType":
								return translateKey("employmentType." + v);
							case "priority":
								return translateKey("priority." + v);
							case "sourceType":
								return translateKey("sourceType." + v);
							case "nextActionType":
								return translateKey("nextActionType." + v);
							case "outcomeReason":
								return translateKey("outcomeReason." + v);
							case "relocationPreference":
								return translateKey("relocationPreference." + v);
							case "companySize":
								return translateKey("companySize." + v);
							case "applicationMethod":
								return translateKey("applicationMethod." + v);
							default:
								return v;
						}
					}
					return String(v);
				};

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
										<code>{renderValue(e.field, oldV)}</code>{" "}
										{t("activity.changedTo")}:{" "}
										<code>{renderValue(e.field, newV)}</code>
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
