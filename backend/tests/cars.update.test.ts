import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("PATCH /api/cars/:id", () => {
  const getDatabase = useTestDatabase();

  async function createUserAndLogin(role: "user" | "admin"): Promise<string> {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const email = `update-${randomUUID()}@example.com`;
    const password = "Update-test-password-123!";

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      ["Update Test User", email, passwordHash, role],
    );

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    return loginResponse.body.accessToken as string;
  }

  async function createCar(): Promise<{
    id: string;
    updated_at: Date;
  }> {
    const db = getDatabase();

    const result = await db.query<{
      id: string;
      updated_at: Date;
    }>(
      `INSERT INTO public.cars (
        make, model, category, year, price,
        quantity, mileage, fuel_type, transmission
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, updated_at`,
      [
        "Toyota",
        "Camry",
        "sedan",
        2022,
        "1850000.00",
        5,
        25000,
        "petrol",
        "automatic",
      ],
    );

    const car = result.rows[0];

    if (!car) {
      throw new Error("Failed to create test car.");
    }

    return car;
  }

  it("allows an administrator to update a car", async () => {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const token = await createUserAndLogin("admin");
    const car = await createCar();

    const response = await request(app)
      .patch(`/api/cars/${car.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        price: "1750000.00",
        mileage: 27000,
        status: "reserved",
      });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    expect(response.body).toEqual({
      car: {
        id: car.id,
        make: "Toyota",
        model: "Camry",
        category: "sedan",
        year: 2022,
        price: "1750000.00",
        quantity: 5,
        mileage: 27000,
        fuel_type: "petrol",
        transmission: "automatic",
        status: "reserved",
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });

    const storedCar = await db.query<{
      category: string;
      quantity: number;
      price: string;
      mileage: number;
      status: string;
      updated_at: Date;
    }>(
      `SELECT
        category,
        quantity,
        price,
        mileage,
        status,
        updated_at
       FROM public.cars
       WHERE id = $1`,
      [car.id],
    );

    expect(storedCar.rows[0]).toMatchObject({
      category: "sedan",
      quantity: 5,
      price: "1750000.00",
      mileage: 27000,
      status: "reserved",
    });

    expect(storedCar.rows[0]!.updated_at.getTime()).toBeGreaterThan(
      car.updated_at.getTime(),
    );
  }, 30000);

  it("rejects unauthenticated requests", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const car = await createCar();

    const response = await request(app)
      .patch(`/api/cars/${car.id}`)
      .send({ price: "1750000.00" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    });
  });

  it("rejects authenticated regular users", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const token = await createUserAndLogin("user");
    const car = await createCar();

    const response = await request(app)
      .patch(`/api/cars/${car.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: "1750000.00" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "Insufficient permissions.",
      },
    });
  }, 30000);
});
