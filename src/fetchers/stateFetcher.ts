import { StateManager } from "../services/stateManager";
import { parseAllLines, parseSimulationData } from "../utils/stateParser";

interface SimulationApiResponse {
	odds: string;
}

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

	async fetchAndUpdateState(): Promise<void> {
		try {
			const res = await fetch(this.url);
			if (!res.ok) console.error(`Failed to fetch state: ${res.statusText}`);

			const json: SimulationApiResponse = await res.json();
			if (typeof json.odds !== "string") {
				console.error("Invalid response: `odds` field is missing or not a string");
				return;
			}

			const parsedRawLines = parseSimulationData(json);
			const simulationData = parseAllLines(parsedRawLines);

			this.stateManager.update(simulationData);
			console.log(`State updated at ${new Date().toISOString()}`);
		} catch (err) {
			console.error(`Error updating state: ${(err as Error).message}`);
		}
	}

	start() {
		this.fetchAndUpdateState();
		this.intervalId = setInterval(() => this.fetchAndUpdateState(), this.updateIntervalMs);
	}

	stop() {
		if (this.intervalId) clearInterval(this.intervalId);
	}
}
