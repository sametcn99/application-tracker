"use client";

import { Button, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { type LoginState, loginAction } from "../actions/login";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
	const t = useTranslations();
	const [state, formAction, pending] = useActionState<LoginState, FormData>(
		loginAction,
		null,
	);

	const errorMessage = state?.error
		? state.error.includes(".")
			? t(state.error as never)
			: state.error
		: null;

	return (
		<Card size="4" style={{ width: "100%", maxWidth: 400 }}>
			<form action={formAction}>
				<Flex direction="column" gap="4">
					<Flex direction="column" gap="1">
						<Heading size="6">{t("login.title")}</Heading>
						<Text size="2" color="gray">
							{t("login.subtitle")}
						</Text>
					</Flex>
					<input type="hidden" name="callbackUrl" value={callbackUrl} />

					<Flex direction="column" gap="1">
						<Text as="label" size="2" weight="medium" htmlFor="email">
							{t("auth.email")}
						</Text>
						<TextField.Root
							id="email"
							name="email"
							type="email"
							placeholder="admin@example.com"
							required
							autoComplete="email"
						/>
					</Flex>

					<Flex direction="column" gap="1">
						<Text as="label" size="2" weight="medium" htmlFor="password">
							{t("auth.password")}
						</Text>
						<TextField.Root
							id="password"
							name="password"
							type="password"
							required
							autoComplete="current-password"
						/>
					</Flex>

					{errorMessage && (
						<Text size="2" color="red">
							{errorMessage}
						</Text>
					)}

					<Button type="submit" size="3" disabled={pending}>
						{pending ? t("login.loggingIn") : t("login.submit")}
					</Button>
				</Flex>
			</form>
		</Card>
	);
}
