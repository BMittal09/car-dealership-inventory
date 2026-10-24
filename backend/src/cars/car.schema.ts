import * as z from "zod";

export const createCarSchema = z.strictObject({
  make: z.string().trim().min(1).max(100),

  model: z.string().trim().min(1).max(100),

  year: z.number().int().min(1886).max(2100),

  price: z.string().regex(/^(0|[1-9]\d{0,9})\.\d{2}$/),

  mileage: z.number().int().min(0),

  fuel_type: z.enum(["petrol", "diesel", "electric", "hybrid", "cng"]),

  transmission: z.enum(["manual", "automatic"]),
});

export type CreateCarInput = z.infer<typeof createCarSchema>;
