import { randomUUID } from "node:crypto";
import { jwtVerify } from "jose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp, TEST_JWT_SECRET } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("POST /api/auth/login", () => {
  const getDatabase = useTestDatabase();

  it("returns public user details and a signed one-hour access token", async () => {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const registration = {
      name: "Login Test",
      email: `login-${randomUUID()}@example.com`,
      password: "Login-test-password-123!",
    };

    const registrationResponse = await request(app)
      .post("/api/auth/register")
      .send(registration);

    expect(registrationResponse.status).toBe(201);

    const loginStartedAt = Math.floor(Date.now() / 1000);

    const response = await request(app).post("/api/auth/login").send({
      email: registration.email,
      password: registration.password,
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    expect(response.body).toEqual({
      accessToken: expect.any(String),
      user: {
        id: registrationResponse.body.user.id,
        name: registration.name,
        email: registration.email,
        role: "user",
      },
    });

    const { payload, protectedHeader } = await jwtVerify(
      response.body.accessToken,
      new TextEncoder().encode(TEST_JWT_SECRET),
      {
        algorithms: ["HS256"],
        issuer: "car-dealership-auth",
        audience: "car-dealership-api",
      },
    );

    expect(protectedHeader).toEqual({
      alg: "HS256",
      typ: "JWT",
    });

    expect(payload).toEqual({
      sub: registrationResponse.body.user.id,
      role: "user",
      iss: "car-dealership-auth",
      aud: "car-dealership-api",
      iat: expect.any(Number),
      exp: expect.any(Number),
    });

    if (typeof payload.iat !== "number" || typeof payload.exp !== "number") {
      throw new Error("The token must contain issue and expiry times.");
    }

    expect(payload.iat).toBeGreaterThanOrEqual(loginStartedAt);
    expect(payload.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));

    expect(payload.exp - payload.iat).toBe(3600);
  }, 30000);
});
