"use client";

import { Button, Callout, Flex, Text, TextField } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import {
	changePasswordAction,
	updatePreferencesAction,
} from "../actions/settings";

type ActionState = {
	ok?: boolean;
	error?: string;
	fieldErrors?: Record<string, string[] | undefined>;
};

function message(t: ReturnType<typeof useTranslations>, key?: string) {
	if (!key) return null;
	return key.includes(".") ? t(key as never) : key;
}

function formErrorMessage(t: ReturnType<typeof useTranslations>, key?: string) {
	if (!key) return null;
	if (key === "invalid_data")
		return "Review the highlighted fields before saving.";
	return message(t, key);
}

function FieldError({ errors }: { errors?: string[] }) {
	const t = useTranslations();
	if (!errors?.length) return null;
	return (
		<Text size="1" color="red">
			{message(t, errors[0])}
		</Text>
	);
}

function FieldGroup({
	htmlFor,
	label,
	hint,
	errors,
	children,
}: {
	htmlFor: string;
	label: string;
	hint?: string | null;
	errors?: string[];
	children: React.ReactNode;
}) {
	return (
		<Flex direction="column" gap="1">
			<Text as="label" size="2" weight="medium" htmlFor={htmlFor}>
				{label}
			</Text>
			{children}
			{hint ? (
				<Text size="1" color="gray">
					{hint}
				</Text>
			) : null}
			<FieldError errors={errors} />
		</Flex>
	);
}

export function ChangePasswordForm() {
	const t = useTranslations();
	const [state, formAction, pending] = useActionState<ActionState, FormData>(
		changePasswordAction,
		{},
	);

	return (
		<form action={formAction}>
			<Flex direction="column" gap="4">
				{state.error && !state.ok ? (
					<Callout.Root color="red">
						<Callout.Text>{formErrorMessage(t, state.error)}</Callout.Text>
					</Callout.Root>
				) : null}

				<FieldGroup
					htmlFor="currentPassword"
					label={t("settings.currentPassword")}
					errors={state.fieldErrors?.currentPassword}
				>
					<TextField.Root
						id="currentPassword"
						name="currentPassword"
						type="password"
						autoComplete="current-password"
						required
					/>
				</FieldGroup>

				<FieldGroup
					htmlFor="newPassword"
					label={t("settings.newPassword")}
					hint={t("settings.passwordPolicy")}
					errors={state.fieldErrors?.newPassword}
				>
					<TextField.Root
						id="newPassword"
						name="newPassword"
						type="password"
						autoComplete="new-password"
						required
					/>
				</FieldGroup>

				<FieldGroup
					htmlFor="confirmPassword"
					label={t("settings.confirmPassword")}
					errors={state.fieldErrors?.confirmPassword}
				>
					<TextField.Root
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						autoComplete="new-password"
						required
					/>
				</FieldGroup>

				{state.ok && (
					<Callout.Root color="green">
						<Callout.Text>{t("settings.passwordUpdated")}</Callout.Text>
					</Callout.Root>
				)}

				<Button type="submit" disabled={pending} size="3">
					{pending ? t("common.loading") : t("settings.changePassword")}
				</Button>
			</Flex>
		</form>
	);
}

export function PreferencesForm({
	locale,
	timeZone,
	defaultCurrencyCode,
}: {
	locale: string;
	timeZone: string;
	defaultCurrencyCode: string;
}) {
	const t = useTranslations();
	const [state, formAction, pending] = useActionState<ActionState, FormData>(
		updatePreferencesAction,
		{},
	);

	return (
		<form action={formAction}>
			<Flex direction="column" gap="4">
				{state.error && !state.ok ? (
					<Callout.Root color="red">
						<Callout.Text>{formErrorMessage(t, state.error)}</Callout.Text>
					</Callout.Root>
				) : null}

				<FieldGroup
					htmlFor="locale"
					label={t("settings.locale")}
					hint={t("settings.localeHint")}
					errors={state.fieldErrors?.locale}
				>
					<TextField.Root id="locale" name="locale" defaultValue={locale} />
				</FieldGroup>

				<FieldGroup
					htmlFor="timeZone"
					label={t("settings.timeZone")}
					hint={t("settings.timeZoneHint")}
					errors={state.fieldErrors?.timeZone}
				>
					<TextField.Root
						id="timeZone"
						name="timeZone"
						defaultValue={timeZone}
					/>
				</FieldGroup>

				<FieldGroup
					htmlFor="defaultCurrencyCode"
					label={t("settings.defaultCurrency")}
					hint={t("settings.defaultCurrencyHint")}
					errors={state.fieldErrors?.defaultCurrencyCode}
				>
					<TextField.Root
						id="defaultCurrencyCode"
						name="defaultCurrencyCode"
						defaultValue={defaultCurrencyCode}
						maxLength={3}
					/>
				</FieldGroup>

				{state.ok && (
					<Callout.Root color="green">
						<Callout.Text>{t("settings.preferencesUpdated")}</Callout.Text>
					</Callout.Root>
				)}

				<Button type="submit" disabled={pending} size="3">
					{pending ? t("common.loading") : t("settings.savePreferences")}
				</Button>
			</Flex>
		</form>
	);
}
