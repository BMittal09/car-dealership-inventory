import { config } from "dotenv";
import { Pool } from "pg";
import { createApp } from "./app.js";

config({ quiet: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set before starting the server.");
}

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 15000,
  query_timeout: 15000,
  max: 5,
});

pool.on("error", (error) => {
  console.error("Unexpected database connection error:", error.message);
});

const app = createApp({ database: pool });
const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0", (error) => {
  if (error) {
    throw error;
  }

  console.log(`API running at http://localhost:${port}`);
});
