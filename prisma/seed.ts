/**
 * Idempotent admin seed. Reads ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME
 * from env. Run with: `bun run db:seed`.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	const email = process.env.ADMIN_EMAIL;
	const password = process.env.ADMIN_PASSWORD;
	const name = process.env.ADMIN_NAME ?? "Admin";

	if (!email || !password) {
		throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
	}

	const passwordHash = await bcrypt.hash(password, 10);

	const user = await prisma.user.upsert({
		where: { email },
		update: { name },
		create: { email, passwordHash, name },
	});

	console.log(`✓ Admin user ready: ${user.email}`);

	const tagSeeds = [
		{ name: "react", color: "blue" },
		{ name: "typescript", color: "indigo" },
		{ name: "nextjs", color: "gray" },
		{ name: "remote", color: "green" },
		{ name: "senior", color: "orange" },
	];

	for (const t of tagSeeds) {
		await prisma.tag.upsert({
			where: { name: t.name },
			update: {},
			create: t,
		});
	}
	console.log(`✓ ${tagSeeds.length} tags ready`);

	const sourceSeeds = [
		"LinkedIn",
		"Indeed",
		"Company Website",
		"Referral",
		"Other",
	];

	for (const name of sourceSeeds) {
		await prisma.sourceOption.upsert({
			where: { name },
			update: {},
			create: { name },
		});
	}
	console.log(`✓ ${sourceSeeds.length} sources ready`);

	await prisma.currencyOption.upsert({
		where: { code: "USD" },
		update: {
			name: "US Dollar",
			symbol: "$",
			usdRate: 1,
			rateSource: "default",
		},
		create: {
			code: "USD",
			name: "US Dollar",
			symbol: "$",
			usdRate: 1,
			rateSource: "default",
		},
	});
	console.log("✓ default currency ready");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
