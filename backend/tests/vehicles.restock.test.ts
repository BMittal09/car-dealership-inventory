import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("POST /api/vehicles/:id/restock", () => {
  const getDatabase = useTestDatabase();

  async function createUserToken(role: "user" | "admin"): Promise<string> {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const email = `restock-${randomUUID()}@example.com`;
    const password = "Restock-test-password-123!";

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (
        name, email, password_hash, role
      )
      VALUES ($1, $2, $3, $4)`,
      ["Restock Test User", email, passwordHash, role],
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
        'Honda', 'City', 'sedan', 2023,
        1200000.00, $1, 12000, 'petrol', 'manual'
      )
      RETURNING id`,
      [quantity],
    );

    return result.rows[0]!.id;
  }

  it("allows an administrator to restock a vehicle", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createUserToken("admin");
    const vehicleId = await createVehicle(3);

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(200);
    expect(response.body.car.quantity).toBe(8);

    const result = await getDatabase().query<{
      quantity: number;
    }>("SELECT quantity FROM public.cars WHERE id = $1", [vehicleId]);

    expect(result.rows[0]?.quantity).toBe(8);
  }, 30000);

  it("rejects unauthenticated restock requests", async () => {
    const app = createTestApp({ database: getDatabase() });
    const vehicleId = await createVehicle(3);

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .send({ quantity: 5 });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects restocking by regular users", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createUserToken("user");
    const vehicleId = await createVehicle(3);

    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  }, 30000);

  it.each([0, -2, 1.5, "5", null])(
    "rejects invalid restock quantity %s",
    async (quantity) => {
      const app = createTestApp({
        database: getDatabase(),
      });

      const token = await createUserToken("admin");
      const vehicleId = await createVehicle(3);

      const response = await request(app)
        .post(`/api/vehicles/${vehicleId}/restock`)
        .set("Authorization", `Bearer ${token}`)
        .send({ quantity });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    },
    30000,
  );

  it("returns 404 for a nonexistent vehicle", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createUserToken("admin");

    const response = await request(app)
      .post(`/api/vehicles/${randomUUID()}/restock`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("VEHICLE_NOT_FOUND");
  }, 30000);

  it("rejects invalid vehicle IDs", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createUserToken("admin");

    const response = await request(app)
      .post("/api/vehicles/invalid-id/restock")
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  }, 30000);

  it("preserves both increments during concurrent restocks", async () => {
    const app = createTestApp({ database: getDatabase() });
    const token = await createUserToken("admin");
    const vehicleId = await createVehicle(2);

    const [first, second] = await Promise.all([
      request(app)
        .post(`/api/vehicles/${vehicleId}/restock`)
        .set("Authorization", `Bearer ${token}`)
        .send({ quantity: 3 }),

      request(app)
        .post(`/api/vehicles/${vehicleId}/restock`)
        .set("Authorization", `Bearer ${token}`)
        .send({ quantity: 4 }),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const result = await getDatabase().query<{
      quantity: number;
    }>("SELECT quantity FROM public.cars WHERE id = $1", [vehicleId]);

    expect(result.rows[0]?.quantity).toBe(9);
  }, 30000);
});
