import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createAuthMiddleware } from "./auth/auth.middleware.js";
import { createAuthRateLimiters } from "./auth/auth.rate-limit.js";
import { createAuthRouter } from "./auth/auth.routes.js";
import { createAuthService } from "./auth/auth.service.js";
import { createRequireAdmin } from "./auth/authorization.middleware.js";
import { createTokenService } from "./auth/token.service.js";
import { createUserRepository } from "./auth/user.repository.js";
import { createCarRepository } from "./cars/car.repository.js";
import { createCarRouter } from "./cars/car.routes.js";
import { createCarService } from "./cars/car.service.js";
import { createVehicleRouter } from "./cars/vehicle.routes.js";
import type { Database } from "./database.js";
import { errorHandler } from "./middleware/error.middleware.js";

export interface AppDependencies {
  database: Database;
  jwtSecret: string;
  allowedOrigins?: string[];
  authRateLimitMax?: number;
}

export function createApp({
  database,
  jwtSecret,
  allowedOrigins = [],
  authRateLimitMax = 10,
}: AppDependencies) {
  const app = express();

  const userRepository = createUserRepository(database);
  const tokenService = createTokenService(jwtSecret);
  const authService = createAuthService(userRepository, tokenService);

  const carRepository = createCarRepository(database);
  const carService = createCarService(carRepository);

  const requireAuth = createAuthMiddleware(tokenService);
  const requireAdmin = createRequireAdmin(userRepository);

  const { loginLimiter, registrationLimiter } =
    createAuthRateLimiters(authRateLimitMax);

  app.disable("x-powered-by");

  app.use(helmet());

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
      optionsSuccessStatus: 204,
    }),
  );

  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  // Apply separate rate limits before authentication routes.
  app.use("/api/auth/login", loginLimiter);
  app.use("/api/auth/register", registrationLimiter);

  app.use("/api/auth", createAuthRouter(authService));

  app.get("/api/auth/me", requireAuth, async (_request, response) => {
    const authenticatedUser = response.locals.authenticatedUser;

    if (!authenticatedUser) {
      response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
      return;
    }

    const user = await userRepository.findById(authenticatedUser.id);

    if (!user) {
      response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
      return;
    }

    response.status(200).json({ user });
  });

  app.get(
    "/api/admin/health",
    requireAuth,
    requireAdmin,
    (_request, response) => {
      response.status(200).json({ status: "ok" });
    },
  );

  // Existing AutoVault endpoints remain unchanged.
  app.use("/api/cars", createCarRouter(carService, requireAuth, requireAdmin));

  // TDD Kata vehicle endpoints.
  app.use(
    "/api/vehicles",
    createVehicleRouter(carService, requireAuth, requireAdmin),
  );

  app.use(errorHandler);

  return app;
}
