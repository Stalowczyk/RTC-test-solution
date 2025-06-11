import { describe, expect, it, vi } from "vitest";
import {
	parseAllLines,
	parseSimulationData,
	parseSimulationLine,
	parseStringToScores,
} from "../../src/utils/stateParser";

describe("parseSimulationData", () => {
	it("splits simulation string into individual lines", () => {
		const raw = {
			odds: "e06ea218-da07-42be-9016-c8bd5abdd592,f306b9a6-2757-4076-bcb6-562a5c5f7dfd,cdc9ffd2-6b1d-4d3f-a318-d347eb8d6910,1749427786936,eae40851-11a7-42c0-ab3b-30c539c91623,b44c3433-d058-4ddb-a192-929491e48b90,6e843915-f3b1-492e-9185-4318704385a0,0e022e3d-620f-430d-a0ba-460e5ad4b6eb@5:10|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10",
		};

		const parsedLines = parseSimulationData(raw);

		expect(parsedLines[0]).toEqual([
			"e06ea218-da07-42be-9016-c8bd5abdd592",
			"f306b9a6-2757-4076-bcb6-562a5c5f7dfd",
			"cdc9ffd2-6b1d-4d3f-a318-d347eb8d6910",
			"1749427786936",
			"eae40851-11a7-42c0-ab3b-30c539c91623",
			"b44c3433-d058-4ddb-a192-929491e48b90",
			"6e843915-f3b1-492e-9185-4318704385a0",
			"0e022e3d-620f-430d-a0ba-460e5ad4b6eb@5:10|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10",
		]);
	});
});

describe("parseStringToScores", () => {
	it("parses scores from a string to Score object", () => {
		const scores =
			"0e022e3d-620f-430d-a0ba-460e5ad4b6eb@5:10|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10";

		const parsedScores = parseStringToScores(scores);

		expect(parsedScores).toEqual([
			{ periodId: "0e022e3d-620f-430d-a0ba-460e5ad4b6eb", home: "5", away: "10" },
			{ periodId: "664507b3-f483-4f31-a8bc-2c56a13df6b2", home: "5", away: "10" },
		]);
	});

	it(`Logs error message when a part of input score string is a missing "@"`, () => {
		const malformedString =
			"0e022e3d-620f-430d-a0ba-460e5ad4b6eb5:10|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10";

		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(parseStringToScores(malformedString)).toEqual([
			{
				periodId: "664507b3-f483-4f31-a8bc-2c56a13df6b2",
				home: "5",
				away: "10",
			},
		]);

		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("missing '@'"));
		errorSpy.mockRestore();
	});

	it(`Logs error message when a part of input score string is a missing periodId`, () => {
		const malformedString = "@5:10|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10";
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(parseStringToScores(malformedString)).toEqual([
			{
				periodId: "664507b3-f483-4f31-a8bc-2c56a13df6b2",
				home: "5",
				away: "10",
			},
		]);
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Invalid score data empty periodId")
		);
		errorSpy.mockRestore();
	});

	it(`Logs error message when a part of input score string is a missing the score`, () => {
		const malformedString =
			"0e022e3d-620f-430d-a0ba-460e5ad4b6eb@|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10";
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(parseStringToScores(malformedString)).toEqual([
			{
				periodId: "664507b3-f483-4f31-a8bc-2c56a13df6b2",
				home: "5",
				away: "10",
			},
		]);
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Invalid score data empty score:")
		);
		errorSpy.mockRestore();
	});

	it(`Logs error message when a part of input score string is missing ":"`, () => {
		const malformedString =
			"0e022e3d-620f-430d-a0ba-460e5ad4b6eb@510|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10";

		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(parseStringToScores(malformedString)).toEqual([
			{
				periodId: "664507b3-f483-4f31-a8bc-2c56a13df6b2",
				home: "5",
				away: "10",
			},
		]);

		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("missing ':'"));
		errorSpy.mockRestore();
	});
});

describe("parseSimulationLine", () => {
	it("Converts parsed line into SimulationData object", () => {
		const line = [
			"e06ea218-da07-42be-9016-c8bd5abdd592", // sportEventId
			"f306b9a6-2757-4076-bcb6-562a5c5f7dfd", // sportId
			"cdc9ffd2-6b1d-4d3f-a318-d347eb8d6910", // competitionId
			"1749427786936", // startTime
			"eae40851-11a7-42c0-ab3b-30c539c91623", // homeCompetitorId
			"b44c3433-d058-4ddb-a192-929491e48b90", // awayCompetitorId
			"6e843915-f3b1-492e-9185-4318704385a0", // sportEventStatusId
			"0e022e3d-620f-430d-a0ba-460e5ad4b6eb@5:10|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10", // scores
		];

		expect(parseSimulationLine(line)).toEqual({
			sportEventId: "e06ea218-da07-42be-9016-c8bd5abdd592",
			sportId: "f306b9a6-2757-4076-bcb6-562a5c5f7dfd",
			competitionId: "cdc9ffd2-6b1d-4d3f-a318-d347eb8d6910",
			startTime: "1749427786936",
			homeCompetitorId: "eae40851-11a7-42c0-ab3b-30c539c91623",
			awayCompetitorId: "b44c3433-d058-4ddb-a192-929491e48b90",
			sportEventStatusId: "6e843915-f3b1-492e-9185-4318704385a0",
			scores: [
				{ periodId: "0e022e3d-620f-430d-a0ba-460e5ad4b6eb", home: "5", away: "10" },
				{ periodId: "664507b3-f483-4f31-a8bc-2c56a13df6b2", home: "5", away: "10" },
			],
		});
	});

	it("Logs an error when incoming line has more or less fields than the expected (8)", () => {
		const line = [
			"Additional field not included in the data Format",
			"e06ea218-da07-42be-9016-c8bd5abdd592", // sportEventId
			"f306b9a6-2757-4076-bcb6-562a5c5f7dfd", // sportId
			"cdc9ffd2-6b1d-4d3f-a318-d347eb8d6910", // competitionId
			"1749427786936", // startTime
			"eae40851-11a7-42c0-ab3b-30c539c91623", // homeCompetitorId
			"b44c3433-d058-4ddb-a192-929491e48b90", // awayCompetitorId
			"6e843915-f3b1-492e-9185-4318704385a0", // sportEventStatusId
			"0e022e3d-620f-430d-a0ba-460e5ad4b6eb@5:10|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10", // scores
		];
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		parseSimulationLine(line);

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Invalid line format, expected 8 fields")
		);
		errorSpy.mockRestore();
	});
});

describe("parseAllLines", () => {
	it("transforms all parsed lines into SimulationData objects", () => {
		const raw = {
			odds: "e06ea218-da07-42be-9016-c8bd5abdd592,f306b9a6-2757-4076-bcb6-562a5c5f7dfd,cdc9ffd2-6b1d-4d3f-a318-d347eb8d6910,1749427786936,eae40851-11a7-42c0-ab3b-30c539c91623,b44c3433-d058-4ddb-a192-929491e48b90,6e843915-f3b1-492e-9185-4318704385a0,0e022e3d-620f-430d-a0ba-460e5ad4b6eb@5:10|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10",
		};

		const parsedLines = parseSimulationData(raw);
		const transformedArr = parseAllLines(parsedLines);

		expect(transformedArr).toEqual([
			{
				sportEventId: "e06ea218-da07-42be-9016-c8bd5abdd592",
				sportId: "f306b9a6-2757-4076-bcb6-562a5c5f7dfd",
				competitionId: "cdc9ffd2-6b1d-4d3f-a318-d347eb8d6910",
				startTime: "1749427786936",
				homeCompetitorId: "eae40851-11a7-42c0-ab3b-30c539c91623",
				awayCompetitorId: "b44c3433-d058-4ddb-a192-929491e48b90",
				sportEventStatusId: "6e843915-f3b1-492e-9185-4318704385a0",
				scores: [
					{ periodId: "0e022e3d-620f-430d-a0ba-460e5ad4b6eb", home: "5", away: "10" },
					{ periodId: "664507b3-f483-4f31-a8bc-2c56a13df6b2", home: "5", away: "10" },
				],
			},
		]);
	});

	it("Logs an error when a line is malformed", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const invalidParsedLines = [["invalid-id-1", "invalid-id-2", "not-enough-fields"]];

		const result = parseAllLines(invalidParsedLines);

		expect(result).toEqual([]);

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Invalid line format, expected 8 fields")
		);

		errorSpy.mockRestore();
	});
});
