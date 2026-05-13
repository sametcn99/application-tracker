import type { CoverLetterFormInput } from "@/shared/schemas/cover-letter";
import { prisma } from "./prisma";

export async function listCoverLetters(userId: string) {
	return prisma.coverLetter.findMany({
		where: { userId },
		orderBy: { updatedAt: "desc" },
	});
}

export async function getCoverLetter(id: string, userId: string) {
	return prisma.coverLetter.findFirst({
		where: { id, userId },
	});
}

export async function createCoverLetter(
	userId: string,
	data: CoverLetterFormInput,
) {
	return prisma.coverLetter.create({
		data: { ...data, userId },
	});
}

export async function updateCoverLetter(
	id: string,
	userId: string,
	data: CoverLetterFormInput,
) {
	const letter = await prisma.coverLetter.findFirst({
		where: { id, userId },
	});
	if (!letter) return null;
	return prisma.coverLetter.update({
		where: { id },
		data,
	});
}

export async function deleteCoverLetter(id: string, userId: string) {
	const letter = await prisma.coverLetter.findFirst({
		where: { id, userId },
	});
	if (!letter) return false;
	await prisma.coverLetter.delete({ where: { id } });
	return true;
}
