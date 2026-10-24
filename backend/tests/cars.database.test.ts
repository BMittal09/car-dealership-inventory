import { describe, expect, it } from "vitest";
import { useTestDatabase } from "./helpers/database.js";

describe("Car inventory storage", () => {
  const getDatabase = useTestDatabase();

  it("creates a car with a generated ID, default status, and timestamps", async () => {
    const db = getDatabase();

    const result = await db.query<{
      id: string;
      make: string;
      model: string;
      year: number;
      price: string;
      mileage: number;
      fuel_type: string;
      transmission: string;
      status: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO public.cars (
         make,
         model,
         year,
         price,
         mileage,
         fuel_type,
         transmission
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      ["Toyota", "Camry", 2022, "1850000.00", 25000, "petrol", "automatic"],
    );

    const car = result.rows[0];

    expect(car).toBeDefined();

    expect(car?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    expect(car).toMatchObject({
      make: "Toyota",
      model: "Camry",
      year: 2022,
      price: "1850000.00",
      mileage: 25000,
      fuel_type: "petrol",
      transmission: "automatic",
      status: "available",
    });

    expect(car?.created_at).toBeInstanceOf(Date);
    expect(car?.updated_at).toBeInstanceOf(Date);
  }, 30000);
});
