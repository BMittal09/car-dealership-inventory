import type { Database } from "../database.js";
import type { CarQueryInput } from "./car.query.schema.js";
import type { CreateCarInput, UpdateCarInput } from "./car.schema.js";

export interface Car {
  id: string;
  make: string;
  model: string;
  category: string;
  year: number;
  price: string;
  quantity: number;
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

export type PurchaseResult =
  | { outcome: "purchased"; car: Car }
  | { outcome: "out_of_stock" }
  | { outcome: "unavailable" }
  | { outcome: "not_found" };

export type RestockResult =
  | { outcome: "restocked"; car: Car }
  | { outcome: "not_found" }
  | { outcome: "quantity_overflow" };

export interface CarRepository {
  create(input: CreateCarInput): Promise<Car>;
  findAll(query: CarQueryInput): Promise<CarListResult>;
  findById(id: string): Promise<Car | null>;
  update(id: string, input: UpdateCarInput): Promise<Car | null>;
  delete(id: string): Promise<boolean>;
  purchase(id: string): Promise<PurchaseResult>;
  restock(id: string, quantity: number): Promise<RestockResult>;
}

const CAR_COLUMNS = `
  id, make, model, category, year, price,
  quantity, mileage, fuel_type, transmission,
  status, created_at, updated_at
`;

const MAX_QUANTITY = 2147483647;

export function createCarRepository(database: Database): CarRepository {
  return {
    async create(input: CreateCarInput) {
      const result = await database.query<Car>(
        `INSERT INTO public.cars (
          make, model, category, year, price,
          quantity, mileage, fuel_type, transmission
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING ${CAR_COLUMNS}`,
        [
          input.make,
          input.model,
          input.category,
          input.year,
          input.price,
          input.quantity,
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

      if (query.category) {
        addCondition("category", "ILIKE", query.category);
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

      const result = await database.query<Car>(
        `SELECT ${CAR_COLUMNS}
         FROM public.cars
         ${whereClause}
         ORDER BY created_at DESC, id DESC
         LIMIT $${values.length + 1}
         OFFSET $${values.length + 2}`,
        [...values, query.limit, offset],
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
        `SELECT ${CAR_COLUMNS}
         FROM public.cars
         WHERE id = $1`,
        [id],
      );

      return result.rows[0] ?? null;
    },

    async update(id: string, input: UpdateCarInput) {
      const allowedColumns = [
        "make",
        "model",
        "category",
        "year",
        "price",
        "quantity",
        "mileage",
        "fuel_type",
        "transmission",
        "status",
      ] as const;

      const updates: string[] = [];
      const values: unknown[] = [];

      for (const column of allowedColumns) {
        const value = input[column];

        if (value !== undefined) {
          values.push(value);
          updates.push(`${column} = $${values.length}`);
        }
      }

      if (updates.length === 0) {
        throw new Error("At least one update field is required.");
      }

      values.push(id);

      const result = await database.query<Car>(
        `UPDATE public.cars
         SET
           ${updates.join(", ")},
           updated_at = GREATEST(
             clock_timestamp(),
             updated_at + INTERVAL '1 millisecond'
           )
         WHERE id = $${values.length}
         RETURNING ${CAR_COLUMNS}`,
        values,
      );

      return result.rows[0] ?? null;
    },

    async delete(id: string) {
      const result = await database.query(
        `DELETE FROM public.cars
         WHERE id = $1
         RETURNING id`,
        [id],
      );

      return (result.rowCount ?? 0) > 0;
    },

    async purchase(id: string): Promise<PurchaseResult> {
      const result = await database.query<Car>(
        `UPDATE public.cars
         SET
           quantity = quantity - 1,
           updated_at = GREATEST(
             clock_timestamp(),
             updated_at + INTERVAL '1 millisecond'
           )
         WHERE id = $1
           AND quantity > 0
           AND status = 'available'
         RETURNING ${CAR_COLUMNS}`,
        [id],
      );

      const purchasedCar = result.rows[0];

      if (purchasedCar) {
        return {
          outcome: "purchased",
          car: purchasedCar,
        };
      }

      const existingCar = await database.query<{
        quantity: number;
        status: Car["status"];
      }>(
        `SELECT quantity, status
         FROM public.cars
         WHERE id = $1`,
        [id],
      );

      const car = existingCar.rows[0];

      if (!car) {
        return { outcome: "not_found" };
      }

      if (car.status !== "available") {
        return { outcome: "unavailable" };
      }

      return { outcome: "out_of_stock" };
    },

    async restock(id: string, quantity: number): Promise<RestockResult> {
      // Atomic increment prevents lost updates when
      // multiple administrators restock simultaneously.
      const result = await database.query<Car>(
        `UPDATE public.cars
         SET
           quantity = quantity + $2,
           updated_at = GREATEST(
             clock_timestamp(),
             updated_at + INTERVAL '1 millisecond'
           )
         WHERE id = $1
           AND quantity <= $3::integer - $2::integer
         RETURNING ${CAR_COLUMNS}`,
        [id, quantity, MAX_QUANTITY],
      );

      const restockedCar = result.rows[0];

      if (restockedCar) {
        return {
          outcome: "restocked",
          car: restockedCar,
        };
      }

      const existingCar = await database.query<{ id: string }>(
        `SELECT id
         FROM public.cars
         WHERE id = $1`,
        [id],
      );

      if (!existingCar.rows[0]) {
        return { outcome: "not_found" };
      }

      return { outcome: "quantity_overflow" };
    },
  };
}
