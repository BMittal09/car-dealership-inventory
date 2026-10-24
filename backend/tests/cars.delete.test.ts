import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("DELETE /api/cars/:id", () => {
  const getDatabase = useTestDatabase();

  async function createUserAndLogin(role: "user" | "admin"): Promise<string> {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const email = `delete-${randomUUID()}@example.com`;
    const password = "Delete-test-password-123!";

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      ["Delete Test User", email, passwordHash, role],
    );

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toEqual(expect.any(String));

    return loginResponse.body.accessToken as string;
  }

  async function createCar(): Promise<string> {
    const db = getDatabase();

    const result = await db.query<{ id: string }>(
      `INSERT INTO public.cars (
        make, model, year, price, mileage,
        fuel_type, transmission
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      ["Toyota", "Camry", 2022, "1850000.00", 25000, "petrol", "automatic"],
    );

    const carId = result.rows[0]?.id;

    if (!carId) {
      throw new Error("Failed to create test car.");
    }

    return carId;
  }

  it("allows an administrator to delete an existing car", async () => {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const token = await createUserAndLogin("admin");
    const carId = await createCar();

    const response = await request(app)
      .delete(`/api/cars/${carId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(response.text).toBe("");

    const storedCar = await db.query(
      `SELECT id FROM public.cars WHERE id = $1`,
      [carId],
    );

    expect(storedCar.rows).toHaveLength(0);
  }, 30000);

  it("rejects unauthenticated requests", async () => {
    const app = createTestApp({ database: getDatabase() });
    const carId = await createCar();

    const response = await request(app).delete(`/api/cars/${carId}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    });

    const storedCar = await getDatabase().query(
      `SELECT id FROM public.cars WHERE id = $1`,
      [carId],
    );

    expect(storedCar.rows).toHaveLength(1);
  });

  it("rejects authenticated regular users", async () => {
    const app = createTestApp({ database: getDatabase() });

    const token = await createUserAndLogin("user");
    const carId = await createCar();

    const response = await request(app)
      .delete(`/api/cars/${carId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "Insufficient permissions.",
      },
    });

    const storedCar = await getDatabase().query(
      `SELECT id FROM public.cars WHERE id = $1`,
      [carId],
    );

    expect(storedCar.rows).toHaveLength(1);
  }, 30000);
});
