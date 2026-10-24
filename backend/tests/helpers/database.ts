import { config } from "dotenv";
import { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

config({ quiet: true });

export function useTestDatabase(): () => Client {
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

  return getDatabase;
}
