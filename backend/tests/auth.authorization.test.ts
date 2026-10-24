import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("GET /api/admin/health authorization", () => {
  const getDatabase = useTestDatabase();

  async function createUser(
    role: "user" | "admin",
  ): Promise<{ email: string; password: string }> {
    const db = getDatabase();

    const email = `rbac-${randomUUID()}@example.com`;
    const password = "RBAC-test-password-123!";
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db.query(
      `INSERT INTO public.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      ["RBAC Test User", email, passwordHash, role],
    );

    return { email, password };
  }

  async function login(email: string, password: string): Promise<string> {
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));

    return response.body.accessToken as string;
  }

  it("rejects requests without authentication", async () => {
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app).get("/api/admin/health");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    });
  });

  it("rejects authenticated regular users", async () => {
    const app = createTestApp({ database: getDatabase() });
    const user = await createUser("user");
    const token = await login(user.email, user.password);

    const response = await request(app)
      .get("/api/admin/health")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "Insufficient permissions.",
      },
    });
  }, 30000);

  it("allows authenticated administrators", async () => {
    const app = createTestApp({ database: getDatabase() });
    const admin = await createUser("admin");
    const token = await login(admin.email, admin.password);

    const response = await request(app)
      .get("/api/admin/health")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
    });
  }, 30000);

  it("rejects a former administrator after their role changes", async () => {
    const db = getDatabase();
    const app = createTestApp({ database: db });

    const admin = await createUser("admin");
    const token = await login(admin.email, admin.password);

    await db.query(`UPDATE public.users SET role = 'user' WHERE email = $1`, [
      admin.email,
    ]);

    const response = await request(app)
      .get("/api/admin/health")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "Insufficient permissions.",
      },
    });
  }, 30000);
});
