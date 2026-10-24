import express from "express";
import { createAuthRouter } from "./auth/auth.routes.js";
import { createAuthService } from "./auth/auth.service.js";
import { createTokenService } from "./auth/token.service.js";
import { createUserRepository } from "./auth/user.repository.js";
import type { Database } from "./database.js";

export interface AppDependencies {
  database: Database;
  jwtSecret: string;
}

export function createApp({ database, jwtSecret }: AppDependencies) {
  const app = express();

  const userRepository = createUserRepository(database);
  const tokenService = createTokenService(jwtSecret);
  const authService = createAuthService(userRepository, tokenService);

  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use("/api/auth", createAuthRouter(authService));

  return app;
}
