import { describe, expect, it, vi } from "vitest";
import { parseSimulationData, parseStringToScores } from "../../src/utils/parser";

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
			{ competitorId: "0e022e3d-620f-430d-a0ba-460e5ad4b6eb", score: "5:10" },
			{ competitorId: "664507b3-f483-4f31-a8bc-2c56a13df6b2", score: "5:10" },
		]);
	});

	it(`Logs error message when a part of input score string is a missing "@"`, () => {
		const malformedString =
			"0e022e3d-620f-430d-a0ba-460e5ad4b6eb5:10|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10";

		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(parseStringToScores(malformedString)).toEqual([
			{
				competitorId: "664507b3-f483-4f31-a8bc-2c56a13df6b2",
				score: "5:10",
			},
		]);

		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("missing '@'"));
		errorSpy.mockRestore();
	});

	it(`Logs error message when a part of input score string is a missing competitorId`, () => {
		const malformedString = "@5:10|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10";
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(parseStringToScores(malformedString)).toEqual([
			{
				competitorId: "664507b3-f483-4f31-a8bc-2c56a13df6b2",
				score: "5:10",
			},
		]);
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Invalid score data empty competitorId:")
		);
		errorSpy.mockRestore();
	});

	it(`Logs error message when a part of input score string is a missing the score`, () => {
		const malformedString =
			"0e022e3d-620f-430d-a0ba-460e5ad4b6eb@|664507b3-f483-4f31-a8bc-2c56a13df6b2@5:10";
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(parseStringToScores(malformedString)).toEqual([
			{
				competitorId: "664507b3-f483-4f31-a8bc-2c56a13df6b2",
				score: "5:10",
			},
		]);
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Invalid score data empty score:")
		);
		errorSpy.mockRestore();
	});
});
