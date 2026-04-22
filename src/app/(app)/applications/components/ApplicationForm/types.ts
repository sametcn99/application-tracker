import type { UseFormReturn } from "react-hook-form";
import type {
	CurrencyOptionRecord,
	SourceOptionRecord,
} from "@/shared/lib/reference-data.shared";
import type { ApplicationFormInput } from "@/shared/schemas/application";

export type Tag = { id: string; name: string; color: string };

export type CompanyOption = {
	id: string;
	name: string;
	normalizedName: string;
	website: string | null;
	careersUrl: string | null;
	linkedinUrl: string | null;
	location: string | null;
	industry: string | null;
	companySize: string | null;
};

export type ApplicationFormProps = {
	mode: "create" | "edit";
	applicationId?: string;
	defaultValues?: Partial<ApplicationFormInput>;
	selectedTagIds?: string[];
	tags: Tag[];
	sources: SourceOptionRecord[];
	currencies: CurrencyOptionRecord[];
	companies: CompanyOption[];
};

export type FormApi = UseFormReturn<ApplicationFormInput>;

export type SectionBaseProps = {
	form: FormApi;
};
