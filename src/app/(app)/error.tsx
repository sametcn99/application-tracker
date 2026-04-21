"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button, Callout, Flex, Heading } from "@radix-ui/themes";
import { useTranslations } from "next-intl";

export default function ErrorBoundary({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const t = useTranslations();
	return (
		<Flex direction="column" gap="3" align="start" p="5">
			<Heading size="5">{t("errors.generic")}</Heading>
			<Callout.Root color="red">
				<Callout.Icon>
					<ExclamationTriangleIcon />
				</Callout.Icon>
				<Callout.Text>
					{t("errors.occurred", { message: error.message })}
				</Callout.Text>
			</Callout.Root>
			<Button onClick={() => reset()}>{t("common.tryAgain")}</Button>
		</Flex>
	);
}
