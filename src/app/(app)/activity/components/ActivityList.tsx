"use client";

import { Badge, Card, Flex, Spinner, Text } from "@radix-ui/themes";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchActivitiesAction } from "@/shared/actions/activity";
import { ACTIVITY_TYPE_COLORS } from "@/shared/constants/application";
import { decodeValue } from "@/shared/lib/audit";
import { formatRelative } from "@/shared/lib/format";

type ActivityItem = {
	id: string;
	applicationId: string;
	type: string;
	field: string | null;
	oldValue: string | null;
	newValue: string | null;
	comment: string | null;
	createdAt: Date;
	application: { id: string; company: string; position: string };
};

export function ActivityList({
	initialItems,
}: {
	initialItems: ActivityItem[];
}) {
	const t = useTranslations();

	const [items, setItems] = useState<ActivityItem[]>(initialItems);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(initialItems.length === 20);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setItems(initialItems);
		setPage(1);
		setHasMore(initialItems.length === 20);
	}, [initialItems]);

	const loadMore = useCallback(async () => {
		setLoading(true);
		try {
			const nextPage = page + 1;
			const newItems = await fetchActivitiesAction(nextPage, 20);
			setItems((prev) => {
				const existingIds = new Set(prev.map((i) => i.id));
				const filtered = newItems.filter((n) => !existingIds.has(n.id));
				return [...prev, ...filtered];
			});
			setPage(nextPage);
			setHasMore(newItems.length === 20);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [page]);

	const observer = useRef<IntersectionObserver | null>(null);
	const lastElementRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (loading) return;
			if (observer.current) observer.current.disconnect();
			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore) {
					loadMore();
				}
			});
			if (node) observer.current.observe(node);
		},
		[loading, hasMore, loadMore],
	);

	if (items.length === 0) {
		return (
			<Card>
				<Text color="gray">{t("activity.noActivity")}</Text>
			</Card>
		);
	}

	return (
		<>
			<Flex direction="column" gap="2">
				{items.map((e) => {
					const color =
						ACTIVITY_TYPE_COLORS[e.type as keyof typeof ACTIVITY_TYPE_COLORS] ??
						"gray";
					const oldV = decodeValue(e.oldValue);
					const newV = decodeValue(e.newValue);
					const isStatus = e.field === "status";
					const fieldLabel = e.field
						? (() => {
								try {
									return t(("fields." + e.field) as never);
								} catch {
									return e.field;
								}
							})()
						: null;
					const renderValue = (v: unknown) => {
						if (v == null) return "—";
						if (Array.isArray(v)) return v.join(", ");
						return String(v);
					};
					return (
						<Card key={e.id}>
							<Flex justify="between" align="start" gap="3">
								<Flex direction="column" gap="1" style={{ flex: 1 }}>
									<Flex gap="2" align="center" wrap="wrap">
										<Badge color={color}>
											{t(("activityType." + e.type) as never)}
										</Badge>
										<Link
											href={"/applications/" + e.application.id}
											style={{ textDecoration: "none", color: "inherit" }}
										>
											<Text weight="medium" size="2">
												{e.application.position}
											</Text>
											<Text size="1" color="gray">
												{" · " + e.application.company}
											</Text>
										</Link>
										{fieldLabel && (
											<Text size="2" color="gray">
												({fieldLabel})
											</Text>
										)}
									</Flex>
									{e.type === "COMMENT" && e.comment && (
										<Text size="2" style={{ whiteSpace: "pre-wrap" }}>
											{e.comment}
										</Text>
									)}
									{(e.type === "FIELD_CHANGE" ||
										e.type === "STATUS_CHANGE") && (
										<Text size="2" color="gray">
											{t("activity.changedFrom")}:{" "}
											<code>
												{isStatus && typeof oldV === "string"
													? t(("status." + oldV) as never)
													: renderValue(oldV)}
											</code>{" "}
											{t("activity.changedTo")}:{" "}
											<code>
												{isStatus && typeof newV === "string"
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

			{hasMore && (
				<Flex ref={lastElementRef} p="4" justify="center" align="center">
					{loading ? (
						<Spinner />
					) : (
						<Text size="2" color="gray">
							Loading more...
						</Text>
					)}
				</Flex>
			)}
		</>
	);
}
