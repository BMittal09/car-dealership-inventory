import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp as createApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
}

describe("POST /api/auth/register", () => {
  const getDatabase = useTestDatabase();

  it("registers a user and stores an Argon2id password hash", async () => {
    const db = getDatabase();
    const app = createApp({ database: db });

    const registration = {
      name: "Registration Test",
      email: `register-${randomUUID()}@example.com`,
      password: "Registration-test-password-123!",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(registration);

    expect(response.status).toBe(201);
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    expect(response.body).toEqual({
      user: {
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        ),
        name: registration.name,
        email: registration.email,
        role: "user",
      },
    });

    const result = await db.query<StoredUser>(
      `SELECT id, name, email, password_hash, role
       FROM public.users
       WHERE id = $1`,
      [response.body.user.id],
    );

    expect(result.rows).toHaveLength(1);

    const storedUser = result.rows[0];

    if (!storedUser) {
      throw new Error("Registration did not create a database user.");
    }

    expect(storedUser).toMatchObject({
      id: response.body.user.id,
      name: registration.name,
      email: registration.email,
      role: "user",
    });

    expect(storedUser.password_hash).toMatch(/^\$argon2id\$/);

    expect(
      await argon2.verify(storedUser.password_hash, registration.password),
    ).toBe(true);

    expect(
      await argon2.verify(
        storedUser.password_hash,
        "An-incorrect-password-456!",
      ),
    ).toBe(false);
  }, 30000);
});
