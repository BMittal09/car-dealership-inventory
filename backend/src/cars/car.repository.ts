import type { Database } from "../database.js";
import type { CreateCarInput } from "./car.schema.js";

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: string;
  mileage: number;
  fuel_type: CreateCarInput["fuel_type"];
  transmission: CreateCarInput["transmission"];
  status: "available" | "reserved" | "sold";
  created_at: Date;
  updated_at: Date;
}

export interface CarRepository {
  create(input: CreateCarInput): Promise<Car>;
  findAll(): Promise<Car[]>;
  findById(id: string): Promise<Car | null>;
}

export function createCarRepository(database: Database): CarRepository {
  return {
    async create(input: CreateCarInput) {
      const result = await database.query<Car>(
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
        RETURNING
          id,
          make,
          model,
          year,
          price,
          mileage,
          fuel_type,
          transmission,
          status,
          created_at,
          updated_at`,
        [
          input.make,
          input.model,
          input.year,
          input.price,
          input.mileage,
          input.fuel_type,
          input.transmission,
        ],
      );

      const car = result.rows[0];

      if (!car) {
        throw new Error("Car insertion did not return a record.");
      }

      return car;
    },

    async findAll() {
      const result = await database.query<Car>(
        `SELECT
          id,
          make,
          model,
          year,
          price,
          mileage,
          fuel_type,
          transmission,
          status,
          created_at,
          updated_at
         FROM public.cars
         ORDER BY created_at DESC, id DESC`,
      );

      return result.rows;
    },

    async findById(id: string) {
      const result = await database.query<Car>(
        `SELECT
          id,
          make,
          model,
          year,
          price,
          mileage,
          fuel_type,
          transmission,
          status,
          created_at,
          updated_at
         FROM public.cars
         WHERE id = $1`,
        [id],
      );

      return result.rows[0] ?? null;
    },
  };
}
