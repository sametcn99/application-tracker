import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { getDatabaseUrl } from "./database-url";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

const pool = new Pool({ connectionString: getDatabaseUrl() });
const adapter = new PrismaPg(pool);

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
		adapter,
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
