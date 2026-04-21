import { Box, Flex } from "@radix-ui/themes";
import { auth } from "@/auth";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export async function AppShell({ children }: { children: React.ReactNode }) {
	const session = await auth();

	// Create an object that matches the UserProps interface exactly
	const user = session?.user
		? {
				name: session.user.name,
				email: session.user.email,
				image: session.user.image,
			}
		: undefined;

	return (
		<Flex style={{ minHeight: "100vh" }} align="start">
			<Box
				display={{ initial: "none", md: "block" }}
				style={{ position: "sticky", top: 0, height: "100vh" }}
			>
				<Sidebar user={user} />
			</Box>
			<Flex direction="column" style={{ flex: 1, minWidth: 0, width: "100%" }}>
				<Box display={{ initial: "block", md: "none" }}>
					<Header userEmail={session?.user?.email} />
				</Box>
				<Box p={{ initial: "4", md: "5" }} style={{ flex: 1 }}>
					{children}
				</Box>
			</Flex>
		</Flex>
	);
}
