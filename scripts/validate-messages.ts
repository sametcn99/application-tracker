import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Ajv, { type AnySchema } from "ajv";

export type MessageValidationResult = {
	filePath: string;
	valid: boolean;
	errors: string[];
};

async function readJson(filePath: string) {
	return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

export async function validateMessageFile(
	filePath: string,
	schemaPath = path.join(process.cwd(), "messages", "messages.schema.json"),
): Promise<MessageValidationResult> {
	const schema = (await readJson(schemaPath)) as AnySchema;
	const catalog = await readJson(filePath);
	const ajv = new Ajv({ allErrors: true, strict: false });
	const validate = ajv.compile(schema);
	const valid = validate(catalog) === true;

	return {
		filePath,
		valid,
		errors:
			validate.errors?.map((error) => {
				const location = error.instancePath || "/";
				return `${location} ${error.message ?? "is invalid"}`;
			}) ?? [],
	};
}

export async function validateMessageCatalogs(messagesDir = "messages") {
	const schemaPath = path.join(
		process.cwd(),
		messagesDir,
		"messages.schema.json",
	);
	const entries = await readdir(path.join(process.cwd(), messagesDir));
	const catalogPaths = entries
		.filter(
			(entry) => entry.endsWith(".json") && entry !== "messages.schema.json",
		)
		.map((entry) => path.join(process.cwd(), messagesDir, entry));

	return Promise.all(
		catalogPaths.map((catalogPath) =>
			validateMessageFile(catalogPath, schemaPath),
		),
	);
}

async function main() {
	const results = await validateMessageCatalogs();
	let hasFailure = false;

	for (const result of results) {
		if (result.valid) {
			console.log(`Validated ${path.relative(process.cwd(), result.filePath)}`);
			continue;
		}

		hasFailure = true;
		console.error(`Invalid ${path.relative(process.cwd(), result.filePath)}`);
		for (const error of result.errors) {
			console.error(`  - ${error}`);
		}
	}

	if (hasFailure) {
		process.exitCode = 1;
	}
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
	void main();
}
