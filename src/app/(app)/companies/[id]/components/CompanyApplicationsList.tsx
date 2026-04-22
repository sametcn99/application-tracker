"use client";

import { Badge, Card, Flex, Table, Text } from "@radix-ui/themes";
import Link from "next/link";
import { useTranslations } from "next-intl";

type App = {
	id: string;
	position: string;
	status: string;
	appliedAt: string;
	location: string | null;
};

export function CompanyApplicationsList({
	applications,
}: {
	applications: App[];
}) {
	const t = useTranslations("companies");
	const tFields = useTranslations("fields");

	if (applications.length === 0) {
		return (
			<Card>
				<Text color="gray">{t("noLinkedApplications")}</Text>
			</Card>
		);
	}

	return (
		<Card>
			<Table.Root variant="surface">
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeaderCell>
							{tFields("position")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>{tFields("status")}</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{tFields("location")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{tFields("appliedAt")}
						</Table.ColumnHeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{applications.map((a) => (
						<Table.Row key={a.id}>
							<Table.Cell>
								<Link
									href={`/applications/${a.id}`}
									style={{
										color: "var(--accent-11)",
										textDecoration: "none",
										fontWeight: 500,
									}}
								>
									{a.position}
								</Link>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="soft">{a.status}</Badge>
							</Table.Cell>
							<Table.Cell>{a.location ?? "—"}</Table.Cell>
							<Table.Cell>
								{new Date(a.appliedAt).toLocaleDateString()}
							</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table.Root>
		</Card>
	);
}
