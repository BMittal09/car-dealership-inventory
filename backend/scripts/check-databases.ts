import { config } from "dotenv";
import { Client } from "pg";

config({ quiet: true });

const targets = [
  ["DATABASE_URL", "car_dealership_dev"],
  ["TEST_DATABASE_URL", "car_dealership_test"],
] as const;

for (const [variable, expectedDatabase] of targets) {
  const connectionString = process.env[variable];

  if (!connectionString || connectionString.startsWith("REPLACE_")) {
    console.error(`FAIL ${variable}: set its value in backend/.env.`);
    process.exitCode = 1;
    continue;
  }

  let client: Client | undefined;

  try {
    client = new Client({
      connectionString,
      connectionTimeoutMillis: 15000,
      query_timeout: 15000,
    });

    await client.connect();

    const result = await client.query<{ database_name: string }>(
      "SELECT current_database() AS database_name",
    );

    const actualDatabase = result.rows[0]?.database_name;

    if (actualDatabase !== expectedDatabase) {
      console.error(
        `FAIL ${variable}: wrong database; expected ${expectedDatabase}.`,
      );
      process.exitCode = 1;
      continue;
    }

    console.log(`PASS ${variable}: connected to ${actualDatabase}`);
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? String(error.code)
        : "UNKNOWN";

    console.error(`FAIL ${variable}: connection failed (${code}).`);
    process.exitCode = 1;
  } finally {
    if (client) {
      await client.end();
    }
  }
}
