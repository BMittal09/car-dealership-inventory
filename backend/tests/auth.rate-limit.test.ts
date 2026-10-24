import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";

describe("Authentication rate limiting", () => {
  function createRateLimitTestApp() {
    return createApp({
      database: {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      },
      jwtSecret: "test-jwt-secret-with-at-least-32-characters",
      authRateLimitMax: 3,
    });
  }

  const rateLimitError = {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many authentication requests. Please try again later.",
    },
  };

  it("limits excessive login requests", async () => {
    const app = createRateLimitTestApp();

    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await request(app).post("/api/auth/login").send({
        email: "unknown@example.com",
        password: "Incorrect-password-123!",
      });

      expect(response.status).toBe(401);
    }

    const response = await request(app).post("/api/auth/login").send({
      email: "unknown@example.com",
      password: "Incorrect-password-123!",
    });

    expect(response.status).toBe(429);
    expect(response.body).toEqual(rateLimitError);
  });

  it("limits excessive registration requests", async () => {
    const app = createRateLimitTestApp();

    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await request(app).post("/api/auth/register").send({});

      expect(response.status).toBe(400);
    }

    const response = await request(app).post("/api/auth/register").send({});

    expect(response.status).toBe(429);
    expect(response.body).toEqual(rateLimitError);
  });

  it("tracks login and registration limits independently", async () => {
    const app = createRateLimitTestApp();

    for (let attempt = 1; attempt <= 3; attempt++) {
      await request(app).post("/api/auth/login").send({
        email: "unknown@example.com",
        password: "Incorrect-password-123!",
      });
    }

    const registrationResponse = await request(app)
      .post("/api/auth/register")
      .send({});

    expect(registrationResponse.status).toBe(400);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "unknown@example.com",
      password: "Incorrect-password-123!",
    });

    expect(loginResponse.status).toBe(429);
    expect(loginResponse.body).toEqual(rateLimitError);
  });
});
