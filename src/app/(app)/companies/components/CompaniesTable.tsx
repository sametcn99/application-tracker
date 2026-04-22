"use client";

import { Badge, Card, Flex, Table, Text } from "@radix-ui/themes";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Company = {
	id: string;
	name: string;
	industry: string | null;
	location: string | null;
	website: string | null;
	applicationsCount: number;
};

export function CompaniesTable({ companies }: { companies: Company[] }) {
	const t = useTranslations("companies");
	const tFields = useTranslations("fields");

	if (companies.length === 0) {
		return (
			<Card>
				<Text color="gray">{t("noCompanies")}</Text>
			</Card>
		);
	}

	return (
		<Card>
			<Table.Root variant="surface">
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeaderCell>
							{tFields("company")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{tFields("industry")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{tFields("location")}
						</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>
							{t("linkedApplications")}
						</Table.ColumnHeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{companies.map((c) => (
						<Table.Row key={c.id}>
							<Table.Cell>
								<Flex direction="column" gap="1">
									<Link
										href={`/companies/${c.id}`}
										style={{
											color: "var(--accent-11)",
											textDecoration: "none",
											fontWeight: 500,
										}}
									>
										{c.name}
									</Link>
									{c.website && (
										<Text size="1" color="gray">
											{c.website}
										</Text>
									)}
								</Flex>
							</Table.Cell>
							<Table.Cell>{c.industry ?? "—"}</Table.Cell>
							<Table.Cell>{c.location ?? "—"}</Table.Cell>
							<Table.Cell>
								<Badge variant="soft">{c.applicationsCount}</Badge>
							</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table.Root>
		</Card>
	);
}
