"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type {
	CurrencyOptionRecord,
	SourceOptionRecord,
} from "@/shared/lib/reference-data.shared";
import {
	type ApplicationFormInput,
	applicationFormSchema,
} from "@/shared/schemas/application";
import type { FormApi } from "../types";

type Args = {
	mode: "create" | "edit";
	defaultValues?: Partial<ApplicationFormInput>;
	selectedTagIds: string[];
	sources: SourceOptionRecord[];
	currencies: CurrencyOptionRecord[];
};

export type ApplicationFormState = {
	form: FormApi;
	sourceOptions: SourceOptionRecord[];
	currencyOptions: CurrencyOptionRecord[];
	selectedCurrency: CurrencyOptionRecord | undefined;
	showReferralField: boolean;
	showOutcomeField: boolean;
	showWorkAuthorizationNote: boolean;
};

export function useApplicationFormState({
	mode,
	defaultValues,
	selectedTagIds,
	sources,
	currencies,
}: Args): ApplicationFormState {
	const initialCurrencyCode =
		mode === "create"
			? (defaultValues?.currency ??
				currencies.find((currency) => currency.isDefault)?.code ??
				"USD")
			: defaultValues?.currency;

	const form = useForm<ApplicationFormInput>({
		// biome-ignore lint/suspicious/noExplicitAny: using any to force zodResolver to accept our schema
		resolver: zodResolver(applicationFormSchema as any) as any,
		defaultValues: {
			company: "",
			position: "",
			location: "",
			workMode: "REMOTE",
			employmentType: "FULL_TIME",
			priority: "MEDIUM",
			status: "APPLIED",
			appliedAt: new Date().toISOString().slice(0, 10) as unknown as Date,
			tagIds: selectedTagIds,
			...defaultValues,
			currency: initialCurrencyCode,
		},
	});

	const { watch } = form;

	const sourceOptions = useMemo(() => {
		const options = [...sources];
		if (
			defaultValues?.source &&
			!options.some((source) => source.name === defaultValues.source)
		) {
			options.unshift({
				id: "__legacy_source__",
				name: defaultValues.source,
			});
		}
		return options;
	}, [sources, defaultValues?.source]);

	const currencyOptions = useMemo(() => {
		const options = [...currencies];
		if (
			defaultValues?.currency &&
			!options.some((currency) => currency.code === defaultValues.currency)
		) {
			options.unshift({
				id: "__legacy_currency__",
				code: defaultValues.currency,
				name: defaultValues.currency,
				symbol: null,
				isDefault: false,
				usdRate: null,
				rateSource: "legacy",
				lastSyncedAt: null,
			});
		}
		return options;
	}, [currencies, defaultValues?.currency]);

	const currentCurrency = watch("currency");
	const selectedCurrency = currencyOptions.find(
		(currency) => currency.code === currentCurrency,
	);
	const selectedSourceType = watch("sourceType");
	const referralName = watch("referralName");
	const selectedStatus = watch("status");
	const selectedOutcomeReason = watch("outcomeReason");
	const selectedNeedsSponsorship = watch("needsSponsorship");
	const workAuthorizationNote = watch("workAuthorizationNote");

	const showReferralField =
		selectedSourceType === "REFERRAL" || Boolean(referralName);
	const showOutcomeField =
		selectedStatus === "REJECTED" ||
		selectedStatus === "WITHDRAWN" ||
		Boolean(selectedOutcomeReason);
	const showWorkAuthorizationNote =
		selectedNeedsSponsorship === true || Boolean(workAuthorizationNote);

	return {
		form,
		sourceOptions,
		currencyOptions,
		selectedCurrency,
		showReferralField,
		showOutcomeField,
		showWorkAuthorizationNote,
	};
}
