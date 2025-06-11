import { describe, it, expect, vi, beforeEach } from "vitest";
import { StateFetcher } from "../../src/fetchers/stateFetcher";
import { StateManager } from "../../src/services/stateManager";

vi.mock("../../src/utils/stateParser.ts", async () => {
	return {
		parseSimulationData: vi.fn().mockReturnValue(["raw1", "raw2"]),
		parseAllLines: vi.fn().mockReturnValue([{ sportEventId: "123" }]),
	};
});

describe("StateFetcher", () => {
	let stateManager: StateManager;

	beforeEach(() => {
		stateManager = new StateManager({});
		vi.clearAllMocks();
	});

	it("fetches and updates state successfully", async () => {
		const mockResponse = {
			ok: true,
			json: vi.fn().mockResolvedValue({ odds: "some-odds-data" }),
		};

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as any);
		const updateSpy = vi.spyOn(stateManager, "update");

		const service = new StateFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateState();

		expect(fetchSpy).toHaveBeenCalledWith("http://fake-url");
		expect(updateSpy).toHaveBeenCalledWith([{ sportEventId: "123" }]);

		fetchSpy.mockRestore();
	});

	it("logs error if response is not ok", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
			statusText: "Service Unavailable",
		} as any);

		const service = new StateFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateState();

		expect(errorSpy).toHaveBeenCalledWith(
			"Failed to fetch state from http://fake-url: Service Unavailable"
		);

		fetchSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it("logs error if `odds` field is missing", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ wrongField: "no-odds" }),
		} as any);

		const service = new StateFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateState();

		expect(errorSpy).toHaveBeenCalledWith(
			"Invalid response from http://fake-url: 'odds' field is missing or not a string"
		);

		fetchSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it("logs fetch error on exception", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("server down"));

		const service = new StateFetcher(stateManager, "http://fake-url");
		await service.fetchAndUpdateState();

		expect(errorSpy).toHaveBeenCalledWith("Error updating state from http://fake-url: server down");

		fetchSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it("clears interval when stop is called", () => {
		const service = new StateFetcher(stateManager, "http://fake-url", 1000);
		const clearSpy = vi.spyOn(globalThis, "clearInterval");

		service.start();
		service.stop();

		expect(clearSpy).toHaveBeenCalled();

		clearSpy.mockRestore();
	});

	it("stop() does nothing if start was never called", () => {
		const service = new StateFetcher(stateManager, "http://fake-url", 1000);
		expect(() => service.stop()).not.toThrow();
	});

	it("fetches on interval trigger after start", async () => {
		vi.useFakeTimers();
		const fetchSpy = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ odds: "some-odds" }),
		});
		vi.stubGlobal("fetch", fetchSpy);

		const service = new StateFetcher(stateManager, "http://fake-url", 50);
		service.start();

		vi.advanceTimersByTime(100);

		expect(fetchSpy).toHaveBeenCalledTimes(3);

		service.stop();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it("does not create multiple intervals on repeated start calls", () => {
		const service = new StateFetcher(stateManager, "http://fake-url", 10000);
		const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

		service.start();
		service.start();

		expect(setIntervalSpy).toHaveBeenCalledTimes(1);

		service.stop();
		setIntervalSpy.mockRestore();
	});

	it("returns properly transformed data", () => {
		const mockEvent = {
			sportEventId: "abc-123",
			status: "LIVE",
			startTime: "2025-06-11T20:00:00.000Z",
			sport: "FOOTBALL",
			competition: "UEFA Champions League",
			homeCompetitor: "Chelsea",
			awayCompetitor: "Liverpool",
			scores: [
				{ periodId: "1", home: "1", away: "0" },
				{ periodId: "2", home: "2", away: "1" },
			],
		};

		const stateManager = new StateManager({});
		(stateManager as any).events.set("abc-123", { ...mockEvent, removed: false });

		const result = stateManager.getClientState();

		expect(result).toEqual({
			"abc-123": {
				id: "abc-123",
				status: "LIVE",
				startTime: "2025-06-11T20:00:00.000Z",
				sport: "FOOTBALL",
				competition: "UEFA Champions League",
				competitors: {
					HOME: { type: "HOME", name: "Chelsea" },
					AWAY: { type: "AWAY", name: "Liverpool" },
				},
				scores: {
					CURRENT: { type: "CURRENT", home: "2", away: "1" },
				},
			},
		});
	});
});
