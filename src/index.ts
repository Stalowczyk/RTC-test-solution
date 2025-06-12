import express from "express";
import { StateManager } from "./services/stateManager";
import { MappingsFetcher } from "./fetchers/mappingsFetcher";
import { StateFetcher } from "./fetchers/stateFetcher";

const app = express();

const stateManager = new StateManager({});
const SIMULATION_HOST = process.env.SIMULATION_HOST || "localhost";
const SIMULATION_PORT = process.env.SIMULATION_PORT || "3000";

const mappingsUrl = `http://${SIMULATION_HOST}:${SIMULATION_PORT}/api/mappings`;
const stateUrl = `http://${SIMULATION_HOST}:${SIMULATION_PORT}/api/state`;

const mappingsFetcher = new MappingsFetcher(stateManager, mappingsUrl);
// Start fetching the mappings and updating stateManager
mappingsFetcher.start();

const stateFetcher = new StateFetcher(stateManager, stateUrl);
// Start fetching from the state api and updating stateManager
stateFetcher.start();

app.get("/client/state", (req, res) => {
	res.json(stateManager.getClientState());
});

if (process.env.NODE_ENV === "test") {
	app.get("/error", (req, res, next) => {
		next(new Error("Test error"));
	});
}

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function shutdown() {
	console.log("shutting down...");
	stateFetcher.stop();
	mappingsFetcher.stop();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default app;
