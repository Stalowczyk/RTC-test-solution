import { describe, it, expect, vi, beforeEach } from "vitest";
import { MappingsFetcher } from "../../src/fetchers/mappingsFetcher";
import { StateManager } from "../../src/services/stateManager";

describe("MappingService", () => {
	let stateManager: StateManager;

	beforeEach(() => {
		stateManager = new StateManager({});
	});

	it("fetches and updates mappings successfully", async () => {
		const fakeMappings = "1:Uno;2:Dos;";
		const mockResponse = {
			ok: true,
			json: vi.fn().mockResolvedValue({ mappings: fakeMappings }),
		};

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as any);
		const updateSpy = vi.spyOn(stateManager, "updateMappings");

		const service = new MappingsFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateMappings();

		expect(fetchSpy).toHaveBeenCalledWith("http://fake-url");
		expect(updateSpy).toHaveBeenCalledWith({
			"1": "Uno",
			"2": "Dos",
		});

		fetchSpy.mockRestore();
	});

	it("logs error if response is not ok", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
			statusText: "404 Not Found",
		} as any);

		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const service = new MappingsFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateMappings();

		expect(errorSpy).toHaveBeenCalledWith(
			"Error updating mappings: Failed to fetch mappings: 404 Not Found"
		);

		fetchSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it("logs error if mappings field is missing", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({}),
		} as any);

		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const service = new MappingsFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateMappings();

		expect(errorSpy).toHaveBeenCalledWith(
			"Invalid response: `mappings` field is missing or not a string"
		);

		fetchSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it("logs fetch error on exception", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const service = new MappingsFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateMappings();

		expect(errorSpy).toHaveBeenCalledWith("Error updating mappings: network down");

		fetchSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it("clears interval when stop is called", async () => {
		const service = new MappingsFetcher(stateManager, "http://fake-url", 10000);

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ mappings: "1:One;" }),
		} as any);

		const clearSpy = vi.spyOn(globalThis, "clearInterval");

		service.start();
		service.stop();

		expect(clearSpy).toHaveBeenCalled();

		fetchSpy.mockRestore();
		clearSpy.mockRestore();
	});

	it("fetches on interval trigger after start", async () => {
		const fetchSpy = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ mappings: "1:One;" }),
		});
		vi.stubGlobal("fetch", fetchSpy);

		const service = new MappingsFetcher(stateManager, "http://fake-url", 50);
		service.start();

		await new Promise((resolve) => setTimeout(resolve, 70));

		service.stop();

		expect(fetchSpy).toHaveBeenCalledTimes(2);

		vi.unstubAllGlobals();
	});

	it("does not create multiple intervals on repeated start calls", async () => {
		const service = new MappingsFetcher(stateManager, "http://fake-url", 10000);
		const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

		service.start();
		service.start();

		expect(setIntervalSpy).toHaveBeenCalledTimes(2);

		service.stop();
		setIntervalSpy.mockRestore();
	});
});
