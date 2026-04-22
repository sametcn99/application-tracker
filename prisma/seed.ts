/**
 * Idempotent admin seed. Reads ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME
 * from env. Run with: `bun run db:seed`.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
		{ name: "javascript", color: "yellow" },
		{ name: "nodejs", color: "green" },
		{ name: "frontend", color: "cyan" },
		{ name: "backend", color: "amber" },
		{ name: "fullstack", color: "violet" },
		{ name: "remote", color: "green" },
		{ name: "hybrid", color: "blue" },
		{ name: "onsite", color: "red" },
		{ name: "senior", color: "amber" },
		{ name: "startup", color: "pink" },
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

	const currencySeeds = [
		{ code: "USD", name: "US Dollar", symbol: "$" },
		{ code: "EUR", name: "Euro", symbol: "€" },
		{ code: "GBP", name: "British Pound", symbol: "£" },
		{ code: "TRY", name: "Turkish Lira", symbol: "₺" },
		{ code: "CAD", name: "Canadian Dollar", symbol: "C$" },
		{ code: "AUD", name: "Australian Dollar", symbol: "A$" },
		{ code: "CHF", name: "Swiss Franc", symbol: "CHF" },
		{ code: "JPY", name: "Japanese Yen", symbol: "¥" },
		{ code: "SEK", name: "Swedish Krona", symbol: "kr" },
		{ code: "PLN", name: "Polish Zloty", symbol: "zl" },
	] as const;

	for (const currency of currencySeeds) {
		const isDefaultCurrency = currency.code === "USD";
		const usdRate = isDefaultCurrency
			? 1
			: await fetchUsdRateForSeed(currency.code);
		const rateSource = isDefaultCurrency
			? "default"
			: usdRate != null
				? "api"
				: null;
		const lastSyncedAt =
			!isDefaultCurrency && usdRate != null ? new Date() : null;

		await prisma.currencyOption.upsert({
			where: { code: currency.code },
			update: {
				name: currency.name,
				symbol: currency.symbol,
				usdRate,
				rateSource,
				lastSyncedAt,
			},
			create: {
				code: currency.code,
				name: currency.name,
				symbol: currency.symbol,
				isDefault: isDefaultCurrency,
				usdRate,
				rateSource,
				lastSyncedAt,
			},
		});
	}

	const defaultCurrencyCount = await prisma.currencyOption.count({
		where: { isDefault: true },
	});
	if (defaultCurrencyCount === 0) {
		await prisma.currencyOption.update({
			where: { code: "USD" },
			data: { isDefault: true },
		});
	}
	console.log(`✓ ${currencySeeds.length} currencies ready`);

	await backfillCompanies();
}

function normalizeCompanyName(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, " ");
}

async function fetchUsdRateForSeed(code: string): Promise<number | null> {
	try {
		const response = await fetch(
			`https://api.frankfurter.app/latest?from=${encodeURIComponent(code)}&to=USD`,
			{ cache: "no-store" },
		);

		if (!response.ok) {
			return null;
		}

		const payload = (await response.json()) as {
			rates?: Record<string, number>;
		};
		const rate = Number(payload.rates?.USD);
		return Number.isFinite(rate) && rate > 0 ? rate : null;
	} catch {
		return null;
	}
}

async function backfillCompanies() {
	const apps = await prisma.application.findMany({
		where: { companyId: null },
		select: { id: true, company: true, industry: true, companySize: true },
	});

	if (apps.length === 0) {
		console.log("✓ companies backfill: nothing to do");
		return;
	}

	let created = 0;
	let linked = 0;
	for (const app of apps) {
		const rawName = (app.company ?? "").trim();
		if (!rawName) continue;
		const normalized = normalizeCompanyName(rawName);

		let company = await prisma.company.findUnique({
			where: { normalizedName: normalized },
		});
		if (!company) {
			company = await prisma.company.create({
				data: {
					name: rawName,
					normalizedName: normalized,
					industry: app.industry ?? null,
					companySize: app.companySize ?? null,
				},
			});
			await prisma.companyActivityEntry.create({
				data: {
					companyId: company.id,
					type: "BOOTSTRAPPED_FROM_APPLICATION",
				},
			});
			created++;
		}
		await prisma.application.update({
			where: { id: app.id },
			data: { companyId: company.id },
		});
		await prisma.companyActivityEntry.create({
			data: {
				companyId: company.id,
				type: "LINKED_APPLICATION",
				comment: app.id,
			},
		});
		linked++;
	}

	console.log(
		`✓ companies backfill: created ${created}, linked ${linked} applications`,
	);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
