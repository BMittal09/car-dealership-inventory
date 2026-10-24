import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("Vehicle inventory boundary conditions", () => {
  const getDatabase = useTestDatabase();

  async function createToken(role: "user" | "admin"): Promise<string> {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const email = `boundary-${randomUUID()}@example.com`;
    const password = "Boundary-test-password-123!";

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (
        name, email, password_hash, role
      )
      VALUES ($1, $2, $3, $4)`,
      ["Boundary Test User", email, passwordHash, role],
    );

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    return loginResponse.body.accessToken as string;
  }

  async function createVehicle(
    quantity: number,
    status: "available" | "reserved" | "sold" = "available",
  ): Promise<string> {
    const db = getDatabase();

    const result = await db.query<{ id: string }>(
      `INSERT INTO public.cars (
        make, model, category, year, price,
        quantity, mileage, fuel_type, transmission, status
      )
      VALUES (
        'Toyota', 'Camry', 'sedan', 2023,
        1850000.00, $1, 18000, 'petrol', 'automatic', $2
      )
      RETURNING id`,
      [quantity, status],
    );

    return result.rows[0]!.id;
  }

  async function getQuantity(id: string): Promise<number> {
    const result = await getDatabase().query<{
      quantity: number;
    }>("SELECT quantity FROM public.cars WHERE id = $1", [id]);

    return result.rows[0]!.quantity;
  }

  it.each(["reserved", "sold"] as const)(
    "rejects purchasing a %s vehicle",
    async (status) => {
      const app = createTestApp({
        database: getDatabase(),
      });

      const token = await createToken("user");
      const vehicleId = await createVehicle(5, status);

      const response = await request(app)
        .post(`/api/vehicles/${vehicleId}/purchase`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("VEHICLE_UNAVAILABLE");

      expect(await getQuantity(vehicleId)).toBe(5);
    },
    30000,
  );

  it("rejects restocking beyond the maximum integer quantity", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const token = await createToken("admin");
    const vehicleId = await createVehicle(2147483646);

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 2 });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("QUANTITY_OVERFLOW");

    expect(await getQuantity(vehicleId)).toBe(2147483646);
  }, 30000);

  it("allows restocking exactly to the maximum quantity", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const token = await createToken("admin");
    const vehicleId = await createVehicle(2147483646);

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 1 });

    expect(response.status).toBe(200);
    expect(response.body.car.quantity).toBe(2147483647);

    expect(await getQuantity(vehicleId)).toBe(2147483647);
  }, 30000);

  it("rejects restock quantities above the integer maximum", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const token = await createToken("admin");
    const vehicleId = await createVehicle(1);

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 2147483648 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");

    expect(await getQuantity(vehicleId)).toBe(1);
  }, 30000);

  it("does not change inventory after an out-of-stock purchase", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const token = await createToken("user");
    const vehicleId = await createVehicle(0);

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/purchase`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("OUT_OF_STOCK");

    expect(await getQuantity(vehicleId)).toBe(0);
  }, 30000);
});
