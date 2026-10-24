import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("Required /api/vehicles endpoints", () => {
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

  async function createToken(role: "user" | "admin"): Promise<string> {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const email = `vehicle-${randomUUID()}@example.com`;
    const password = "Vehicle-test-password-123!";

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (
        name, email, password_hash, role
      )
      VALUES ($1, $2, $3, $4)`,
      ["Vehicle API Test User", email, passwordHash, role],
    );

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    return loginResponse.body.accessToken as string;
  }

  async function createVehicleInDatabase(): Promise<string> {
    const db = getDatabase();

    const result = await db.query<{ id: string }>(
      `INSERT INTO public.cars (
        make, model, category, year, price,
        quantity, mileage, fuel_type, transmission
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        validVehicle.make,
        validVehicle.model,
        validVehicle.category,
        validVehicle.year,
        validVehicle.price,
        validVehicle.quantity,
        validVehicle.mileage,
        validVehicle.fuel_type,
        validVehicle.transmission,
      ],
    );

    return result.rows[0]!.id;
  }

  it("allows an administrator to create a vehicle", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createToken("admin");

    const response = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${token}`)
      .send(validVehicle);

    expect(response.status).toBe(201);
    expect(response.body.car).toMatchObject(validVehicle);
  }, 30000);

  it("lists vehicles through the required endpoint", async () => {
    const app = createTestApp({ database: getDatabase() });

    await createVehicleInDatabase();

    const response = await request(app).get("/api/vehicles");

    expect(response.status).toBe(200);
    expect(response.body.cars).toHaveLength(1);
    expect(response.body.cars[0].category).toBe("sedan");
  });

  it("searches vehicles using the dedicated search endpoint", async () => {
    const app = createTestApp({ database: getDatabase() });

    await createVehicleInDatabase();

    const response = await request(app).get("/api/vehicles/search").query({
      category: "sedan",
      max_price: "2000000",
    });

    expect(response.status).toBe(200);
    expect(response.body.cars).toHaveLength(1);
    expect(response.body.cars[0].model).toBe("Camry");
  });

  it("allows an administrator to update a vehicle using PUT", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createToken("admin");
    const vehicleId = await createVehicleInDatabase();

    const response = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...validVehicle,
        price: "1750000.00",
      });

    expect(response.status).toBe(200);
    expect(response.body.car.price).toBe("1750000.00");
  }, 30000);

  it("allows an administrator to delete a vehicle", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createToken("admin");
    const vehicleId = await createVehicleInDatabase();

    const response = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(204);

    const result = await getDatabase().query(
      "SELECT id FROM public.cars WHERE id = $1",
      [vehicleId],
    );

    expect(result.rows).toHaveLength(0);
  }, 30000);
});
