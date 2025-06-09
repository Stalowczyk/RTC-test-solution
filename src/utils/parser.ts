interface SimulationRawData {
	odds: string;
}

export function parseSimulationData(raw: SimulationRawData): string[][] {
	const lines = raw.odds.trim().split("\n"); // remove trailing space then split into rows
	const parsedLines = lines.map(
		(line) =>
			line
				.split(",") // split line on comma into sepearte values
				.map((val) => val.trim()) // remove trailing spaces in each value
				.filter((val) => val !== "") // filter empty values
	);
	return parsedLines;
}
