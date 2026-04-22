"use client";

import {
	Card,
	Flex,
	Grid,
	Heading,
	TextArea,
	TextField,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { EnumSelect } from "../components/EnumSelect";
import { Field } from "../components/Field";
import { PRIORITIES, TRACKING_STATUSES } from "../constants";
import type { SectionProps } from "../types";

export function TrackingSection({ form }: SectionProps) {
	const t = useTranslations();
	const tForm = useTranslations("companyForm");
	const tFields = useTranslations("fields");
	const { values, fieldErrors, set, setNum } = form;

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Heading size="4">{tForm("sections.tracking")}</Heading>
				<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
					<Field label={tFields("rating")} error={fieldErrors.rating}>
						<TextField.Root
							type="number"
							min={1}
							max={5}
							value={
								values.rating === undefined || values.rating === null
									? ""
									: String(values.rating)
							}
							onChange={(e) => setNum("rating", e.target.value)}
							placeholder="1-5"
						/>
					</Field>
					<Field label={tFields("priority")} error={fieldErrors.priority}>
						<EnumSelect
							form={form}
							field="priority"
							options={PRIORITIES}
							translateKey={(v) => t(`priority.${v}` as never)}
						/>
					</Field>
					<Field
						label={tFields("trackingStatus")}
						error={fieldErrors.trackingStatus}
					>
						<EnumSelect
							form={form}
							field="trackingStatus"
							options={TRACKING_STATUSES}
							translateKey={(v) => t(`trackingStatus.${v}` as never)}
						/>
					</Field>
					<Field label={tFields("pros")} error={fieldErrors.pros} full>
						<TextArea
							value={values.pros ?? ""}
							onChange={(e) => set("pros", e.target.value)}
							placeholder={tForm("placeholders.pros")}
							rows={3}
						/>
					</Field>
					<Field label={tFields("cons")} error={fieldErrors.cons} full>
						<TextArea
							value={values.cons ?? ""}
							onChange={(e) => set("cons", e.target.value)}
							placeholder={tForm("placeholders.cons")}
							rows={3}
						/>
					</Field>
				</Grid>
			</Flex>
		</Card>
	);
}
