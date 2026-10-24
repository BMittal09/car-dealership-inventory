import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("POST /api/vehicles/:id/purchase", () => {
  const getDatabase = useTestDatabase();

  async function createUserToken(
    role: "user" | "admin" = "user",
  ): Promise<string> {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const email = `purchase-${randomUUID()}@example.com`;
    const password = "Purchase-test-password-123!";

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (
        name, email, password_hash, role
      )
      VALUES ($1, $2, $3, $4)`,
      ["Purchase Test User", email, passwordHash, role],
    );

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    return loginResponse.body.accessToken as string;
  }

  async function createVehicle(quantity: number): Promise<string> {
    const db = getDatabase();

    const result = await db.query<{ id: string }>(
      `INSERT INTO public.cars (
        make, model, category, year, price,
        quantity, mileage, fuel_type, transmission
      )
      VALUES (
        'Toyota', 'Camry', 'sedan', 2023,
        1850000.00, $1, 18000, 'petrol', 'automatic'
      )
      RETURNING id`,
      [quantity],
    );

    return result.rows[0]!.id;
  }

  it("decreases stock by one after a successful purchase", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createUserToken();
    const vehicleId = await createVehicle(5);

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/purchase`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.car.quantity).toBe(4);

    const result = await getDatabase().query<{
      quantity: number;
    }>("SELECT quantity FROM public.cars WHERE id = $1", [vehicleId]);

    expect(result.rows[0]?.quantity).toBe(4);
  }, 30000);

  it("rejects purchases without authentication", async () => {
    const app = createTestApp({ database: getDatabase() });
    const vehicleId = await createVehicle(5);

    const response = await request(app).post(
      `/api/vehicles/${vehicleId}/purchase`,
    );

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects purchases when stock is zero", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createUserToken();
    const vehicleId = await createVehicle(0);

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/purchase`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("OUT_OF_STOCK");

    const result = await getDatabase().query<{
      quantity: number;
    }>("SELECT quantity FROM public.cars WHERE id = $1", [vehicleId]);

    expect(result.rows[0]?.quantity).toBe(0);
  }, 30000);

  it("returns 404 when the vehicle does not exist", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createUserToken();

    const response = await request(app)
      .post(`/api/vehicles/${randomUUID()}/purchase`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("VEHICLE_NOT_FOUND");
  }, 30000);

  it("rejects an invalid vehicle ID", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createUserToken();

    const response = await request(app)
      .post("/api/vehicles/invalid-id/purchase")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  }, 30000);

  it("allows administrators to purchase vehicles", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createUserToken("admin");
    const vehicleId = await createVehicle(2);

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/purchase`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.car.quantity).toBe(1);
  }, 30000);

  it("prevents overselling during concurrent purchases", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createUserToken();
    const vehicleId = await createVehicle(1);

    const [first, second] = await Promise.all([
      request(app)
        .post(`/api/vehicles/${vehicleId}/purchase`)
        .set("Authorization", `Bearer ${token}`),

      request(app)
        .post(`/api/vehicles/${vehicleId}/purchase`)
        .set("Authorization", `Bearer ${token}`),
    ]);

    const statuses = [first.status, second.status].sort();

    expect(statuses).toEqual([200, 409]);

    const result = await getDatabase().query<{
      quantity: number;
    }>("SELECT quantity FROM public.cars WHERE id = $1", [vehicleId]);

    expect(result.rows[0]?.quantity).toBe(0);
  }, 30000);
});
