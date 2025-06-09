import { Score } from "../types/simulation";

interface SimulationRawData {
	odds: string;
}

/**
 * Parses a raw simulation string into an array of string arrays
 * Splits by newline and comma, trims spaces and filters out empty values
 */
export function parseSimulationData(raw: SimulationRawData): string[][] {
	const lines = raw.odds.trim().split("\n");
	const parsedLines = lines.map((line) =>
		line
			.split(",")
			.map((val) => val.trim())
			.filter((val) => val !== "")
	);
	return parsedLines;
}

/**
 * Parses a score string into an array of Score objects
 */
export function parseStringToScores(str: string): Score[] {
	return str
		.trim()
		.split("|")
		.map((entry) => {
			const parts = entry.split("@");
			if (parts.length !== 2) {
				console.error(`Invalid score format (missing '@'): "${entry}"`);
				return null;
			}

			const competitorId = parts[0].trim();
			const score = parts[1].trim();

			if (!competitorId) {
				console.error(`Invalid score data empty competitorId: "${entry}"`);
				return null;
			}
			if (!score) {
				console.error(`Invalid score data empty score: "${entry}"`);
				return null;
			}

			return { competitorId, score };
		})
		.filter((score): score is Score => score !== null);
}
