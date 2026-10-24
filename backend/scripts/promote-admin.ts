import { config } from "dotenv";
import { Client } from "pg";

config({ quiet: true });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error("Usage: npx tsx scripts/promote-admin.ts <email>");
  }

  if (!connectionString || connectionString.startsWith("REPLACE_")) {
    throw new Error("DATABASE_URL must be configured.");
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15000,
    query_timeout: 15000,
  });

  try {
    await client.connect();

    const databaseResult = await client.query<{
      database_name: string;
    }>("SELECT current_database() AS database_name");

    if (databaseResult.rows[0]?.database_name !== "car_dealership_dev") {
      throw new Error(
        "Administrator promotion is allowed only in car_dealership_dev.",
      );
    }

    const existingUser = await client.query<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>(
      `SELECT id, name, email, role
       FROM public.users
       WHERE LOWER(email) = LOWER($1)`,
      [email],
    );

    const user = existingUser.rows[0];

    if (!user) {
      throw new Error("No registered user exists with the supplied email.");
    }

    if (user.role === "admin") {
      console.log("This account is already an administrator.");
      return;
    }

    const result = await client.query<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>(
      `UPDATE public.users
       SET role = 'admin'
       WHERE id = $1
       RETURNING id, name, email, role`,
      [user.id],
    );

    const updatedUser = result.rows[0];

    if (!updatedUser) {
      throw new Error("Administrator promotion failed.");
    }

    console.log("Administrator promotion successful.");
    console.log(`Account: ${updatedUser.email}`);
    console.log(`Role: ${updatedUser.role}`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Administrator setup failed:",
    error instanceof Error ? error.message : String(error),
  );

  process.exitCode = 1;
});
