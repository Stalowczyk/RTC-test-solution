import { describe, expect, it, vi } from "vitest";
import { parseMappings } from "../../src/utils/mappingsParser";
import { StateManager } from "../../src/services/stateManager";
import { SimulationData } from "../../src/types/simulation";

const rawMappingStr =
	"d1aced6e-391a-4636-900d-1872de60b560:Real Madrid;2e59e2a8-c469-4acf-9ad9-ee25b63bd20f:Barcelona;6e843915-f3b1-492e-9185-4318704385a0:ONGOING;faf7ca6a-59b1-4b34-9f50-0712b79f2d57:REMOVED;";

const mappings = parseMappings(rawMappingStr);

const initialData: SimulationData[] = [
	{
		sportEventId: "event-1",
		sportId: "d1aced6e-391a-4636-900d-1872de60b560",
		competitionId: "2e59e2a8-c469-4acf-9ad9-ee25b63bd20f",
		startTime: "1686000000000",
		homeCompetitorId: "d1aced6e-391a-4636-900d-1872de60b560",
		awayCompetitorId: "2e59e2a8-c469-4acf-9ad9-ee25b63bd20f",
		sportEventStatusId: "6e843915-f3b1-492e-9185-4318704385a0", // ONGOING
		scores: [{ periodId: "p1", home: "1", away: "0" }],
	},
];

const updatedData: SimulationData[] = [
	{
		sportEventId: "event-1",
		sportId: "d1aced6e-391a-4636-900d-1872de60b560",
		competitionId: "2e59e2a8-c469-4acf-9ad9-ee25b63bd20f",
		startTime: "1686000000000",
		homeCompetitorId: "d1aced6e-391a-4636-900d-1872de60b560",
		awayCompetitorId: "2e59e2a8-c469-4acf-9ad9-ee25b63bd20f",
		sportEventStatusId: "faf7ca6a-59b1-4b34-9f50-0712b79f2d57", // REMOVED
		scores: [{ periodId: "p1", home: "2", away: "1" }],
	},
	{
		sportEventId: "event-2",
		sportId: "d1aced6e-391a-4636-900d-1872de60b560",
		competitionId: "2e59e2a8-c469-4acf-9ad9-ee25b63bd20f",
		startTime: "1686100000000",
		homeCompetitorId: "d1aced6e-391a-4636-900d-1872de60b560",
		awayCompetitorId: "2e59e2a8-c469-4acf-9ad9-ee25b63bd20f",
		sportEventStatusId: "6e843915-f3b1-492e-9185-4318704385a0", // ONGOING
		scores: [{ periodId: "p1", home: "0", away: "0" }],
	},
];

describe("StateManager", () => {
	it("stores initial events and returns visible state", () => {
		const sm = new StateManager(mappings);
		sm.update(initialData);

		const visible = sm.getVisibleState();
		expect(visible.length).toBe(1);
		expect(visible[0]).toMatchObject({
			sportEventId: "event-1",
			sport: "Real Madrid",
			competition: "Barcelona",
			homeCompetitor: "Real Madrid",
			awayCompetitor: "Barcelona",
			status: "ONGOING",
			scores: [{ periodId: "p1", home: "1", away: "0" }],
		});
	});

	it("updates events and logs changes", () => {
		const sm = new StateManager(mappings);
		sm.update(initialData);

		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		sm.update(updatedData);

		expect(consoleLogSpy).toHaveBeenCalledWith(
			"Status changed for event event-1: ONGOING → REMOVED"
		);
		expect(consoleLogSpy).toHaveBeenCalledWith("Score changed for event event-1");

		const allEvents = sm.getVisibleState();

		expect(allEvents.find((ev) => ev.sportEventId === "event-1")).toBeDefined();

		expect(allEvents.find((ev) => ev.sportEventId === "event-2")).toBeDefined();

		consoleLogSpy.mockRestore();
	});

	it("marks events as removed if missing from update", () => {
		const sm = new StateManager(mappings);
		sm.update(updatedData);

		sm.update([
			{
				sportEventId: "event-2",
				sportId: "d1aced6e-391a-4636-900d-1872de60b560",
				competitionId: "2e59e2a8-c469-4acf-9ad9-ee25b63bd20f",
				startTime: "1686100000000",
				homeCompetitorId: "d1aced6e-391a-4636-900d-1872de60b560",
				awayCompetitorId: "2e59e2a8-c469-4acf-9ad9-ee25b63bd20f",
				sportEventStatusId: "6e843915-f3b1-492e-9185-4318704385a0",
				scores: [{ periodId: "p1", home: "0", away: "0" }],
			},
		]);

		const event1 = sm.getVisibleState().find((ev) => ev.sportEventId === "event-1");
		expect(event1).toBeUndefined();

		const internalEvent1 = (sm as any).events.get("event-1");
		expect(internalEvent1).toBeDefined();
		expect(internalEvent1.removed).toBe(true);
		expect(internalEvent1.status).toBe("REMOVED");
	});

	it("does not log changes if nothing changed", () => {
		const sm = new StateManager(mappings);
		sm.update(initialData);

		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		sm.update(initialData);

		expect(consoleLogSpy).not.toHaveBeenCalled();
		consoleLogSpy.mockRestore();
	});

	it("skips events with missing mappings", () => {
		const brokenMappings = parseMappings(
			"d1aced6e-391a-4636-900d-1872de60b560:Real Madrid;" +
				"6e843915-f3b1-492e-9185-4318704385a0:ONGOING;"
		);

		const sm = new StateManager(brokenMappings);

		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		sm.update(initialData);

		expect(sm.getVisibleState()).toEqual([]);

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Skipping event event-1 due to missing mappings")
		);

		errorSpy.mockRestore();
	});

	it("skips events with invalid startTime", () => {
		const sm = new StateManager(mappings);

		const dataWithBadTime: SimulationData[] = [
			{
				sportEventId: "bad-time-event",
				sportId: "d1aced6e-391a-4636-900d-1872de60b560",
				competitionId: "2e59e2a8-c469-4acf-9ad9-ee25b63bd20f",
				startTime: "not-a-timestamp",
				homeCompetitorId: "d1aced6e-391a-4636-900d-1872de60b560",
				awayCompetitorId: "2e59e2a8-c469-4acf-9ad9-ee25b63bd20f",
				sportEventStatusId: "6e843915-f3b1-492e-9185-4318704385a0",
				scores: [{ periodId: "p1", home: "0", away: "0" }],
			},
		];

		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		sm.update(dataWithBadTime);

		expect(sm.getVisibleState()).toEqual([]);
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Invalid startTime for event bad-time-event")
		);

		errorSpy.mockRestore();
	});
	it("updates mappings via updateMappings()", () => {
		const initialMappings = parseMappings("1:One;2:Two;");
		const newMappings = parseMappings("1:NewOne;2:NewTwo;");

		const sm = new StateManager(initialMappings);

		const sampleEvent: SimulationData[] = [
			{
				sportEventId: "e1",
				sportId: "1",
				competitionId: "2",
				startTime: "1686000000000",
				homeCompetitorId: "1",
				awayCompetitorId: "2",
				sportEventStatusId: "2",
				scores: [],
			},
		];

		sm.update(sampleEvent);
		expect(sm.getVisibleState()[0]).toMatchObject({
			sport: "One",
			competition: "Two",
		});

		sm.updateMappings(newMappings);
		sm.update(sampleEvent);

		expect(sm.getVisibleState()[0]).toMatchObject({
			sport: "NewOne",
			competition: "NewTwo",
		});
	});
});
