import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createTestApp as createApp } from "./helpers/app.js";

describe("GET /api/health", () => {
  it("returns HTTP 200 with the API status", async () => {
    const app = createApp({
      database: {
        query: vi.fn(),
      },
    });

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({
      status: "ok",
    });
  });
});
