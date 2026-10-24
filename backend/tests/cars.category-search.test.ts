import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("GET /api/cars category filtering", () => {
  const getDatabase = useTestDatabase();

  async function seedVehicles() {
    const db = getDatabase();

    await db.query(
      `INSERT INTO public.cars (
        make, model, category, year, price,
        quantity, mileage, fuel_type, transmission
      )
      VALUES
        ('Honda', 'City', 'sedan', 2023, 1200000.00, 5, 12000, 'petrol', 'manual'),
        ('Hyundai', 'Creta', 'suv', 2024, 1800000.00, 3, 8000, 'diesel', 'automatic'),
        ('Tata', 'Nexon', 'suv', 2023, 1400000.00, 4, 15000, 'petrol', 'manual'),
        ('Maruti', 'Baleno', 'hatchback', 2022, 750000.00, 6, 20000, 'petrol', 'manual')`,
    );
  }

  it("filters vehicles by category", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    await seedVehicles();

    const response = await request(app)
      .get("/api/cars")
      .query({ category: "suv" });

    expect(response.status).toBe(200);
    expect(response.body.cars).toHaveLength(2);

    expect(
      response.body.cars.map((car: { category: string }) => car.category),
    ).toEqual(["suv", "suv"]);
  });

  it("combines category and price filtering", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    await seedVehicles();

    const response = await request(app).get("/api/cars").query({
      category: "suv",
      max_price: "1500000",
    });

    expect(response.status).toBe(200);
    expect(response.body.cars).toHaveLength(1);
    expect(response.body.cars[0].model).toBe("Nexon");
  });

  it("returns an empty list for an unknown category", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    await seedVehicles();

    const response = await request(app)
      .get("/api/cars")
      .query({ category: "convertible" });

    expect(response.status).toBe(200);
    expect(response.body.cars).toEqual([]);
    expect(response.body.pagination.total).toBe(0);
  });

  it("rejects an empty category", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const response = await request(app)
      .get("/api/cars")
      .query({ category: "" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
