import * as argon2 from "argon2";
import express from "express";
import type { Pool } from "pg";

export interface AppDependencies {
  database: Pick<Pool, "query">;
}

interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export function createApp({ database }: AppDependencies) {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.post("/api/auth/register", async (request, response) => {
    const { name, email, password } = request.body;

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const result = await database.query<PublicUser>(
      `INSERT INTO public.users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role`,
      [name, email, passwordHash],
    );

    const user = result.rows[0];

    if (!user) {
      throw new Error("User insertion did not return a user.");
    }

    response.status(201).json({ user });
  });

  return app;
}
