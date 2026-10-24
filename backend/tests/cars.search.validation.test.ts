import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/app.js";
import { useTestDatabase } from "./helpers/database.js";

describe("GET /api/cars query validation", () => {
  const getDatabase = useTestDatabase();

  const invalidQueries = [
    { name: "page zero", query: { page: "0" } },
    { name: "negative page", query: { page: "-1" } },
    { name: "non-numeric page", query: { page: "abc" } },
    { name: "decimal page", query: { page: "1.5" } },
    { name: "limit zero", query: { limit: "0" } },
    { name: "limit above maximum", query: { limit: "101" } },
    { name: "non-numeric limit", query: { limit: "abc" } },
    { name: "invalid fuel type", query: { fuel_type: "steam" } },
    { name: "invalid transmission", query: { transmission: "unknown" } },
    { name: "invalid status", query: { status: "destroyed" } },
    { name: "negative minimum price", query: { min_price: "-100" } },
    { name: "negative maximum price", query: { max_price: "-100" } },
    {
      name: "minimum price greater than maximum",
      query: { min_price: "2000000", max_price: "1000000" },
    },
    { name: "unexpected parameter", query: { owner: "someone" } },
  ];

  it.each(invalidQueries)("rejects $name", async ({ query }) => {
    const app = createTestApp({ database: getDatabase() });

    const response = await request(app).get("/api/cars").query(query);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid inventory query parameters.",
      },
    });
  });
});
