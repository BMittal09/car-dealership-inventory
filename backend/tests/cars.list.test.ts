import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("GET /api/cars", () => {
  const getDatabase = useTestDatabase();

  it("returns an empty list with pagination metadata when no cars exist", async () => {
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app).get("/api/cars");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    expect(response.body).toEqual({
      cars: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it("returns cars without requiring authentication", async () => {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    await db.query(
      `INSERT INTO public.cars (
        make, model, year, price, mileage,
        fuel_type, transmission, status
      )
      VALUES
        ('Toyota', 'Camry', 2022, 1850000.00, 25000,
         'petrol', 'automatic', 'available'),
        ('Honda', 'City', 2021, 950000.00, 35000,
         'petrol', 'manual', 'available')`,
    );

    const response = await request(app).get("/api/cars");

    expect(response.status).toBe(200);

    expect(response.body.cars).toHaveLength(2);

    expect(response.body.cars).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          make: "Toyota",
          model: "Camry",
          price: "1850000.00",
          status: "available",
        }),
        expect.objectContaining({
          make: "Honda",
          model: "City",
          price: "950000.00",
          status: "available",
        }),
      ]),
    );

    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
  }, 30000);
});
