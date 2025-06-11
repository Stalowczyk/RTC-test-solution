import express from "express";
import { StateManager } from "./services/state";
import { MappingsFetcher } from "./fetchers/mappingsFetcher";

const app = express();

const stateManager = new StateManager({});

const mappingsUrl = "http://localhost:300/api/mappings";

const mappingsFetcher = new MappingsFetcher(stateManager, mappingsUrl);
mappingsFetcher.start();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
