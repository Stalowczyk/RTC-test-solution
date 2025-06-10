import { describe, expect, it, vi } from "vitest";
import { parseMappings, resolve } from "../../src/services/mappings";
import { MappingDict } from "../../src/types/mapping";

describe("parseMappings", () => {
	it("should return empty object on empty string", () => {
		expect(parseMappings("")).toEqual({});
	});

	it("should parse valid mappings string into dictionary", () => {
		const raw =
			"6593ca5c-ba19-4ece-8bdc-71b44fcf1ca0:Real Madrid;2b2090b3-4a3b-4ad0-b21f-0b5eb93952c2:Barcelona;6bfac381-d406-43f8-b8cf-2914c239f7be:Manchester United";
		expect(parseMappings(raw)).toEqual({
			"6593ca5c-ba19-4ece-8bdc-71b44fcf1ca0": "Real Madrid",
			"2b2090b3-4a3b-4ad0-b21f-0b5eb93952c2": "Barcelona",
			"6bfac381-d406-43f8-b8cf-2914c239f7be": "Manchester United",
		});
	});
	it("should skip entries with missing or empty ID/value", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const raw = ["   :", "valid-id:", ":valid value", "   :   ", "good-id:Good Value"].join(";");

		const result = parseMappings(raw);

		expect(result).toEqual({
			"good-id": "Good Value",
		});
		expect(errorSpy).toHaveBeenCalledTimes(4);
		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid mapping entry skipped"));

		errorSpy.mockRestore();
	});
});

describe("resolve", () => {
	const mapping: MappingDict = {
		"6593ca5c-ba19-4ece-8bdc-71b44fcf1ca0": "Real Madrid",
		"2b2090b3-4a3b-4ad0-b21f-0b5eb93952c2": "Barcelona",
	};

	it("should return the correct value for known ID", () => {
		expect(resolve(mapping, "6593ca5c-ba19-4ece-8bdc-71b44fcf1ca0")).toBe("Real Madrid");
	});

	it("logs error when mapping Id is not found", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const result = resolve(mapping, "unknown-id");

		expect(result).toBeUndefined();
		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Mapping for Id "));

		errorSpy.mockRestore();
	});
});
