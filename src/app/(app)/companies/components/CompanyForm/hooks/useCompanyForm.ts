"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
	createCompanyAction,
	updateCompanyAction,
} from "../../../actions/companies";
import type { CompanyFormInput } from "../../../actions/companies.schema";
import { emptyDefaults } from "../defaults";
import type { FieldErrors } from "../types";

type Mode = "create" | "edit";

export type UseCompanyFormParams = {
	mode: Mode;
	companyId?: string;
	defaultValues?: Partial<CompanyFormInput>;
};

export function useCompanyForm({
	mode,
	companyId,
	defaultValues,
}: UseCompanyFormParams) {
	const router = useRouter();
	const t = useTranslations();
	const tCompanies = useTranslations("companies");
	const [pending, startTransition] = useTransition();
	const [topError, setTopError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [values, setValues] = useState<CompanyFormInput>({
		...emptyDefaults(),
		...(defaultValues ?? {}),
	});

	const tx = (key?: string) =>
		!key ? undefined : key.includes(".") ? t(key as never) : key;

	const set = <K extends keyof CompanyFormInput>(
		key: K,
		value: CompanyFormInput[K],
	) => setValues((prev) => ({ ...prev, [key]: value }));

	const setNum = (key: keyof CompanyFormInput, raw: string) => {
		if (raw === "") {
			setValues((prev) => ({ ...prev, [key]: undefined }));
			return;
		}
		const n = Number(raw);
		setValues((prev) => ({
			...prev,
			[key]: Number.isFinite(n) ? n : undefined,
		}));
	};

	const submit = () => {
		setTopError(null);
		setFieldErrors({});
		startTransition(async () => {
			const result =
				mode === "edit" && companyId
					? await updateCompanyAction(companyId, values)
					: await createCompanyAction(values);
			if (!result.ok) {
				if (result.error === "company_exists") {
					setTopError(tCompanies("alreadyExists"));
					return;
				}
				if ("fieldErrors" in result && result.fieldErrors) {
					const errs: FieldErrors = {};
					for (const [k, v] of Object.entries(result.fieldErrors)) {
						errs[k] = tx((v as string[] | undefined)?.[0]);
					}
					setFieldErrors(errs);
					return;
				}
				setTopError(t("errors.generic"));
				return;
			}
			router.push(`/companies/${result.id}`);
			router.refresh();
		});
	};

	return {
		router,
		pending,
		topError,
		form: { values, fieldErrors, set, setNum },
		submit,
	};
}
