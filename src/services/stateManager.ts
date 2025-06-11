import { InternalEvent, VisibleEvent } from "../types/event";
import { MappingDict } from "../types/mapping";
import { SimulationData } from "../types/simulation";
import { resolve } from "../utils/mappingsParser";

/**
 * Keeps track of sports events in memory
 *
 * Stores events by their Ids
 * Adds new events or updates existing ones when new data comes in
 * Marks events as removed if they disappear from the updates
 * Turns Ids into readable names using mappings
 * Lets you get all the current active events
 * Logs when an event’s status or score changes
 */
export class StateManager {
	private events: Map<string, InternalEvent> = new Map();
	constructor(private mappings: MappingDict) {}

	/**
	 * Updates the internal state with new simulation data
	 * Adds new events, updates existing ones, and marks missing events as removed
	 */
	public update(newData: SimulationData[]): void {
		const seenEventIds = new Set<string>();

		for (const entry of newData) {
			const id = entry.sportEventId;
			seenEventIds.add(id);

			const resolved = this.resolveEntry(entry);
			if (!resolved) continue;

			const existing = this.events.get(id);
			if (!existing) {
				this.events.set(id, resolved);
				continue;
			}

			this.logChanges(existing, resolved);
			this.events.set(id, resolved);
		}

		for (const id of this.events.keys()) {
			if (!seenEventIds.has(id)) {
				const ev = this.events.get(id);
				if (ev && !ev.removed) {
					ev.removed = true;
					ev.status = "REMOVED";
					this.events.set(id, ev);
				}
			}
		}
	}

	/**
	 * Returns an array of events excluding those marked as removed
	 */
	getVisibleState(): VisibleEvent[] {
		return Array.from(this.events.values())
			.filter((event) => !event.removed)
			.map(({ removed, ...visible }) => visible);
	}

	/**
	 * Returns the visible state in the external API format
	 */
	public getClientState(): Record<string, any> {
		const output: Record<string, any> = {};

		for (const event of this.getVisibleState()) {
			output[event.sportEventId] = {
				id: event.sportEventId,
				status: event.status,
				startTime: event.startTime,
				sport: event.sport,
				competition: event.competition,
				competitors: {
					HOME: { type: "HOME", name: event.homeCompetitor },
					AWAY: { type: "AWAY", name: event.awayCompetitor },
				},
				scores: {
					CURRENT: {
						type: "CURRENT",
						home: event.scores?.[event.scores.length - 1]?.home ?? "0",
						away: event.scores?.[event.scores.length - 1]?.away ?? "0",
					},
				},
			};
		}

		return output;
	}

	/**
	 * Resolves SimulationData entry to an InternalEvent by mapping Ids to strings
	 * Returns null if essential mappings or the startTime are invalid
	 */
	private resolveEntry(data: SimulationData): InternalEvent | null {
		const {
			sportEventId,
			sportId,
			competitionId,
			startTime,
			homeCompetitorId,
			awayCompetitorId,
			sportEventStatusId,
			scores,
		} = data;

		const sport = resolve(this.mappings, sportId);
		const competition = resolve(this.mappings, competitionId);
		const homeCompetitor = resolve(this.mappings, homeCompetitorId);
		const awayCompetitor = resolve(this.mappings, awayCompetitorId);
		const status = resolve(this.mappings, sportEventStatusId);

		if (!this.allDefined(sport, competition, homeCompetitor, awayCompetitor, status)) {
			console.error(`Skipping event ${sportEventId} due to missing mappings`);
			return null;
		}

		const parsedTime = new Date(Number(startTime));
		if (isNaN(parsedTime.getTime())) {
			console.error(`Invalid startTime for event ${sportEventId}`);
			return null;
		}

		return {
			sportEventId,
			sport,
			competition,
			startTime: parsedTime.toISOString(),
			homeCompetitor,
			awayCompetitor,
			status,
			scores,
		};
	}
	/**
	 * helper to check that all arguments are defined (not undefined or null)
	 */
	private allDefined(...args: (string | undefined | null)[]): boolean {
		return args.every((val) => val !== undefined && val !== null);
	}

	/**
	 * Logs changes between old and incoming event data
	 */
	private logChanges(oldEvent: InternalEvent, newEvent: InternalEvent): void {
		if (oldEvent.status !== newEvent.status) {
			console.log(
				`Status changed for event ${oldEvent.sportEventId}: ${oldEvent.status} → ${newEvent.status}`
			);
		}
		// Deep compare scores arrays by JSON.stringify, can be improved but good enough for now
		if (JSON.stringify(oldEvent.scores) !== JSON.stringify(newEvent.scores)) {
			console.log(`Score changed for event ${oldEvent.sportEventId}`);
		}
	}

	public updateMappings(newMappings: MappingDict): void {
		this.mappings = newMappings;
		console.log("StateManager mappings updated");
	}
}
