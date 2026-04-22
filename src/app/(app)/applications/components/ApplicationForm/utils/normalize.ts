export function normalizeCompanyName(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, " ");
}
