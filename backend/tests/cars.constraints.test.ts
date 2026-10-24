import { describe, expect, it } from "vitest";
import { useTestDatabase } from "./helpers/database.js";

describe("Car inventory database constraints", () => {
  const getDatabase = useTestDatabase();

  const validCar = {
    make: "Toyota",
    model: "Camry",
    year: 2022,
    price: "1850000.00",
    mileage: 25000,
    fuel_type: "petrol",
    transmission: "automatic",
    status: "available",
  };

  async function insertCar(overrides: Record<string, unknown> = {}) {
    const car = { ...validCar, ...overrides };

    return getDatabase().query(
      `INSERT INTO public.cars (
         make, model, year, price, mileage,
         fuel_type, transmission, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        car.make,
        car.model,
        car.year,
        car.price,
        car.mileage,
        car.fuel_type,
        car.transmission,
        car.status,
      ],
    );
  }

  it("rejects a negative price", async () => {
    await expect(insertCar({ price: "-1.00" })).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("rejects negative mileage", async () => {
    await expect(insertCar({ mileage: -1 })).rejects.toMatchObject({
      code: "23514",
    });
  });

  it.each([1879, 2101])(
    "rejects an unsupported manufacturing year: %i",
    async (year) => {
      await expect(insertCar({ year })).rejects.toMatchObject({
        code: "23514",
      });
    },
  );

  it("rejects an unsupported fuel type", async () => {
    await expect(insertCar({ fuel_type: "steam" })).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("rejects an unsupported transmission", async () => {
    await expect(insertCar({ transmission: "unknown" })).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("rejects an unsupported status", async () => {
    await expect(insertCar({ status: "destroyed" })).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("rejects a missing required make", async () => {
    await expect(insertCar({ make: null })).rejects.toMatchObject({
      code: "23502",
    });
  });

  it("rejects a missing required model", async () => {
    await expect(insertCar({ model: null })).rejects.toMatchObject({
      code: "23502",
    });
  });
});
