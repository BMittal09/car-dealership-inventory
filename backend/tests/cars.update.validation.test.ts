import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("PATCH /api/cars/:id validation", () => {
  const getDatabase = useTestDatabase();

  async function createAdminToken(): Promise<string> {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const email = `update-validation-${randomUUID()}@example.com`;
    const password = "Update-validation-password-123!";

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      ["Update Validation Admin", email, passwordHash, "admin"],
    );

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(response.status).toBe(200);

    return response.body.accessToken as string;
  }

  async function createCar(): Promise<string> {
    const result = await getDatabase().query<{ id: string }>(
      `INSERT INTO public.cars (
        make, model, year, price, mileage,
        fuel_type, transmission
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      ["Toyota", "Camry", 2022, "1850000.00", 25000, "petrol", "automatic"],
    );

    const id = result.rows[0]?.id;

    if (!id) {
      throw new Error("Failed to create test car.");
    }

    return id;
  }

  const invalidUpdates: Array<{
    name: string;
    body: Record<string, unknown>;
  }> = [
    { name: "empty update", body: {} },
    { name: "blank make", body: { make: "   " } },
    { name: "blank model", body: { model: "" } },
    { name: "invalid year", body: { year: 1800 } },
    { name: "future unsupported year", body: { year: 2101 } },
    { name: "negative price", body: { price: "-1.00" } },
    { name: "invalid price format", body: { price: "1000" } },
    { name: "negative mileage", body: { mileage: -1 } },
    { name: "decimal mileage", body: { mileage: 12.5 } },
    { name: "unsupported fuel type", body: { fuel_type: "steam" } },
    { name: "unsupported transmission", body: { transmission: "unknown" } },
    { name: "unsupported status", body: { status: "destroyed" } },
    { name: "unexpected field", body: { owner: "someone" } },
    { name: "attempt to change ID", body: { id: randomUUID() } },
  ];

  it.each(invalidUpdates)(
    "rejects $name",
    async ({ body }) => {
      const db = getDatabase();
      const app = createTestApp({ database: db });

      const token = await createAdminToken();
      const carId = await createCar();

      const response = await request(app)
        .patch(`/api/cars/${carId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid car data.",
        },
      });
    },
    30000,
  );

  it("rejects an invalid car ID", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createAdminToken();

    const response = await request(app)
      .patch("/api/cars/not-a-valid-uuid")
      .set("Authorization", `Bearer ${token}`)
      .send({ price: "1750000.00" });

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
      .patch(`/api/cars/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: "1750000.00" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "CAR_NOT_FOUND",
        message: "Car not found.",
      },
    });
  }, 30000);
});
