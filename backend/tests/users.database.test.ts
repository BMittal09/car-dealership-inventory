import { config } from "dotenv";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

config({ quiet: true });

describe("User storage", () => {
  let client: Client | undefined;

  beforeAll(async () => {
    const connectionString = process.env.TEST_DATABASE_URL;

    if (!connectionString) {
      throw new Error("TEST_DATABASE_URL must be set before running tests.");
    }

    client = new Client({
      connectionString,
      connectionTimeoutMillis: 15000,
      query_timeout: 15000,
    });

    await client.connect();

    const result = await client.query<{ database_name: string }>(
      "SELECT current_database() AS database_name",
    );

    if (result.rows[0]?.database_name !== "car_dealership_test") {
      throw new Error("Database tests must connect to car_dealership_test.");
    }
  }, 30000);

  afterAll(async () => {
    if (client) {
      await client.end();
    }
  }, 10000);

  it("creates a user with a generated ID and the default user role", async () => {
    const db = client;

    if (!db) {
      throw new Error("The test database connection was not initialized.");
    }

    await db.query("BEGIN");

    try {
      const result = await db.query<{ id: string; role: string }>(
        `INSERT INTO public.users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, role`,
        [
          "Schema Test",
          "schema-check@example.com",
          "placeholder-hash-for-schema-test",
        ],
      );

      const user = result.rows[0];

      expect(user?.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(user?.role).toBe("user");
    } finally {
      await db.query("ROLLBACK");
    }
  }, 30000);
});
