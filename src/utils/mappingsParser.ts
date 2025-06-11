import { MappingDict } from "../types/mapping";

/**
 * Parses raw mapping string into a dictionary
 */
export function parseMappings(str: string): MappingDict {
	const result: MappingDict = {};

	const entries = str.split(";").filter((entry) => entry.trim().length > 0);

	entries.forEach((entry) => {
		const parts = entry.split(":");
		if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
			console.error(`Invalid mapping entry skipped: ${entry}`);
			return;
		}
		const [id, value] = parts.map((p) => p.trim());
		result[id] = value;
	});

	return result;
}

/**
 * Resolves a value from dictionary using Id
 * Returns undefined if Id not found
 */
export function resolve(mapping: MappingDict, id: string): string {
	const value = mapping[id];
	if (!value) {
		console.error(`Mapping for Id "${id}" not found`);
	}
	return value;
}
