import type { CompanyFormInput } from "../../actions/companies.schema";

export type FieldErrors = Record<string, string | undefined>;

export type FormBag = {
	values: CompanyFormInput;
	fieldErrors: FieldErrors;
	set: <K extends keyof CompanyFormInput>(
		key: K,
		value: CompanyFormInput[K],
	) => void;
	setNum: (key: keyof CompanyFormInput, raw: string) => void;
};

export type SectionProps = {
	form: FormBag;
};
