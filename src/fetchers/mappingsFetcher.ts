import { parseMappings } from "../utils/mappingsParser";
import { StateManager } from "../services/stateManager";

/**
 * Periodically fetches mappings data from api/mappings
 * parses them and updates StateManager
 */
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

	/** Fetches mappings parses them and updates StateManager */
	async fetchAndUpdateMappings(): Promise<void> {
		try {
			const res = await fetch(this.url);
			if (!res.ok) {
				console.error(`Failed to fetch mappings from ${this.url}: ${res.statusText}`);
				return;
			}

			const json = await res.json();

			if (typeof json.mappings !== "string") {
				console.error(
					`Invalid response from ${this.url}: 'mappings' field is missing or not a string`
				);
				return;
			}

			const parsed = parseMappings(json.mappings);
			this.stateManager.updateMappings(parsed);

			console.log(`Mappings updated at ${new Date().toISOString()}`);
		} catch (err) {
			console.error(`Error updating mappings from ${this.url}: ${(err as Error).message}`);
		}
	}

	start() {
		if (this.intervalId) return;
		this.fetchAndUpdateMappings();
		this.intervalId = setInterval(() => this.fetchAndUpdateMappings(), this.updateIntervalMs);
	}

	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
		}
	}
}
