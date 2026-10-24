import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("GET /api/cars/:id", () => {
  const getDatabase = useTestDatabase();

  it("returns a car by its ID without requiring authentication", async () => {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const result = await db.query<{ id: string }>(
      `INSERT INTO public.cars (
        make, model, category, year, price,
        quantity, mileage, fuel_type, transmission
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
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

    const carId = result.rows[0]!.id;

    const response = await request(app).get(`/api/cars/${carId}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    expect(response.body).toEqual({
      car: {
        id: carId,
        make: "Toyota",
        model: "Camry",
        category: "sedan",
        year: 2022,
        price: "1850000.00",
        quantity: 5,
        mileage: 25000,
        fuel_type: "petrol",
        transmission: "automatic",
        status: "available",
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });
  }, 30000);

  it("returns 404 when the car does not exist", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const response = await request(app).get(`/api/cars/${randomUUID()}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "CAR_NOT_FOUND",
        message: "Car not found.",
      },
    });
  });

  it("rejects an invalid car ID", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const response = await request(app).get("/api/cars/not-a-valid-uuid");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid car ID.",
      },
    });
  });
});
