import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp, TEST_JWT_SECRET } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("GET /api/auth/me", () => {
  const getDatabase = useTestDatabase();

  const unauthorizedResponse = {
    error: {
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    },
  };

  it("rejects requests without an access token", async () => {
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual(unauthorizedResponse);
  });

  it("returns the authenticated user's details with a valid token", async () => {
    const app = createTestApp({ database: getDatabase() });

    const registration = {
      name: "Protected Route Test",
      email: `protected-${randomUUID()}@example.com`,
      password: "Protected-test-password-123!",
    };

    const registrationResponse = await request(app)
      .post("/api/auth/register")
      .send(registration);

    expect(registrationResponse.status).toBe(201);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: registration.email,
      password: registration.password,
    });

    expect(loginResponse.status).toBe(200);

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({
      user: registrationResponse.body.user,
    });
  }, 30000);

  it.each([
    ["an empty Bearer token", "Bearer "],
    ["a malformed token", "Bearer invalid.jwt.token"],
    ["a token without the Bearer scheme", "invalid.jwt.token"],
    ["a Basic authorization header", "Basic dXNlcjpwYXNz"],
  ])("rejects %s", async (_description, authorization) => {
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", authorization);

    expect(response.status).toBe(401);
    expect(response.body).toEqual(unauthorizedResponse);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const app = createTestApp({ database: getDatabase() });

    const token = await new SignJWT({ role: "user" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(randomUUID())
      .setIssuer("car-dealership-auth")
      .setAudience("car-dealership-api")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("incorrect-secret-for-testing-123456"));

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual(unauthorizedResponse);
  });

  it("rejects an expired token", async () => {
    const app = createTestApp({ database: getDatabase() });

    const now = Math.floor(Date.now() / 1000);

    const token = await new SignJWT({ role: "user" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(randomUUID())
      .setIssuer("car-dealership-auth")
      .setAudience("car-dealership-api")
      .setIssuedAt(now - 7200)
      .setExpirationTime(now - 3600)
      .sign(new TextEncoder().encode(TEST_JWT_SECRET));

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual(unauthorizedResponse);
  });
});
