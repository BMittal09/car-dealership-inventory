import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createTestApp } from "./helpers/app.js";

describe("HTTP security headers", () => {
  function createSecurityTestApp() {
    return createTestApp({
      database: {
        query: vi.fn(),
      },
    });
  }

  it("prevents MIME-type sniffing", async () => {
    const app = createSecurityTestApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("prevents the API from being embedded in frames", async () => {
    const app = createSecurityTestApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });

  it("sets a Content Security Policy", async () => {
    const app = createSecurityTestApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-security-policy"]).toEqual(
      expect.any(String),
    );
  });

  it("sets HTTP Strict Transport Security", async () => {
    const app = createSecurityTestApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers["strict-transport-security"]).toEqual(
      expect.any(String),
    );
  });

  it("does not expose the Express framework header", async () => {
    const app = createSecurityTestApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});
