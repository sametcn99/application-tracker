import { beforeEach, describe, expect, it } from "vitest";
import {
	parseAttachmentAllowListFromEnv,
	validateAttachmentFile,
} from "@/shared/lib/attachment-validation";

function fileFrom(name: string, type: string, content = "hello") {
	return new File([content], name, { type });
}

describe("attachment validation", () => {
	beforeEach(() => {
		delete process.env.UPLOAD_ALLOWED_MIME_TYPES;
		delete process.env.UPLOAD_ALLOWED_EXTENSIONS;
	});

	it("parses env allowlists with defaults", () => {
		expect(parseAttachmentAllowListFromEnv("a/b, c/d", ["x/y"])).toEqual([
			"a/b",
			"c/d",
		]);
		expect(parseAttachmentAllowListFromEnv(undefined, ["x/y"])).toEqual([
			"x/y",
		]);
	});

	it("accepts allowed plain text files", async () => {
		const file = fileFrom("note.txt", "text/plain");
		const result = await validateAttachmentFile(
			file,
			Buffer.from(await file.arrayBuffer()),
		);
		expect(result).toEqual({ ok: true, mimeType: "text/plain" });
	});

	it("rejects disallowed extensions", async () => {
		const file = fileFrom("script.sh", "text/plain");
		const result = await validateAttachmentFile(
			file,
			Buffer.from(await file.arrayBuffer()),
		);
		expect(result).toEqual({ ok: false, error: "attachments.invalidType" });
	});
});
