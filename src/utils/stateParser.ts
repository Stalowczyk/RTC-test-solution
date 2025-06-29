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
				console.error(`Invalid score format missing '@': "${entry}"`);
				return null;
			}

			const periodId = parts[0].trim();
			const score = parts[1].trim();

			if (!periodId) {
				console.error(`Invalid score data empty periodId: "${entry}"`);
				return null;
			}
			if (!score) {
				console.error(`Invalid score data empty score: "${entry}"`);
				return null;
			}

			const [home, away] = score.split(":");
			if (home === undefined || away === undefined) {
				console.error(`Invalid score format missing ':': "${score}"`);
				return null;
			}

			return { periodId, home, away };
		})
		.filter((score): score is Score => score !== null);
}

/**
 * Parses a single line into a SimulationData object
 */
export function parseSimulationLine(line: string[]): SimulationData | null {
	if (line.length < 7) {
		console.error(`Invalid line format, expected at least 7 fields, got ${line.length}`);
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
		// If score field exists we use it else empty array
		scores: line[7] ? parseStringToScores(line[7]) : [],
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
