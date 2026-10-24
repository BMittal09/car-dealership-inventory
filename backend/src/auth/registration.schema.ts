import * as z from "zod";

export const registrationSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),

  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),

  password: z.string().min(15).max(128),
});
