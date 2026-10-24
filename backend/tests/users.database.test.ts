import { describe, expect, it } from "vitest";
import { useTestDatabase } from "./helpers/database.js";

describe("User storage", () => {
  const getDatabase = useTestDatabase();

  it("creates a user with a generated ID and the default user role", async () => {
    const db = getDatabase();

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
  }, 30000);
});
