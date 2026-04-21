"use client";

import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import {
	Badge,
	Button,
	Card,
	Flex,
	IconButton,
	Text,
	TextField,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { formatCurrencyAmount } from "@/shared/lib/format";
import { convertViaUsd } from "@/shared/lib/reference-data";
import {
	createCurrencyAction,
	deleteCurrencyAction,
} from "../actions/currencies";

type CurrencyItem = {
	id: string;
	code: string;
	name: string;
	symbol: string | null;
	usdRate: number | null;
	rateSource: string | null;
	lastSyncedAt: Date | string | null;
	applicationsCount: number;
};

export function CurrencyManager({
	currencies,
}: {
	currencies: CurrencyItem[];
}) {
	const t = useTranslations();
	const tCurrencies = useTranslations("currencies");
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const tx = (key: string) => (key.includes(".") ? t(key as never) : key);

	return (
		<Flex direction="column" gap="4">
			<Card>
				<form
					ref={formRef}
					action={(formData) =>
						startTransition(async () => {
							const result = await createCurrencyAction(formData);
							if (!result.ok) {
								setError(tx(result.error));
								return;
							}

							setError(null);
							formRef.current?.reset();
						})
					}
				>
					<Flex direction="column" gap="2">
						<Flex gap="2" wrap="wrap" align="end">
							<Field width={120} label={tCurrencies("code")}>
								<TextField.Root
									name="code"
									placeholder={tCurrencies("codePlaceholder")}
									required
								/>
							</Field>
							<Field width={220} label={tCurrencies("name")}>
								<TextField.Root
									name="name"
									placeholder={tCurrencies("namePlaceholder")}
									required
								/>
							</Field>
							<Field width={120} label={tCurrencies("symbol")}>
								<TextField.Root
									name="symbol"
									placeholder={tCurrencies("symbolPlaceholder")}
								/>
							</Field>
							<Field width={140} label={tCurrencies("manualUsdRate")}>
								<TextField.Root
									type="number"
									step="0.0001"
									min="0"
									name="manualUsdRate"
									placeholder={tCurrencies("manualUsdRatePlaceholder")}
								/>
							</Field>
							<Button type="submit" disabled={pending}>
								<PlusIcon />
								{tCurrencies("addButton")}
							</Button>
						</Flex>
						<Text size="1" color="gray">
							{tCurrencies("manualRateHint")}
						</Text>
						{error && (
							<Text size="1" color="red">
								{error}
							</Text>
						)}
					</Flex>
				</form>
			</Card>

			{currencies.length === 0 ? (
				<Text color="gray">{tCurrencies("noCurrencies")}</Text>
			) : (
				<Flex direction="column" gap="2">
					{currencies.map((currency) => {
						const equivalents =
							currency.usdRate == null
								? []
								: currencies
										.filter(
											(item) =>
												item.code !== currency.code && item.usdRate != null,
										)
										.map((item) => ({
											code: item.code,
											amount: convertViaUsd(
												1,
												currency.usdRate!,
												item.usdRate!,
											),
										}));

						return (
							<Card key={currency.id}>
								<Flex direction="column" gap="2">
									<Flex align="center" justify="between" gap="3" wrap="wrap">
										<Flex direction="column" gap="1">
											<Flex align="center" gap="2" wrap="wrap">
												<Text weight="medium">{currency.code}</Text>
												<Text color="gray">{currency.name}</Text>
												{currency.symbol && (
													<Text color="gray">{currency.symbol}</Text>
												)}
												<Badge variant="soft">
													{currency.rateSource === "api"
														? tCurrencies("rateSourceApi")
														: currency.rateSource === "manual"
															? tCurrencies("rateSourceManual")
															: tCurrencies("rateSourceDefault")}
												</Badge>
											</Flex>
											<Text size="1" color="gray">
												{tCurrencies("applicationsCount", {
													count: currency.applicationsCount,
												})}
											</Text>
										</Flex>
										<IconButton
											size="1"
											variant="soft"
											color="red"
											disabled={pending}
											onClick={() => {
												if (
													confirm(
														tCurrencies("deleteConfirm", {
															code: currency.code,
														}),
													)
												) {
													startTransition(async () => {
														setError(null);
														await deleteCurrencyAction(currency.id);
													});
												}
											}}
										>
											<TrashIcon />
										</IconButton>
									</Flex>

									<Text size="2">
										1 {currency.code} ={" "}
										{formatCurrencyAmount(currency.usdRate, "USD")}
									</Text>

									{currency.lastSyncedAt && (
										<Text size="1" color="gray">
											{tCurrencies("lastSynced", {
												date: new Intl.DateTimeFormat("en-US", {
													dateStyle: "medium",
													timeStyle: "short",
												}).format(new Date(currency.lastSyncedAt)),
											})}
										</Text>
									)}

									{equivalents.length > 0 && (
										<Flex direction="column" gap="1">
											<Text size="1" color="gray">
												{tCurrencies("equivalents")}
											</Text>
											<Flex gap="2" wrap="wrap">
												{equivalents.map((equivalent) => (
													<Text size="1" key={equivalent.code}>
														{formatCurrencyAmount(
															equivalent.amount,
															equivalent.code,
														)}
													</Text>
												))}
											</Flex>
										</Flex>
									)}
								</Flex>
							</Card>
						);
					})}
				</Flex>
			)}
		</Flex>
	);
}

function Field({
	label,
	width,
	children,
}: {
	label: string;
	width: number;
	children: React.ReactNode;
}) {
	return (
		<Flex direction="column" gap="1" style={{ width, minWidth: width }}>
			<Text size="1" color="gray">
				{label}
			</Text>
			{children}
		</Flex>
	);
}
