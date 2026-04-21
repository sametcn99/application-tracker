import { Flex } from "@radix-ui/themes";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./components/LoginForm";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ callbackUrl?: string }>;
}) {
	const session = await auth();
	if (session?.user) redirect("/");
	const sp = await searchParams;
	return (
		<Flex align="center" justify="center" style={{ minHeight: "100vh" }} p="4">
			<LoginForm callbackUrl={sp.callbackUrl ?? "/"} />
		</Flex>
	);
}
