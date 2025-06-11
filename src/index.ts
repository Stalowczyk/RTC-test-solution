import express from "express";

const app = express();

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
