import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createTestApp } from "./helpers/app.js";

describe("Centralized API error handling", () => {
  it("returns a safe JSON response for unexpected database errors", async () => {
    const database = {
      query: vi
        .fn()
        .mockRejectedValue(new Error("Sensitive database connection details")),
    };

    const app = createTestApp({ database });

    const response = await request(app).get("/api/cars");

    expect(response.status).toBe(500);
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    });

    expect(JSON.stringify(response.body)).not.toContain(
      "Sensitive database connection details",
    );
  });

  it("preserves the existing health endpoint behavior", async () => {
    const database = {
      query: vi.fn(),
    };

    const app = createTestApp({ database });

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
    });
  });
});
