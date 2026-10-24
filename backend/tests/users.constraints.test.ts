import { config } from "dotenv";
import { Client } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

config({ quiet: true });

describe("User database constraints", () => {
  let client: Client | undefined;

  function getDatabase(): Client {
    if (!client) {
      throw new Error("The test database connection was not initialized.");
    }

    return client;
  }

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

  beforeEach(async () => {
    await getDatabase().query("BEGIN");
  }, 30000);

  afterEach(async () => {
    if (client) {
      await client.query("ROLLBACK");
    }
  }, 30000);

  afterAll(async () => {
    if (client) {
      await client.end();
    }
  }, 10000);

  it.each(["buyer@example.com", "BUYER@example.com"])(
    "rejects a duplicate email: %s",
    async (duplicateEmail) => {
      const db = getDatabase();

      await db.query(
        `INSERT INTO public.users (name, email, password_hash)
         VALUES ($1, $2, $3)`,
        [
          "First Buyer",
          "buyer@example.com",
          "placeholder-hash-for-schema-test",
        ],
      );

      await expect(
        db.query(
          `INSERT INTO public.users (name, email, password_hash)
           VALUES ($1, $2, $3)`,
          ["Second Buyer", duplicateEmail, "placeholder-hash-for-schema-test"],
        ),
      ).rejects.toMatchObject({
        code: "23505",
      });
    },
    30000,
  );

  it("rejects an unsupported role", async () => {
    const db = getDatabase();

    await expect(
      db.query(
        `INSERT INTO public.users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)`,
        [
          "Invalid Role",
          "invalid-role@example.com",
          "placeholder-hash-for-schema-test",
          "manager",
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });
  }, 30000);

  it("allows an explicit admin role", async () => {
    const db = getDatabase();

    const result = await db.query<{ role: string }>(
      `INSERT INTO public.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING role`,
      [
        "Admin Fixture",
        "admin-fixture@example.com",
        "placeholder-hash-for-schema-test",
        "admin",
      ],
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.role).toBe("admin");
  }, 30000);
});
