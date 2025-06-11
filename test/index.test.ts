import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import app from "../src";

describe("express app", () => {
	it("should respond with 404 and error message for unknown routes", async () => {
		const res = await request(app).get("/unknown-route");
		expect(res.status).toBe(404);
		expect(res.body).toEqual({ error: "Not Found" });
	});

	it("should respond with 500 and error message when error handler is triggered", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await request(app).get("/error");
		expect(res.status).toBe(500);
		expect(res.body).toEqual({ error: "Internal Server Error" });

		expect(errorSpy).toHaveBeenCalled();

		errorSpy.mockRestore();
	});
});
