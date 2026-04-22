"use client";

import { Select } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { CompanyFormInput } from "../../../actions/companies.schema";
import { NONE_VALUE } from "../constants";
import type { FormBag } from "../types";

type Props = {
	form: FormBag;
	field: keyof CompanyFormInput;
	options: readonly string[];
	translateKey: (v: string) => string;
};

export function EnumSelect({ form, field, options, translateKey }: Props) {
	const t = useTranslations();
	return (
		<Select.Root
			value={(form.values[field] as string) || NONE_VALUE}
			onValueChange={(v) =>
				form.set(
					field,
					(v === NONE_VALUE ? "" : v) as CompanyFormInput[typeof field],
				)
			}
		>
			<Select.Trigger />
			<Select.Content>
				<Select.Item value={NONE_VALUE}>
					{t("applicationForm.notSpecified")}
				</Select.Item>
				{options.map((o) => (
					<Select.Item key={o} value={o}>
						{translateKey(o)}
					</Select.Item>
				))}
			</Select.Content>
		</Select.Root>
	);
}
