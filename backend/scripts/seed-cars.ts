import { config } from "dotenv";
import { Client } from "pg";

config({ quiet: true });

interface SeedCar {
  make: string;
  model: string;
  year: number;
  price: string;
  mileage: number;
  fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | "cng";
  transmission: "manual" | "automatic";
  status: "available" | "reserved" | "sold";
}

const sampleCars: SeedCar[] = [
  {
    make: "Toyota",
    model: "Camry",
    year: 2022,
    price: "1850000.00",
    mileage: 25000,
    fuel_type: "hybrid",
    transmission: "automatic",
    status: "available",
  },
  {
    make: "Honda",
    model: "City",
    year: 2021,
    price: "950000.00",
    mileage: 35000,
    fuel_type: "petrol",
    transmission: "manual",
    status: "available",
  },
  {
    make: "Hyundai",
    model: "Creta",
    year: 2023,
    price: "1500000.00",
    mileage: 12000,
    fuel_type: "diesel",
    transmission: "automatic",
    status: "available",
  },
  {
    make: "Tata",
    model: "Nexon EV",
    year: 2024,
    price: "1600000.00",
    mileage: 8000,
    fuel_type: "electric",
    transmission: "automatic",
    status: "available",
  },
  {
    make: "Maruti Suzuki",
    model: "Baleno",
    year: 2022,
    price: "720000.00",
    mileage: 28000,
    fuel_type: "petrol",
    transmission: "manual",
    status: "available",
  },
  {
    make: "Mahindra",
    model: "XUV700",
    year: 2023,
    price: "2100000.00",
    mileage: 18000,
    fuel_type: "diesel",
    transmission: "automatic",
    status: "reserved",
  },
  {
    make: "Kia",
    model: "Seltos",
    year: 2022,
    price: "1250000.00",
    mileage: 30000,
    fuel_type: "petrol",
    transmission: "automatic",
    status: "available",
  },
  {
    make: "Volkswagen",
    model: "Polo",
    year: 2020,
    price: "650000.00",
    mileage: 45000,
    fuel_type: "petrol",
    transmission: "manual",
    status: "sold",
  },
  {
    make: "Skoda",
    model: "Slavia",
    year: 2023,
    price: "1350000.00",
    mileage: 15000,
    fuel_type: "petrol",
    transmission: "automatic",
    status: "available",
  },
  {
    make: "MG",
    model: "ZS EV",
    year: 2024,
    price: "1900000.00",
    mileage: 10000,
    fuel_type: "electric",
    transmission: "automatic",
    status: "available",
  },
  {
    make: "Toyota",
    model: "Innova Crysta",
    year: 2021,
    price: "1750000.00",
    mileage: 52000,
    fuel_type: "diesel",
    transmission: "manual",
    status: "reserved",
  },
  {
    make: "Maruti Suzuki",
    model: "Wagon R",
    year: 2020,
    price: "420000.00",
    mileage: 38000,
    fuel_type: "cng",
    transmission: "manual",
    status: "available",
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;

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
      throw new Error("Seeding is allowed only in car_dealership_dev.");
    }

    await client.query("BEGIN");

    let inserted = 0;
    let skipped = 0;

    for (const car of sampleCars) {
      const result = await client.query<{ id: string }>(
        `INSERT INTO public.cars (
          make,
          model,
          year,
          price,
          mileage,
          fuel_type,
          transmission,
          status
        )
        SELECT $1, $2, $3, $4, $5, $6, $7, $8
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.cars
          WHERE make = $1
            AND model = $2
            AND year = $3
            AND price = $4
            AND mileage = $5
            AND fuel_type = $6
            AND transmission = $7
        )
        RETURNING id`,
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

      if (result.rows.length > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }

    await client.query("COMMIT");

    console.log(`Sample cars inserted: ${inserted}`);
    console.log(`Existing cars skipped: ${skipped}`);
    console.log("Development inventory seeding complete.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Inventory seeding failed:",
    error instanceof Error ? error.message : String(error),
  );

  process.exitCode = 1;
});
