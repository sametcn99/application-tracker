import { Pencil1Icon } from "@radix-ui/react-icons";
import {
	Badge,
	Box,
	Button,
	Card,
	Flex,
	Heading,
	Tabs,
	Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/shared/constants/application";
import { getApplication } from "@/shared/lib/applications";
import { formatDate } from "@/shared/lib/format";
import { getCurrencyOptions } from "@/shared/lib/reference-data";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { ApplicationDetails } from "./components/ApplicationDetails";
import { AttachmentList } from "./components/AttachmentList";
import { DeleteApplicationButton } from "./components/DeleteApplicationButton";
import { StatusSelector } from "./components/StatusSelector";

export default async function ApplicationDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [app, currencies] = await Promise.all([
		getApplication(id),
		getCurrencyOptions(),
	]);
	if (!app) notFound();
	const t = await getTranslations();

	return (
		<Flex direction="column" gap="4">
			<Card>
				<Flex justify="between" align="start" gap="4" wrap="wrap">
					<Box>
						<Flex align="center" gap="2">
							<Heading size="6">{app.position}</Heading>
							<Badge
								color={
									STATUS_COLORS[app.status as keyof typeof STATUS_COLORS] ??
									"gray"
								}
							>
								{t(("status." + app.status) as never)}
							</Badge>
							<Badge
								variant="soft"
								color={
									PRIORITY_COLORS[
										app.priority as keyof typeof PRIORITY_COLORS
									] ?? "gray"
								}
							>
								{t(("priority." + app.priority) as never)}
							</Badge>
						</Flex>
						<Text color="gray" size="3">
							{app.company} · {app.location ?? "—"}
						</Text>
						<Text
							color="gray"
							size="2"
							style={{ display: "block", marginTop: 4 }}
						>
							{t("fields.appliedAt")}: {formatDate(app.appliedAt)}
						</Text>
					</Box>
					<Flex gap="2" align="center">
						<StatusSelector applicationId={app.id} status={app.status} />
						<Button asChild variant="soft">
							<Link href={"/applications/" + app.id + "/edit"}>
								<Pencil1Icon /> {t("common.edit")}
							</Link>
						</Button>
						<DeleteApplicationButton id={app.id} />
					</Flex>
				</Flex>
			</Card>

			<Tabs.Root defaultValue="details">
				<Tabs.List>
					<Tabs.Trigger value="details">
						{t("applicationDetail.tabs.details")}
					</Tabs.Trigger>
					<Tabs.Trigger value="activity">
						{t("applicationDetail.tabs.activity")}
					</Tabs.Trigger>
					<Tabs.Trigger value="attachments">
						{t("applicationDetail.tabs.attachments")}
					</Tabs.Trigger>
				</Tabs.List>

				<Box pt="4">
					<Tabs.Content value="details">
						<ApplicationDetails app={app} currencies={currencies} />
					</Tabs.Content>
					<Tabs.Content value="activity">
						<Flex direction="column" gap="3">
							<ActivityTimeline entries={app.activities} />
						</Flex>
					</Tabs.Content>
					<Tabs.Content value="attachments">
						<AttachmentList
							applicationId={app.id}
							attachments={app.attachments}
						/>
					</Tabs.Content>
				</Box>
			</Tabs.Root>
		</Flex>
	);
}
