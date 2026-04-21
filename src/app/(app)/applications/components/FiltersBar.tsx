"use client";

import { Button, Card, Flex, Select, TextField } from "@radix-ui/themes";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import {
	APPLICATION_METHODS,
	COMPANY_SIZES,
	NEXT_ACTION_TYPES,
	OUTCOME_REASONS,
	PRIORITIES,
	RELOCATION_PREFERENCES,
	SOURCE_TYPES,
	STATUSES,
	WORK_MODES,
} from "@/shared/constants/application";

type Tag = { id: string; name: string };

export function FiltersBar({ tags }: { tags: Tag[] }) {
	const t = useTranslations();
	const router = useRouter();
	const sp = useSearchParams();
	const [pending, startTransition] = useTransition();

	const update = (patch: Record<string, string | undefined>) => {
		const next = new URLSearchParams(sp.toString());
		for (const [k, v] of Object.entries(patch)) {
			if (v === undefined || v === "" || v === "all") next.delete(k);
			else next.set(k, v);
		}
		startTransition(() => router.push("/applications?" + next.toString()));
	};

	return (
		<Card>
			<Flex gap="3" wrap="wrap" align="end">
				<Flex direction="column" gap="1" style={{ minWidth: 220, flex: 1 }}>
					<label style={{ fontSize: 12 }}>{t("filters.search")}</label>
					<TextField.Root
						defaultValue={sp.get("q") ?? ""}
						placeholder={t("filters.searchPlaceholder")}
						onBlur={(e) => update({ q: e.currentTarget.value || undefined })}
					/>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.status")}</label>
					<Select.Root
						value={sp.get("status") ?? "all"}
						onValueChange={(v) => update({ status: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="all">{t("common.all")}</Select.Item>
							{STATUSES.map((s) => (
								<Select.Item key={s} value={s}>
									{t(("status." + s) as never)}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.priority")}</label>
					<Select.Root
						value={sp.get("priority") ?? "all"}
						onValueChange={(v) => update({ priority: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="all">{t("common.all")}</Select.Item>
							{PRIORITIES.map((priority) => (
								<Select.Item key={priority} value={priority}>
									{t(("priority." + priority) as never)}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.workMode")}</label>
					<Select.Root
						value={sp.get("workMode") ?? "all"}
						onValueChange={(v) => update({ workMode: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="all">{t("common.all")}</Select.Item>
							{WORK_MODES.map((s) => (
								<Select.Item key={s} value={s}>
									{t(("workMode." + s) as never)}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.sourceType")}</label>
					<Select.Root
						value={sp.get("sourceType") ?? "all"}
						onValueChange={(v) => update({ sourceType: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="all">{t("common.all")}</Select.Item>
							{SOURCE_TYPES.map((sourceType) => (
								<Select.Item key={sourceType} value={sourceType}>
									{t(("sourceType." + sourceType) as never)}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.companySize")}</label>
					<Select.Root
						value={sp.get("companySize") ?? "all"}
						onValueChange={(v) => update({ companySize: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="all">{t("common.all")}</Select.Item>
							{COMPANY_SIZES.map((size) => (
								<Select.Item key={size} value={size}>
									{t(("companySize." + size) as never)}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>
						{t("filters.applicationMethod")}
					</label>
					<Select.Root
						value={sp.get("applicationMethod") ?? "all"}
						onValueChange={(v) => update({ applicationMethod: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="all">{t("common.all")}</Select.Item>
							{APPLICATION_METHODS.map((method) => (
								<Select.Item key={method} value={method}>
									{t(("applicationMethod." + method) as never)}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>
						{t("filters.relocationPreference")}
					</label>
					<Select.Root
						value={sp.get("relocationPreference") ?? "all"}
						onValueChange={(v) => update({ relocationPreference: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="all">{t("common.all")}</Select.Item>
							{RELOCATION_PREFERENCES.map((preference) => (
								<Select.Item key={preference} value={preference}>
									{t(("relocationPreference." + preference) as never)}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>
						{t("filters.needsSponsorship")}
					</label>
					<Select.Root
						value={sp.get("needsSponsorship") ?? "all"}
						onValueChange={(v) => update({ needsSponsorship: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="all">{t("common.all")}</Select.Item>
							<Select.Item value="true">{t("common.yes")}</Select.Item>
							<Select.Item value="false">{t("common.no")}</Select.Item>
						</Select.Content>
					</Select.Root>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.nextActionType")}</label>
					<Select.Root
						value={sp.get("nextActionType") ?? "all"}
						onValueChange={(v) => update({ nextActionType: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="all">{t("common.all")}</Select.Item>
							{NEXT_ACTION_TYPES.map((actionType) => (
								<Select.Item key={actionType} value={actionType}>
									{t(("nextActionType." + actionType) as never)}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.outcomeReason")}</label>
					<Select.Root
						value={sp.get("outcomeReason") ?? "all"}
						onValueChange={(v) => update({ outcomeReason: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="all">{t("common.all")}</Select.Item>
							{OUTCOME_REASONS.map((reason) => (
								<Select.Item key={reason} value={reason}>
									{t(("outcomeReason." + reason) as never)}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.tag")}</label>
					<Select.Root
						value={sp.get("tag") ?? "all"}
						onValueChange={(v) => update({ tag: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="all">{t("common.all")}</Select.Item>
							{tags.map((tag) => (
								<Select.Item key={tag.id} value={tag.id}>
									{tag.name}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.from")}</label>
					<TextField.Root
						type="date"
						defaultValue={sp.get("from") ?? ""}
						onChange={(e) =>
							update({ from: e.currentTarget.value || undefined })
						}
					/>
				</Flex>
				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.to")}</label>
					<TextField.Root
						type="date"
						defaultValue={sp.get("to") ?? ""}
						onChange={(e) => update({ to: e.currentTarget.value || undefined })}
					/>
				</Flex>

				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.sortBy")}</label>
					<Select.Root
						value={sp.get("sort") ?? "appliedAt"}
						onValueChange={(v) => update({ sort: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="appliedAt">
								{t("filters.sortField.appliedAt")}
							</Select.Item>
							<Select.Item value="company">
								{t("filters.sortField.company")}
							</Select.Item>
							<Select.Item value="createdAt">
								{t("filters.sortField.createdAt")}
							</Select.Item>
							<Select.Item value="updatedAt">
								{t("filters.sortField.updatedAt" as never)}
							</Select.Item>
						</Select.Content>
					</Select.Root>
				</Flex>
				<Flex direction="column" gap="1">
					<label style={{ fontSize: 12 }}>{t("filters.order")}</label>
					<Select.Root
						value={sp.get("order") ?? "desc"}
						onValueChange={(v) => update({ order: v })}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="desc">{t("filters.desc")}</Select.Item>
							<Select.Item value="asc">{t("filters.asc")}</Select.Item>
						</Select.Content>
					</Select.Root>
				</Flex>

				<Button
					variant="soft"
					color="gray"
					disabled={pending}
					onClick={() => startTransition(() => router.push("/applications"))}
				>
					{t("filters.reset")}
				</Button>
			</Flex>
		</Card>
	);
}
