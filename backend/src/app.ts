import express from "express";
import type { Pool } from "pg";

export interface AppDependencies {
  database: Pick<Pool, "query">;
}

export function createApp(_dependencies: AppDependencies) {
  const app = express();

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  return app;
}
