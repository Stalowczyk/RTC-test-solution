import { parseMappings } from "../services/mappings";
import { StateManager } from "../services/state";

export class MappingsFetcher {
	private intervalId?: NodeJS.Timeout;
	private url: string;
	private updateIntervalMs: number;
	private stateManager: StateManager;

	constructor(stateManager: StateManager, url: string, updateIntervalMs = 60_000) {
		this.stateManager = stateManager;
		this.url = url;
		this.updateIntervalMs = updateIntervalMs;
	}

	async fetchAndUpdateMappings(): Promise<void> {
		try {
			const res = await fetch(this.url);
			if (!res.ok) throw new Error(`Failed to fetch mappings: ${res.statusText}`);

			const json = await res.json();

			if (typeof json.mappings !== "string") {
				console.error("Invalid response: `mappings` field is missing or not a string");
			}

			const parsed = parseMappings(json.mappings);
			this.stateManager.updateMappings(parsed);

			console.log(`Mappings updated at ${new Date().toISOString()}`);
		} catch (err) {
			console.error(`Error updating mappings: ${(err as Error).message}`);
		}
	}

	start() {
		this.fetchAndUpdateMappings();
		this.intervalId = setInterval(() => this.fetchAndUpdateMappings(), this.updateIntervalMs);
	}

	stop() {
		if (this.intervalId) clearInterval(this.intervalId);
	}
}
