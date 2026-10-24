import * as z from "zod";

const positiveInteger = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().safe().positive());

const priceFilter = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/)
  .transform(Number)
  .pipe(z.number().finite().min(0).max(9999999999.99));

export const carQuerySchema = z
  .strictObject({
    search: z.string().trim().min(1).max(100).optional(),

    make: z.string().trim().min(1).max(100).optional(),

    fuel_type: z
      .enum(["petrol", "diesel", "electric", "hybrid", "cng"])
      .optional(),

    transmission: z.enum(["manual", "automatic"]).optional(),

    status: z.enum(["available", "reserved", "sold"]).optional(),

    min_price: priceFilter.optional(),

    max_price: priceFilter.optional(),

    page: positiveInteger.default(1),

    limit: positiveInteger.pipe(z.number().max(100)).default(10),
  })
  .refine(
    (data) =>
      data.min_price === undefined ||
      data.max_price === undefined ||
      data.min_price <= data.max_price,
    {
      message: "Minimum price cannot exceed maximum price.",
    },
  );

export type CarQueryInput = z.infer<typeof carQuerySchema>;
