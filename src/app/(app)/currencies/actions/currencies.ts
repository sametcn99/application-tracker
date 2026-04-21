"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeCurrencyCode } from "@/shared/lib/currencies";
import { prisma } from "@/shared/lib/prisma";
import { fetchUsdRateForCurrency } from "@/shared/lib/reference-data";

const currencySchema = z.object({
	code: z
		.string()
		.trim()
		.min(1, "validation.required")
		.max(10, "validation.tooLong"),
	name: z
		.string()
		.trim()
		.min(1, "validation.required")
		.max(100, "validation.tooLong"),
	symbol: z
		.string()
		.trim()
		.max(10, "validation.tooLong")
		.optional()
		.transform((value) => (value && value !== "" ? value : undefined)),
	manualUsdRate: z.preprocess((value) => {
		if (value === "" || value === undefined || value === null) return undefined;
		const numericValue = typeof value === "string" ? Number(value) : value;
		return Number.isFinite(numericValue) ? numericValue : value;
	}, z.number().positive("validation.invalidNumber").optional()),
});

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateReferencePaths() {
	revalidatePath("/currencies");
	revalidatePath("/applications/new");
	revalidatePath("/applications/[id]/edit", "page");
	revalidatePath("/applications/[id]", "page");
}

export async function createCurrencyAction(
	formData: FormData,
): Promise<ActionResult> {
	const parsed = currencySchema.safeParse({
		code: formData.get("code"),
		name: formData.get("name"),
		symbol: formData.get("symbol"),
		manualUsdRate: formData.get("manualUsdRate"),
	});

	if (!parsed.success) {
		const fieldErrors = parsed.error.flatten().fieldErrors;
		return {
			ok: false,
			error:
				fieldErrors.code?.[0] ??
				fieldErrors.name?.[0] ??
				fieldErrors.symbol?.[0] ??
				fieldErrors.manualUsdRate?.[0] ??
				"validation.invalid",
		};
	}

	const code = normalizeCurrencyCode(parsed.data.code);
	const apiUsdRate = code === "USD" ? 1 : await fetchUsdRateForCurrency(code);
	const usdRate = apiUsdRate ?? parsed.data.manualUsdRate;

	if (usdRate == null) {
		return { ok: false, error: "currencies.manualRateRequired" };
	}

	await prisma.currencyOption.upsert({
		where: { code },
		update: {
			name: parsed.data.name,
			symbol: parsed.data.symbol ?? null,
			usdRate,
			rateSource:
				code === "USD" ? "default" : apiUsdRate != null ? "api" : "manual",
			lastSyncedAt: apiUsdRate != null ? new Date() : null,
		},
		create: {
			code,
			name: parsed.data.name,
			symbol: parsed.data.symbol ?? null,
			usdRate,
			rateSource:
				code === "USD" ? "default" : apiUsdRate != null ? "api" : "manual",
			lastSyncedAt: apiUsdRate != null ? new Date() : null,
		},
	});

	revalidateReferencePaths();
	return { ok: true };
}

export async function deleteCurrencyAction(id: string): Promise<void> {
	await prisma.currencyOption.delete({ where: { id } });
	revalidateReferencePaths();
}
