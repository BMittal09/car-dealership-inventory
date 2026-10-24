import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { useTestDatabase } from "./helpers/database.js";

interface InvalidRegistrationCase {
  label: string;
  changes: Record<string, unknown>;
}

function makeRegistration() {
  const identifier = randomUUID();

  return {
    name: `Validation ${identifier}`,
    email: `validation-${identifier}@example.com`,
    password: "Registration-test-password-123!",
  };
}

const invalidCases: InvalidRegistrationCase[] = [
  { label: "a missing name", changes: { name: undefined } },
  { label: "a blank name", changes: { name: "   " } },
  { label: "a non-string name", changes: { name: 123 } },
  {
    label: "a name longer than 100 characters",
    changes: { name: "a".repeat(101) },
  },
  { label: "a missing email", changes: { email: undefined } },
  { label: "an invalid email", changes: { email: "not-an-email" } },
  { label: "a non-string email", changes: { email: 123 } },
  {
    label: "an email longer than 254 characters",
    changes: { email: `${"a".repeat(243)}@example.com` },
  },
  { label: "a missing password", changes: { password: undefined } },
  { label: "a non-string password", changes: { password: 123 } },
  {
    label: "a password shorter than 15 characters",
    changes: { password: "a".repeat(14) },
  },
  {
    label: "a password longer than 128 characters",
    changes: { password: "a".repeat(129) },
  },
  { label: "a submitted admin role", changes: { role: "admin" } },
  { label: "an unexpected field", changes: { isAdmin: true } },
];

describe("Registration input rules", () => {
  const getDatabase = useTestDatabase();

  it.each(invalidCases)(
    "rejects $label without creating a user",
    async ({ changes }) => {
      const db = getDatabase();
      const app = createApp({ database: db });
      const registration = makeRegistration();

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...registration,
          ...changes,
        });

      expect(response.status).toBe(400);
      expect(response.headers["content-type"]).toMatch(/application\/json/);
      expect(response.body).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid registration data.",
        },
      });

      const result = await db.query(
        `SELECT id
         FROM public.users
         WHERE email = $1 OR name = $2`,
        [registration.email, registration.name],
      );

      expect(result.rows).toEqual([]);
    },
    30000,
  );

  it.each([15, 128])(
    "accepts a password containing exactly %i characters",
    async (length) => {
      const db = getDatabase();
      const app = createApp({ database: db });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...makeRegistration(),
          password: randomUUID().repeat(4).slice(0, length),
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe("user");
    },
    30000,
  );

  it("normalizes name and email while preserving password spaces", async () => {
    const db = getDatabase();
    const app = createApp({ database: db });

    const registration = {
      ...makeRegistration(),
      password: "  Preserve these password spaces!  ",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: `  ${registration.name}  `,
        email: `  ${registration.email.toUpperCase()}  `,
        password: registration.password,
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: {
        id: expect.any(String),
        name: registration.name,
        email: registration.email,
        role: "user",
      },
    });

    const result = await db.query<{
      name: string;
      email: string;
      password_hash: string;
    }>(
      `SELECT name, email, password_hash
       FROM public.users
       WHERE id = $1`,
      [response.body.user.id],
    );

    expect(result.rows).toHaveLength(1);

    const storedUser = result.rows[0];

    if (!storedUser) {
      throw new Error("Registration did not create a database user.");
    }

    expect(storedUser.name).toBe(registration.name);
    expect(storedUser.email).toBe(registration.email);

    expect(
      await argon2.verify(storedUser.password_hash, registration.password),
    ).toBe(true);

    expect(
      await argon2.verify(
        storedUser.password_hash,
        registration.password.trim(),
      ),
    ).toBe(false);
  }, 30000);

  it.each(["same spelling", "different letter case"])(
    "returns 409 for an existing email with %s",
    async (variant) => {
      const db = getDatabase();
      const app = createApp({ database: db });
      const registration = makeRegistration();

      const firstResponse = await request(app)
        .post("/api/auth/register")
        .send(registration);

      expect(firstResponse.status).toBe(201);

      const duplicateEmail =
        variant === "different letter case"
          ? registration.email.toUpperCase()
          : registration.email;

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...registration,
          name: "Second Registration",
          email: duplicateEmail,
        });

      expect(response.status).toBe(409);
      expect(response.headers["content-type"]).toMatch(/application\/json/);
      expect(response.body).toEqual({
        error: {
          code: "EMAIL_IN_USE",
          message: "Email is already registered.",
        },
      });

      const result = await db.query<{ id: string }>(
        `SELECT id
         FROM public.users
         WHERE LOWER(email) = LOWER($1)`,
        [registration.email],
      );

      expect(result.rows).toEqual([{ id: firstResponse.body.user.id }]);
    },
    30000,
  );
});
