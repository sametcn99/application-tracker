import { Flex, Heading, Text } from "@radix-ui/themes";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";
import { CoverLetterManager } from "./components/CoverLetterManager";

export default async function CoverLettersPage() {
	const session = await auth();
	const userId = session?.user?.id;
	const t = await getTranslations();

	const coverLetters = userId
		? await prisma.coverLetter.findMany({
				where: { userId },
				orderBy: { updatedAt: "desc" },
			})
		: [];

	return (
		<Flex direction="column" gap="4">
			<Flex direction="column" gap="1">
				<Heading>{t("coverLetters.title")}</Heading>
				<Text size="2" color="gray">
					{t("coverLetters.subtitle")}
				</Text>
			</Flex>
			<CoverLetterManager coverLetters={coverLetters} />
		</Flex>
	);
}
