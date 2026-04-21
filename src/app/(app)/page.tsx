import {
	Badge,
	Box,
	Button,
	Card,
	Flex,
	Heading,
	Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { STATUS_COLORS, STATUSES } from "@/shared/constants/application";
import { formatDate, formatRelative } from "@/shared/lib/format";
import { prisma } from "@/shared/lib/prisma";

export default async function DashboardPage() {
	const t = await getTranslations();
	const [total, byStatus, upcoming, recent] = await Promise.all([
		prisma.application.count(),
		prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
		prisma.application.findMany({
			where: { nextStepAt: { gte: new Date() } },
			orderBy: { nextStepAt: "asc" },
			take: 5,
		}),
		prisma.activityEntry.findMany({
			orderBy: { createdAt: "desc" },
			take: 8,
			include: {
				application: { select: { id: true, company: true, position: true } },
			},
		}),
	]);

	const startOfWeek = new Date();
	startOfWeek.setDate(startOfWeek.getDate() - 7);
	const thisWeek = await prisma.application.count({
		where: { appliedAt: { gte: startOfWeek } },
	});
	const interviews =
		byStatus.find((s) => s.status === "INTERVIEW")?._count._all ?? 0;
	const closed = new Set(["REJECTED", "WITHDRAWN"]);
	const active = byStatus
		.filter((s) => !closed.has(s.status))
		.reduce((a, s) => a + s._count._all, 0);

	const counts = new Map(byStatus.map((s) => [s.status, s._count._all]));
	const max = Math.max(1, ...byStatus.map((s) => s._count._all));

	return (
		<Flex direction="column" gap="5">
			<Heading size="6">{t("dashboard.title")}</Heading>

			<Flex gap="4" wrap="wrap">
				<Stat label={t("dashboard.totalApplications")} value={total} />
				<Stat label={t("dashboard.active")} value={active} />
				<Stat label={t("dashboard.thisWeek")} value={thisWeek} />
				<Stat label={t("dashboard.interviews")} value={interviews} />
			</Flex>

			<Card>
				<Flex direction="column" gap="3">
					<Heading size="4">{t("dashboard.statusDistribution")}</Heading>
					<Flex direction="column" gap="2">
						{STATUSES.map((s) => {
							const c = counts.get(s) ?? 0;
							const pct = (c / max) * 100;
							return (
								<Flex key={s} align="center" gap="3">
									<Box style={{ width: 110 }}>
										<Badge color={STATUS_COLORS[s]}>
											{t(("status." + s) as never)}
										</Badge>
									</Box>
									<Box
										style={{
											flex: 1,
											background: "var(--gray-a3)",
											borderRadius: 4,
											overflow: "hidden",
											height: 12,
										}}
									>
										<Box
											style={{
												width: pct + "%",
												height: "100%",
												background: "var(--" + STATUS_COLORS[s] + "-9)",
											}}
										/>
									</Box>
									<Text
										size="2"
										color="gray"
										style={{ width: 30, textAlign: "right" }}
									>
										{c}
									</Text>
								</Flex>
							);
						})}
					</Flex>
				</Flex>
			</Card>

			<Flex gap="4" direction={{ initial: "column", md: "row" }}>
				<Card style={{ flex: 1 }}>
					<Flex direction="column" gap="3">
						<Heading size="4">{t("dashboard.upcomingSteps")}</Heading>
						{upcoming.length === 0 ? (
							<Text color="gray" size="2">
								{t("dashboard.noUpcomingSteps")}
							</Text>
						) : (
							<Flex direction="column" gap="2">
								{upcoming.map((u) => (
									<Link
										key={u.id}
										href={"/applications/" + u.id}
										style={{ textDecoration: "none", color: "inherit" }}
									>
										<Flex justify="between" align="center">
											<Box>
												<Text weight="medium" size="2">
													{u.position}
												</Text>
												<Text
													color="gray"
													size="1"
													style={{ display: "block" }}
												>
													{u.company}
												</Text>
											</Box>
											<Text size="1" color="gray">
												{formatDate(u.nextStepAt)}
											</Text>
										</Flex>
									</Link>
								))}
							</Flex>
						)}
					</Flex>
				</Card>

				<Card style={{ flex: 1 }}>
					<Flex direction="column" gap="3">
						<Flex justify="between" align="center">
							<Heading size="4">{t("dashboard.recentActivity")}</Heading>
							<Button asChild variant="ghost" size="1">
								<Link href="/activity">{t("common.viewAll")}</Link>
							</Button>
						</Flex>
						{recent.length === 0 ? (
							<Text color="gray" size="2">
								{t("dashboard.noActivity")}
							</Text>
						) : (
							<Flex direction="column" gap="2">
								{recent.map((a) => (
									<Link
										key={a.id}
										href={"/applications/" + a.application.id}
										style={{ textDecoration: "none", color: "inherit" }}
									>
										<Flex justify="between" gap="3">
											<Box style={{ minWidth: 0 }}>
												<Text size="2" weight="medium">
													{a.application.position}
												</Text>
												<Text
													size="1"
													color="gray"
													style={{ display: "block" }}
												>
													{a.application.company} ·{" "}
													{t(("activityType." + a.type) as never)}
												</Text>
											</Box>
											<Text size="1" color="gray">
												{formatRelative(a.createdAt)}
											</Text>
										</Flex>
									</Link>
								))}
							</Flex>
						)}
					</Flex>
				</Card>
			</Flex>
		</Flex>
	);
}

function Stat({ label, value }: { label: string; value: number }) {
	return (
		<Card style={{ flex: "1 1 180px" }}>
			<Flex direction="column" gap="1">
				<Text size="1" color="gray">
					{label}
				</Text>
				<Heading size="6">{value}</Heading>
			</Flex>
		</Card>
	);
}
