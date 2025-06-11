import { describe, it, expect, vi, beforeEach } from "vitest";
import { MappingsFetcher } from "../../src/fetchers/mappingsFetcher";
import { StateManager } from "../../src/services/stateManager";

describe("MappingsFetcher", () => {
	let stateManager: StateManager;

	beforeEach(() => {
		stateManager = new StateManager({});
		vi.clearAllMocks();
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
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
			statusText: "404 Not Found",
		} as any);

		const service = new MappingsFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateMappings();

		expect(errorSpy).toHaveBeenCalledWith(
			"Failed to fetch mappings from http://fake-url: 404 Not Found"
		);

		fetchSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it("logs error if `mappings` field is missing or invalid", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({}),
		} as any);

		const service = new MappingsFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateMappings();

		expect(errorSpy).toHaveBeenCalledWith(
			"Invalid response from http://fake-url: 'mappings' field is missing or not a string"
		);

		fetchSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it("logs error if `mappings` field is not a string (e.g., number)", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ mappings: 123 }),
		} as any);

		const service = new MappingsFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateMappings();

		expect(errorSpy).toHaveBeenCalledWith(
			"Invalid response from http://fake-url: 'mappings' field is missing or not a string"
		);

		fetchSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it("logs fetch error on exception", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

		const service = new MappingsFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateMappings();

		expect(errorSpy).toHaveBeenCalledWith(
			"Error updating mappings from http://fake-url: network down"
		);

		fetchSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it("clears interval when stop is called", () => {
		const service = new MappingsFetcher(stateManager, "http://fake-url", 10000);
		const clearSpy = vi.spyOn(globalThis, "clearInterval");

		service.start();
		service.stop();

		expect(clearSpy).toHaveBeenCalled();
		clearSpy.mockRestore();
	});

	it("stop() does nothing if start was never called", () => {
		const service = new MappingsFetcher(stateManager, "http://fake-url", 10000);
		expect(() => service.stop()).not.toThrow();
	});

	it("fetches on interval trigger after start", async () => {
		vi.useFakeTimers();
		const fetchSpy = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ mappings: "1:One;" }),
		});
		vi.stubGlobal("fetch", fetchSpy);

		const service = new MappingsFetcher(stateManager, "http://fake-url", 50);
		service.start();

		vi.advanceTimersByTime(120);

		expect(fetchSpy).toHaveBeenCalledTimes(3);

		service.stop();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it("does not create multiple intervals on repeated start calls", () => {
		const service = new MappingsFetcher(stateManager, "http://fake-url", 10000);
		const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

		service.start();
		service.start();

		expect(setIntervalSpy).toHaveBeenCalledTimes(1);

		service.stop();
		setIntervalSpy.mockRestore();
	});

	it("handles empty mappings string", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ mappings: "" }),
		} as any);

		const updateSpy = vi.spyOn(stateManager, "updateMappings");

		const service = new MappingsFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateMappings();

		expect(updateSpy).toHaveBeenCalledWith({});
	});
});
