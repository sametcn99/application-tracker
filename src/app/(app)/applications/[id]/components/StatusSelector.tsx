"use client";

import { Select } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { updateStatusAction } from "@/shared/actions/applications";
import { STATUSES } from "@/shared/constants/application";

type StatusSelectorProps =
	| {
			applicationId: string;
			status: string;
	  }
	| {
			id: string;
			value: string;
	  };

export function StatusSelector(props: StatusSelectorProps) {
	const t = useTranslations();
	const [pending, startTransition] = useTransition();
	const applicationId =
		"applicationId" in props ? props.applicationId : props.id;
	const status = "status" in props ? props.status : props.value;

	return (
		<Select.Root
			value={status}
			disabled={pending}
			onValueChange={(v) =>
				startTransition(() =>
					updateStatusAction(applicationId, v).then(() => {}),
				)
			}
		>
			<Select.Trigger />
			<Select.Content>
				{STATUSES.map((s) => (
					<Select.Item key={s} value={s}>
						{t(("status." + s) as never)}
					</Select.Item>
				))}
			</Select.Content>
		</Select.Root>
	);
}
