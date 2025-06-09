import { Score, SimulationData } from "../types/simulation";

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

/**
 * Parses a single line into a SimulationData object
 */
export function parseSimulationLine(line: string[]): SimulationData | null {
	if (line.length !== 8) {
		console.error(`Invalid line format, expected 8 fields, got ${line.length}`);
		return null;
	}

	return {
		sportEventId: line[0],
		sportId: line[1],
		competitionId: line[2],
		startTime: line[3],
		homeCompetitorId: line[4],
		awayCompetitorId: line[5],
		sportEventStatusId: line[6],
		scores: parseStringToScores(line[7]),
	};
}

/**
 * Converts parsed lines array into array of SimulationData objects
 */
export function parseAllLines(parsedLines: string[][]): SimulationData[] {
	return parsedLines
		.map(parseSimulationLine)
		.filter((data): data is SimulationData => data !== null);
}
