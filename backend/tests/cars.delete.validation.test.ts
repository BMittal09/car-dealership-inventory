import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("DELETE /api/cars/:id validation", () => {
  const getDatabase = useTestDatabase();

  async function createAdminToken(): Promise<string> {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const email = `delete-validation-${randomUUID()}@example.com`;
    const password = "Delete-validation-password-123!";

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      ["Delete Validation Admin", email, passwordHash, "admin"],
    );

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    return loginResponse.body.accessToken as string;
  }

  it("rejects an invalid car ID", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createAdminToken();

    const response = await request(app)
      .delete("/api/cars/not-a-valid-uuid")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid car ID.",
      },
    });
  }, 30000);

  it("returns 404 when the car does not exist", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createAdminToken();

    const response = await request(app)
      .delete(`/api/cars/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "CAR_NOT_FOUND",
        message: "Car not found.",
      },
    });
  }, 30000);
});
