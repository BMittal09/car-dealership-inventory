import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";

describe("CORS configuration", () => {
  const allowedOrigin = "http://localhost:5173";
  const rejectedOrigin = "https://untrusted.example.com";

  function createCorsTestApp() {
    return createApp({
      database: {
        query: vi.fn(),
      },
      jwtSecret: "test-jwt-secret-with-at-least-32-characters",
      allowedOrigins: [allowedOrigin],
    });
  }

  it("allows requests from an approved origin", async () => {
    const app = createCorsTestApp();

    const response = await request(app)
      .get("/api/health")
      .set("Origin", allowedOrigin);

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(allowedOrigin);
    expect(response.headers["vary"]).toContain("Origin");
  });

  it("does not allow an unapproved origin", async () => {
    const app = createCorsTestApp();

    const response = await request(app)
      .get("/api/health")
      .set("Origin", rejectedOrigin);

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("handles browser preflight requests", async () => {
    const app = createCorsTestApp();

    const response = await request(app)
      .options("/api/cars")
      .set("Origin", allowedOrigin)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Authorization, Content-Type");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(allowedOrigin);
    expect(response.headers["access-control-allow-methods"]).toContain("POST");
    expect(response.headers["access-control-allow-headers"]).toContain(
      "Authorization",
    );
    expect(response.headers["access-control-allow-headers"]).toContain(
      "Content-Type",
    );
  });

  it("allows requests without an Origin header", async () => {
    const app = createCorsTestApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
