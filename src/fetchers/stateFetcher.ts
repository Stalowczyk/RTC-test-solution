import { StateManager } from "../services/stateManager";
import { parseAllLines, parseSimulationData } from "../utils/stateParser";

interface SimulationApiResponse {
	odds: string;
}

/**
 * Periodically fetches simulation state data from api/state
 * parses it and updates the internal StateManager.
 */
export class StateFetcher {
	private intervalId?: NodeJS.Timeout;
	private url: string;
	private updateIntervalMs: number;
	private stateManager: StateManager;

	constructor(stateManager: StateManager, url: string, updateIntervalMs = 1000) {
		this.stateManager = stateManager;
		this.url = url;
		this.updateIntervalMs = updateIntervalMs;
	}

	/** Fetches state from the API, parses response, and updates StateManager */
	async fetchAndUpdateState(): Promise<void> {
		try {
			const res = await fetch(this.url);
			if (!res.ok) {
				console.error(`Failed to fetch state from ${this.url}: ${res.statusText}`);
				return;
			}

			const json: SimulationApiResponse = await res.json();
			if (typeof json.odds !== "string") {
				console.error(`Invalid response from ${this.url}: 'odds' field is missing or not a string`);
				return;
			}

			const parsedRawLines = parseSimulationData(json);
			const simulationData = parseAllLines(parsedRawLines);

			this.stateManager.update(simulationData);
			console.log(`State updated at ${new Date().toISOString()}`);
		} catch (err) {
			console.error(`Error updating state from ${this.url}: ${(err as Error).message}`);
		}
	}

	start() {
		// prevents multiple intervals from running concurrently
		if (this.intervalId) {
			return;
		}
		this.fetchAndUpdateState();
		this.intervalId = setInterval(() => this.fetchAndUpdateState(), this.updateIntervalMs);
	}

	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
		}
	}
}
