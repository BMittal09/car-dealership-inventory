import { randomBytes } from "node:crypto";
import { createApp, type AppDependencies } from "../../src/app.js";

export const TEST_JWT_SECRET = randomBytes(32).toString("hex");

export function createTestApp(dependencies: Pick<AppDependencies, "database">) {
  return createApp({
    ...dependencies,
    jwtSecret: TEST_JWT_SECRET,
  });
}
