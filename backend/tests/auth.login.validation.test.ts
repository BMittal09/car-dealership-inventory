import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("Login input rules", () => {
  const getDatabase = useTestDatabase();

  const invalidInputs: Array<{
    name: string;
    body: Record<string, unknown>;
  }> = [
    { name: "missing email", body: { password: "Password-123456789" } },
    {
      name: "blank email",
      body: { email: "", password: "Password-123456789" },
    },
    {
      name: "invalid email",
      body: { email: "not-an-email", password: "Password-123456789" },
    },
    {
      name: "non-string email",
      body: { email: 123, password: "Password-123456789" },
    },
    { name: "missing password", body: { email: "user@example.com" } },
    {
      name: "blank password",
      body: { email: "user@example.com", password: "" },
    },
    {
      name: "non-string password",
      body: { email: "user@example.com", password: 123 },
    },
    {
      name: "unexpected field",
      body: {
        email: "user@example.com",
        password: "Password-123456789",
        role: "admin",
      },
    },
  ];

  it.each(invalidInputs)("rejects $name", async ({ body }) => {
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app).post("/api/auth/login").send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid login data.",
      },
    });
  });

  it("rejects an unknown email", async () => {
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: `unknown-${randomUUID()}@example.com`,
        password: "Password-123456789",
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
  });

  it("rejects an incorrect password", async () => {
    const app = createTestApp({ database: getDatabase() });

    const registration = {
      name: "Wrong Password Test",
      email: `login-${randomUUID()}@example.com`,
      password: "Correct-Password-123456",
    };

    const registrationResponse = await request(app)
      .post("/api/auth/register")
      .send(registration);

    expect(registrationResponse.status).toBe(201);

    const response = await request(app).post("/api/auth/login").send({
      email: registration.email,
      password: "Incorrect-Password-123",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
  }, 30000);
});
