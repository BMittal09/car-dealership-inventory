import type { Database } from "../database.js";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface CreateUserRecord {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  create(input: CreateUserRecord): Promise<PublicUser | null>;
}

export function createUserRepository(database: Database): UserRepository {
  return {
    async create(input: CreateUserRecord) {
      const result = await database.query<PublicUser>(
        `INSERT INTO public.users (name, email, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (LOWER(email)) DO NOTHING
         RETURNING id, name, email, role`,
        [input.name, input.email, input.passwordHash],
      );

      return result.rows[0] ?? null;
    },
  };
}
