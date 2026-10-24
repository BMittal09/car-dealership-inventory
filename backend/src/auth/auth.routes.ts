import { Router } from "express";
import type { AuthService } from "./auth.service.js";
import { registrationSchema } from "./registration.schema.js";

export function createAuthRouter(authService: AuthService) {
  const router = Router();

  router.post("/register", async (request, response) => {
    const validation = registrationSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid registration data.",
        },
      });

      return;
    }

    const user = await authService.register(validation.data);

    if (!user) {
      response.status(409).json({
        error: {
          code: "EMAIL_IN_USE",
          message: "Email is already registered.",
        },
      });

      return;
    }

    response.status(201).json({ user });
  });

  router.post("/login", async (request, response) => {
    const result = await authService.login(request.body);

    if (!result) {
      response.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });

      return;
    }

    response.status(200).json(result);
  });

  return router;
}
