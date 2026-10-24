import * as z from "zod";

export const loginSchema = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),

  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
