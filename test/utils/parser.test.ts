import { describe, expect, it } from "vitest";
import { parseSimulationData } from "../../src/utils/parser";

describe("Parser", () => {
	it("splits simulation string into individual lines", () => {
		const raw = {
			odds: "a,b,c\n1,2,3\nx,y,z",
		};
		const parsedLines = parseSimulationData(raw);
		expect(parsedLines).toEqual([
			["a", "b", "c"],
			["1", "2", "3"],
			["x", "y", "z"],
		]);
	});
});
