"use client";

import { Badge, Card, Flex, Spinner, Table, Text } from "@radix-ui/themes";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApplicationsAction } from "@/shared/actions/applications";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/shared/constants/application";
import type { ListFilters } from "@/shared/lib/applications";
import { formatDate, formatSalary } from "@/shared/lib/format";

type Item = {
	id: string;
	company: string;
	position: string;
	status: string;
	priority: string;
	workMode: string;
	location: string | null;
	salaryMin: number | null;
	salaryMax: number | null;
	currency: string | null;
	source: string | null;
	appliedAt: Date;
	tags: { tag: { id: string; name: string; color: string } }[];
};

export function ApplicationsTable({
	initialItems,
	initialNextCursor,
	initialHasMore,
	filters,
}: {
	initialItems: Item[];
	initialNextCursor: string | null;
	initialHasMore: boolean;
	filters: ListFilters;
}) {
	const t = useTranslations();

	const [items, setItems] = useState<Item[]>(initialItems);
	const [nextCursor, setNextCursor] = useState<string | null>(
		initialNextCursor,
	);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [loading, setLoading] = useState(false);

	// Sync initial items when filters change (React server components remount strategy vs effect)
	useEffect(() => {
		setItems(initialItems);
		setNextCursor(initialNextCursor);
		setHasMore(initialHasMore);
	}, [initialItems, initialNextCursor, initialHasMore]);

	const loadMore = useCallback(async () => {
		if (!nextCursor || loading) return;

		setLoading(true);
		try {
			const page = await fetchApplicationsAction(filters, nextCursor);
			setItems((prev) => {
				// Prevent duplicates in StrictMode
				const existingIds = new Set(prev.map((i) => i.id));
				const filtered = page.items.filter((n) => !existingIds.has(n.id));
				return [...prev, ...filtered];
			});
			setNextCursor(page.nextCursor);
			setHasMore(page.hasMore);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [filters, loading, nextCursor]);

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
				<Flex p="4" justify="center">
					<Text color="gray">{t("applications.noResults")}</Text>
				</Flex>
			</Card>
		);
	}

	return (
		<Card>
			<Table.Root variant="surface">
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeaderCell>
							{t("applications.columns.positionCompany")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{t("applications.columns.status")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{t("applications.columns.mode")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{t("applications.columns.location")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{t("applications.columns.salary")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{t("applications.columns.source")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{t("applications.columns.date")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{t("applications.columns.tags")}
						</Table.ColumnHeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{items.map((a) => (
						<Table.Row key={a.id}>
							<Table.Cell>
								<Link
									href={"/applications/" + a.id}
									style={{ textDecoration: "none", color: "inherit" }}
								>
									<Text weight="medium">{a.position}</Text>
									<Flex
										gap="2"
										align="center"
										wrap="wrap"
										style={{ marginTop: "4px" }}
									>
										<Text size="1" color="gray">
											{a.company}
										</Text>
										<Badge
											color={
												PRIORITY_COLORS[
													a.priority as keyof typeof PRIORITY_COLORS
												] ?? "gray"
											}
											variant="soft"
										>
											{t(("priority." + a.priority) as never)}
										</Badge>
									</Flex>
								</Link>
							</Table.Cell>
							<Table.Cell>
								<Badge
									color={
										STATUS_COLORS[a.status as keyof typeof STATUS_COLORS] ??
										"gray"
									}
								>
									{t(("status." + a.status) as never)}
								</Badge>
							</Table.Cell>
							<Table.Cell>{t(("workMode." + a.workMode) as never)}</Table.Cell>
							<Table.Cell>{a.location ?? "—"}</Table.Cell>
							<Table.Cell>
								{formatSalary(a.salaryMin, a.salaryMax, a.currency)}
							</Table.Cell>
							<Table.Cell>{a.source ?? "—"}</Table.Cell>
							<Table.Cell>{formatDate(a.appliedAt)}</Table.Cell>
							<Table.Cell>
								<Flex gap="1" wrap="wrap">
									{a.tags.map((t) => (
										<Badge key={t.tag.id} color="gray" variant="soft">
											{t.tag.name}
										</Badge>
									))}
								</Flex>
							</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table.Root>

			{/* Infinite Scroll Trigger */}
			{hasMore && (
				<Flex ref={lastElementRef} p="4" justify="center" align="center">
					{loading ? (
						<Spinner />
					) : (
						<Text size="2" color="gray">
							{t("applications.loadingMore")}
						</Text>
					)}
				</Flex>
			)}
		</Card>
	);
}
