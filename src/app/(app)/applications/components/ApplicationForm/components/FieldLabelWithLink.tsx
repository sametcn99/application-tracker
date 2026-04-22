import { Flex, Text } from "@radix-ui/themes";
import Link from "next/link";

export function FieldLabelWithLink({
	label,
	href,
	linkLabel,
}: {
	label: string;
	href: string;
	linkLabel: string;
}) {
	return (
		<Flex align="center" justify="between" gap="3">
			<Text as="span" size="2" weight="medium">
				{label}
			</Text>
			<Link href={href} style={{ fontSize: 12 }}>
				{linkLabel}
			</Link>
		</Flex>
	);
}
