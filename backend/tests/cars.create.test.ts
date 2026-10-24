import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("POST /api/cars", () => {
  const getDatabase = useTestDatabase();

  const validCar = {
    make: "Toyota",
    model: "Camry",
    category: "sedan",
    year: 2022,
    price: "1850000.00",
    quantity: 5,
    mileage: 25000,
    fuel_type: "petrol",
    transmission: "automatic",
  };

  async function createUserAndLogin(role: "user" | "admin"): Promise<string> {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const email = `car-${randomUUID()}@example.com`;
    const password = "Car-test-password-123!";

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      ["Car Inventory Test User", email, passwordHash, role],
    );

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toEqual(expect.any(String));

    return loginResponse.body.accessToken as string;
  }

  it("allows an administrator to create a car", async () => {
    const db = getDatabase();
    const app = createTestApp({ database: db });
    const token = await createUserAndLogin("admin");

    const response = await request(app)
      .post("/api/cars")
      .set("Authorization", `Bearer ${token}`)
      .send(validCar);

    expect(response.status).toBe(201);
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    expect(response.body).toEqual({
      car: {
        id: expect.any(String),
        ...validCar,
        status: "available",
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });

    const storedCar = await db.query(
      `SELECT * FROM public.cars WHERE id = $1`,
      [response.body.car.id],
    );

    expect(storedCar.rows).toHaveLength(1);
    expect(storedCar.rows[0]).toMatchObject(validCar);
  }, 30000);

  it("rejects unauthenticated requests", async () => {
    const app = createTestApp({
      database: getDatabase(),
    });

    const response = await request(app).post("/api/cars").send(validCar);

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

    const response = await request(app)
      .post("/api/cars")
      .set("Authorization", `Bearer ${token}`)
      .send(validCar);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "Insufficient permissions.",
      },
    });
  }, 30000);
});
