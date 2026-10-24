import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("POST /api/cars input validation", () => {
  const getDatabase = useTestDatabase();

  const validCar = {
    make: "Toyota",
    model: "Camry",
    year: 2022,
    price: "1850000.00",
    mileage: 25000,
    fuel_type: "petrol",
    transmission: "automatic",
  };

  async function createAdminToken(): Promise<string> {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const email = `validation-admin-${randomUUID()}@example.com`;
    const password = "Validation-admin-password-123!";

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      ["Validation Admin", email, passwordHash, "admin"],
    );

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    return loginResponse.body.accessToken as string;
  }

  const invalidCars: Array<{
    name: string;
    overrides: Record<string, unknown>;
  }> = [
    { name: "blank make", overrides: { make: "" } },
    { name: "blank model", overrides: { model: "   " } },
    { name: "invalid year", overrides: { year: 1800 } },
    { name: "future unsupported year", overrides: { year: 2101 } },
    { name: "negative price", overrides: { price: "-100.00" } },
    { name: "negative mileage", overrides: { mileage: -1 } },
    { name: "unsupported fuel type", overrides: { fuel_type: "steam" } },
    {
      name: "unsupported transmission",
      overrides: { transmission: "unknown" },
    },
    { name: "unexpected status field", overrides: { status: "sold" } },
    { name: "unexpected extra field", overrides: { owner: "someone" } },
    { name: "non-numeric price", overrides: { price: "free" } },
    { name: "non-integer mileage", overrides: { mileage: 12.5 } },
  ];

  it.each(invalidCars)(
    "rejects $name",
    async ({ overrides }) => {
      const db = getDatabase();
      const app = createTestApp({ database: db });
      const token = await createAdminToken();

      const response = await request(app)
        .post("/api/cars")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validCar, ...overrides });

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
});
