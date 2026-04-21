import { Flex, Spinner } from "@radix-ui/themes";

export default function Loading() {
	return (
		<Flex align="center" justify="center" p="8">
			<Spinner size="3" />
		</Flex>
	);
}
