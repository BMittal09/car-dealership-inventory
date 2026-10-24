import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("Vehicle category and quantity requirements", () => {
  const getDatabase = useTestDatabase();

  const validVehicle = {
    make: "Toyota",
    model: "Camry",
    category: "sedan",
    year: 2023,
    price: "1850000.00",
    quantity: 5,
    mileage: 18000,
    fuel_type: "petrol",
    transmission: "automatic",
  };

  async function createAdminToken(): Promise<string> {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const email = `inventory-${randomUUID()}@example.com`;
    const password = "Inventory-test-password-123!";

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (
        name, email, password_hash, role
      )
      VALUES ($1, $2, $3, $4)`,
      ["Inventory Administrator", email, passwordHash, "admin"],
    );

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    return loginResponse.body.accessToken as string;
  }

  it("creates a vehicle with category and quantity", async () => {
    const db = getDatabase();
    const app = createTestApp({ database: db });
    const token = await createAdminToken();

    const response = await request(app)
      .post("/api/cars")
      .set("Authorization", `Bearer ${token}`)
      .send(validVehicle);

    expect(response.status).toBe(201);

    expect(response.body.car).toMatchObject({
      make: "Toyota",
      model: "Camry",
      category: "sedan",
      quantity: 5,
    });

    const storedVehicle = await db.query<{
      category: string;
      quantity: number;
    }>(
      `SELECT category, quantity
       FROM public.cars
       WHERE id = $1`,
      [response.body.car.id],
    );

    expect(storedVehicle.rows[0]).toEqual({
      category: "sedan",
      quantity: 5,
    });
  }, 30000);

  it("rejects vehicle creation without category", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const token = await createAdminToken();

    const { category: _category, ...vehicleWithoutCategory } = validVehicle;

    const response = await request(app)
      .post("/api/cars")
      .set("Authorization", `Bearer ${token}`)
      .send(vehicleWithoutCategory);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  }, 30000);

  it("rejects vehicle creation without quantity", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const token = await createAdminToken();

    const { quantity: _quantity, ...vehicleWithoutQuantity } = validVehicle;

    const response = await request(app)
      .post("/api/cars")
      .set("Authorization", `Bearer ${token}`)
      .send(vehicleWithoutQuantity);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  }, 30000);

  it.each([-1, 1.5, "5", null])(
    "rejects invalid inventory quantity %s",
    async (quantity) => {
      const app = createTestApp({
        database: getDatabase(),
      });

      const token = await createAdminToken();

      const response = await request(app)
        .post("/api/cars")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validVehicle,
          quantity,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    },
    30000,
  );

  it("allows zero quantity when creating an out-of-stock vehicle", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const token = await createAdminToken();

    const response = await request(app)
      .post("/api/cars")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...validVehicle,
        quantity: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body.car.quantity).toBe(0);
  }, 30000);

  it("returns category and quantity when retrieving a vehicle", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const token = await createAdminToken();

    const createResponse = await request(app)
      .post("/api/cars")
      .set("Authorization", `Bearer ${token}`)
      .send(validVehicle);

    expect(createResponse.status).toBe(201);

    const response = await request(app).get(
      `/api/cars/${createResponse.body.car.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.car).toMatchObject({
      category: "sedan",
      quantity: 5,
    });
  }, 30000);
});
