import { config } from "dotenv";
import { Pool } from "pg";
import { createApp } from "./app.js";
import { createShutdownHandler } from "./shutdown.js";

config({ quiet: true });

const connectionString = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set before starting the server.");
}

if (
  !jwtSecret ||
  jwtSecret.startsWith("REPLACE_") ||
  Buffer.byteLength(jwtSecret, "utf8") < 32
) {
  throw new Error(
    "JWT_SECRET must contain a generated signing secret of at least 32 bytes.",
  );
}

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 15000,
  query_timeout: 15000,
  max: 5,
});

pool.on("error", (error) => {
  console.error("Unexpected database connection error:", error.message);
});

const app = createApp({
  database: pool,
  jwtSecret,
  allowedOrigins,
});

const port = Number(process.env.PORT ?? 3000);

const server = app.listen(port, "0.0.0.0", (error) => {
  if (error) {
    throw error;
  }

  console.log(`API running at http://localhost:${port}`);
});

const shutdown = createShutdownHandler(server, pool);

function handleShutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  void shutdown()
    .then(() => {
      console.log("Server and database connections closed.");
      process.exitCode = 0;
    })
    .catch((error: unknown) => {
      console.error("Graceful shutdown failed:", error);
      process.exitCode = 1;
    });
}

process.once("SIGINT", () => {
  handleShutdown("SIGINT");
});

process.once("SIGTERM", () => {
  handleShutdown("SIGTERM");
});
