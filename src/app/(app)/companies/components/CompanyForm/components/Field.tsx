"use client";

import { Box, Flex, Text } from "@radix-ui/themes";

type Props = {
	label: string;
	error?: string;
	full?: boolean;
	children: React.ReactNode;
};

export function Field({ label, error, full, children }: Props) {
	const content = (
		<Flex direction="column" gap="1">
			<Text size="1" color="gray">
				{label}
			</Text>
			{children}
			{error && (
				<Text size="1" color="red">
					{error}
				</Text>
			)}
		</Flex>
	);
	if (full) return <Box style={{ gridColumn: "1 / -1" }}>{content}</Box>;
	return content;
}
