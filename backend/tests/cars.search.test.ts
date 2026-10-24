import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("GET /api/cars search, filters, and pagination", () => {
  const getDatabase = useTestDatabase();

  async function seedCars() {
    const db = getDatabase();

    await db.query(
      `INSERT INTO public.cars (
        make, model, year, price, mileage,
        fuel_type, transmission, status
      )
      VALUES
        ('Toyota', 'Camry', 2022, 1850000.00, 25000,
         'petrol', 'automatic', 'available'),
        ('Toyota', 'Corolla', 2020, 900000.00, 40000,
         'petrol', 'manual', 'available'),
        ('Honda', 'City', 2021, 950000.00, 35000,
         'petrol', 'manual', 'available'),
        ('Hyundai', 'Creta', 2023, 1500000.00, 12000,
         'diesel', 'automatic', 'reserved'),
        ('Tata', 'Nexon EV', 2024, 1600000.00, 8000,
         'electric', 'automatic', 'sold')`,
    );
  }

  it("searches cars by make or model without case sensitivity", async () => {
    await seedCars();
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app)
      .get("/api/cars")
      .query({ search: "toyota" });

    expect(response.status).toBe(200);
    expect(response.body.cars).toHaveLength(2);
    expect(
      response.body.cars.every(
        (car: { make: string }) => car.make === "Toyota",
      ),
    ).toBe(true);
    expect(response.body.pagination.total).toBe(2);
  });

  it("filters cars by make", async () => {
    await seedCars();
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app)
      .get("/api/cars")
      .query({ make: "Honda" });

    expect(response.status).toBe(200);
    expect(response.body.cars).toHaveLength(1);
    expect(response.body.cars[0].model).toBe("City");
  });

  it("filters cars by fuel type and transmission", async () => {
    await seedCars();
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app).get("/api/cars").query({
      fuel_type: "diesel",
      transmission: "automatic",
    });

    expect(response.status).toBe(200);
    expect(response.body.cars).toHaveLength(1);
    expect(response.body.cars[0].model).toBe("Creta");
  });

  it("filters cars by status", async () => {
    await seedCars();
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app)
      .get("/api/cars")
      .query({ status: "sold" });

    expect(response.status).toBe(200);
    expect(response.body.cars).toHaveLength(1);
    expect(response.body.cars[0].model).toBe("Nexon EV");
  });

  it("filters cars by price range", async () => {
    await seedCars();
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app).get("/api/cars").query({
      min_price: "900000",
      max_price: "1000000",
    });

    expect(response.status).toBe(200);
    expect(response.body.cars).toHaveLength(2);
    expect(response.body.pagination.total).toBe(2);
  });

  it("paginates results correctly", async () => {
    await seedCars();
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app)
      .get("/api/cars")
      .query({ page: 2, limit: 2 });

    expect(response.status).toBe(200);
    expect(response.body.cars).toHaveLength(2);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 5,
      totalPages: 3,
    });
  });

  it("returns an empty list when filters match no cars", async () => {
    await seedCars();
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app)
      .get("/api/cars")
      .query({ make: "Ferrari" });

    expect(response.status).toBe(200);
    expect(response.body.cars).toEqual([]);
    expect(response.body.pagination.total).toBe(0);
  });
});
