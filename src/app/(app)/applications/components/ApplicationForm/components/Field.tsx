import { Box, Text } from "@radix-ui/themes";
import type React from "react";

export function Field({
	label,
	error,
	children,
}: {
	label: React.ReactNode;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<Box>
			{typeof label === "string" ? (
				<Text
					as="label"
					size="2"
					weight="medium"
					style={{ display: "block", marginBottom: 4 }}
				>
					{label}
				</Text>
			) : (
				<Box style={{ marginBottom: 4 }}>{label}</Box>
			)}
			{children}
			{error && (
				<Text size="1" color="red" style={{ marginTop: 4, display: "block" }}>
					{error}
				</Text>
			)}
		</Box>
	);
}
