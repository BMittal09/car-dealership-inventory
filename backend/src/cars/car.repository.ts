import type { Database } from "../database.js";
import type { CarQueryInput } from "./car.query.schema.js";
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

export interface CarListResult {
  cars: Car[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CarRepository {
  create(input: CreateCarInput): Promise<Car>;
  findAll(query: CarQueryInput): Promise<CarListResult>;
  findById(id: string): Promise<Car | null>;
}

export function createCarRepository(database: Database): CarRepository {
  return {
    async create(input: CreateCarInput) {
      const result = await database.query<Car>(
        `INSERT INTO public.cars (
          make, model, year, price, mileage,
          fuel_type, transmission
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id, make, model, year, price, mileage,
          fuel_type, transmission, status,
          created_at, updated_at`,
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

    async findAll(query: CarQueryInput) {
      const conditions: string[] = [];
      const values: unknown[] = [];

      function addCondition(column: string, operator: string, value: unknown) {
        values.push(value);
        conditions.push(`${column} ${operator} $${values.length}`);
      }

      if (query.search) {
        values.push(`%${query.search}%`);
        conditions.push(
          `(make ILIKE $${values.length} OR model ILIKE $${values.length})`,
        );
      }

      if (query.make) {
        addCondition("make", "ILIKE", query.make);
      }

      if (query.fuel_type) {
        addCondition("fuel_type", "=", query.fuel_type);
      }

      if (query.transmission) {
        addCondition("transmission", "=", query.transmission);
      }

      if (query.status) {
        addCondition("status", "=", query.status);
      }

      if (query.min_price !== undefined) {
        addCondition("price", ">=", query.min_price);
      }

      if (query.max_price !== undefined) {
        addCondition("price", "<=", query.max_price);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const countResult = await database.query<{ total: string }>(
        `SELECT COUNT(*) AS total
         FROM public.cars
         ${whereClause}`,
        values,
      );

      const total = Number(countResult.rows[0]?.total ?? 0);

      const offset = (query.page - 1) * query.limit;

      const paginationValues = [...values, query.limit, offset];

      const limitParameter = values.length + 1;
      const offsetParameter = values.length + 2;

      const result = await database.query<Car>(
        `SELECT
          id, make, model, year, price, mileage,
          fuel_type, transmission, status,
          created_at, updated_at
         FROM public.cars
         ${whereClause}
         ORDER BY created_at DESC, id DESC
         LIMIT $${limitParameter}
         OFFSET $${offsetParameter}`,
        paginationValues,
      );

      return {
        cars: result.rows,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    },

    async findById(id: string) {
      const result = await database.query<Car>(
        `SELECT
          id, make, model, year, price, mileage,
          fuel_type, transmission, status,
          created_at, updated_at
         FROM public.cars
         WHERE id = $1`,
        [id],
      );

      return result.rows[0] ?? null;
    },
  };
}
