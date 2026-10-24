import { describe, expect, it } from "vitest";
import { useTestDatabase } from "./helpers/database.js";

describe("User database constraints", () => {
  const getDatabase = useTestDatabase();

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
