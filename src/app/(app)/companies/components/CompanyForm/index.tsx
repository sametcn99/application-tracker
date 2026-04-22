"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button, Callout, Flex } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { CompanyFormInput } from "../../actions/companies.schema";
import { useCompanyForm } from "./hooks/useCompanyForm";
import { BusinessSection } from "./sections/BusinessSection";
import { ContactSection } from "./sections/ContactSection";
import { CultureSection } from "./sections/CultureSection";
import { IdentitySection } from "./sections/IdentitySection";
import { LinksSection } from "./sections/LinksSection";
import { LocationSection } from "./sections/LocationSection";
import { NotesSection } from "./sections/NotesSection";
import { TrackingSection } from "./sections/TrackingSection";

type Props = {
	mode: "create" | "edit";
	companyId?: string;
	defaultValues?: Partial<CompanyFormInput>;
};

export function CompanyForm({ mode, companyId, defaultValues }: Props) {
	const t = useTranslations();
	const { router, pending, topError, form, submit } = useCompanyForm({
		mode,
		companyId,
		defaultValues,
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<Flex direction="column" gap="4">
				{topError && (
					<Callout.Root color="red">
						<Callout.Icon>
							<ExclamationTriangleIcon />
						</Callout.Icon>
						<Callout.Text>{topError}</Callout.Text>
					</Callout.Root>
				)}

				<IdentitySection form={form} />
				<LocationSection form={form} />
				<LinksSection form={form} />
				<BusinessSection form={form} />
				<CultureSection form={form} />
				<ContactSection form={form} />
				<TrackingSection form={form} />
				<NotesSection form={form} />

				<Flex gap="3" justify="end">
					<Button
						type="button"
						variant="soft"
						onClick={() => router.back()}
						disabled={pending}
					>
						{t("common.cancel")}
					</Button>
					<Button type="submit" disabled={pending}>
						{pending
							? t("applicationForm.saving")
							: mode === "edit"
								? t("applicationForm.saveUpdate")
								: t("applicationForm.saveCreate")}
					</Button>
				</Flex>
			</Flex>
		</form>
	);
}
