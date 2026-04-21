import { Box, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { getTranslations } from "next-intl/server";
import {
	formatCurrencyAmount,
	formatDate,
	formatDateTime,
	formatSalary,
} from "@/shared/lib/format";
import {
	type CurrencyOptionRecord,
	convertViaUsd,
} from "@/shared/lib/reference-data";

type App = {
	company: string;
	position: string;
	listingDetails: string | null;
	location: string | null;
	workMode: string;
	employmentType: string;
	salaryMin: number | null;
	salaryMax: number | null;
	currency: string | null;
	source: string | null;
	jobUrl: string | null;
	appliedAt: Date;
	contactName: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	notes: string | null;
	nextStepAt: Date | null;
	nextStepNote: string | null;
};

export async function ApplicationDetails({
	app,
	currencies,
}: {
	app: App;
	currencies: CurrencyOptionRecord[];
}) {
	const t = await getTranslations();
	const activeCurrency = app.currency
		? currencies.find((currency) => currency.code === app.currency)
		: undefined;
	const conversions =
		activeCurrency?.usdRate != null
			? currencies
					.filter(
						(currency) =>
							currency.code !== app.currency && currency.usdRate != null,
					)
					.map((currency) => ({
						code: currency.code,
						min:
							app.salaryMin == null
								? null
								: convertViaUsd(
										app.salaryMin,
										activeCurrency.usdRate!,
										currency.usdRate!,
									),
						max:
							app.salaryMax == null
								? null
								: convertViaUsd(
										app.salaryMax,
										activeCurrency.usdRate!,
										currency.usdRate!,
									),
					}))
			: [];

	return (
		<Flex direction="column" gap="4">
			<Card>
				<Heading size="3" mb="2">
					{t("applicationDetail.details.overview")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "2" }} gap="3">
					<Field label={t("fields.company")} value={app.company} />
					<Field label={t("fields.position")} value={app.position} />
					<Field label={t("fields.source")} value={app.source ?? "—"} />
					<Field label={t("fields.location")} value={app.location ?? "—"} />
					<Field
						label={t("fields.workMode")}
						value={t(("workMode." + app.workMode) as never)}
					/>
					<Field
						label={t("fields.employmentType")}
						value={t(("employmentType." + app.employmentType) as never)}
					/>
					<Field
						label={t("fields.appliedAt")}
						value={formatDate(app.appliedAt)}
					/>
				</Grid>
			</Card>

			<Card>
				<Heading size="3" mb="2">
					{t("applicationDetail.details.salary")}
				</Heading>
				<Field
					label={t("fields.salaryMin") + " / " + t("fields.salaryMax")}
					value={formatSalary(app.salaryMin, app.salaryMax, app.currency)}
				/>
				{conversions.length > 0 && (
					<Flex direction="column" gap="1" mt="3">
						<Text size="1" color="gray">
							{t("applicationDetail.salaryConversions")}
						</Text>
						{conversions.map((conversion) => (
							<Text size="2" key={conversion.code}>
								{conversion.min != null && conversion.max != null
									? `${formatCurrencyAmount(conversion.min, conversion.code)} - ${formatCurrencyAmount(conversion.max, conversion.code)}`
									: conversion.min != null
										? `${formatCurrencyAmount(conversion.min, conversion.code)}+`
										: `≤ ${formatCurrencyAmount(conversion.max, conversion.code)}`}
							</Text>
						))}
					</Flex>
				)}
			</Card>

			<Card>
				<Heading size="3" mb="2">
					{t("applicationDetail.details.listingDetails")}
				</Heading>
				{app.listingDetails ? (
					<Text style={{ whiteSpace: "pre-wrap" }}>{app.listingDetails}</Text>
				) : (
					<Text color="gray">{t("applicationDetail.noListingDetails")}</Text>
				)}
			</Card>

			<Card>
				<Heading size="3" mb="2">
					{t("applicationDetail.details.contact")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "3" }} gap="3">
					<Field
						label={t("fields.contactName")}
						value={app.contactName ?? "—"}
					/>
					<Field
						label={t("fields.contactEmail")}
						value={app.contactEmail ?? "—"}
					/>
					<Field
						label={t("fields.contactPhone")}
						value={app.contactPhone ?? "—"}
					/>
				</Grid>
			</Card>

			<Card>
				<Heading size="3" mb="2">
					{t("applicationDetail.details.nextStep")}
				</Heading>
				<Grid columns={{ initial: "1", sm: "2" }} gap="3">
					<Field
						label={t("fields.nextStepAt")}
						value={app.nextStepAt ? formatDateTime(app.nextStepAt) : "—"}
					/>
					<Field
						label={t("fields.nextStepNote")}
						value={app.nextStepNote ?? "—"}
					/>
				</Grid>
			</Card>

			{app.jobUrl && (
				<Card>
					<Heading size="3" mb="2">
						{t("applicationDetail.details.links")}
					</Heading>
					<a href={app.jobUrl} target="_blank" rel="noreferrer">
						{t("applicationDetail.details.openJobUrl")}
					</a>
				</Card>
			)}

			<Card>
				<Heading size="3" mb="2">
					{t("applicationDetail.details.notes")}
				</Heading>
				{app.notes ? (
					<Text style={{ whiteSpace: "pre-wrap" }}>{app.notes}</Text>
				) : (
					<Text color="gray">{t("applicationDetail.noNotes")}</Text>
				)}
			</Card>
		</Flex>
	);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<Box>
			<Text size="1" color="gray">
				{label}
			</Text>
			<Text size="2" style={{ display: "block" }}>
				{value}
			</Text>
		</Box>
	);
}
