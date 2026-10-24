import type { Database } from "../database.js";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface UserWithPassword extends PublicUser {
  password_hash: string;
}

export interface CreateUserRecord {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  create(input: CreateUserRecord): Promise<PublicUser | null>;
  findByEmail(email: string): Promise<UserWithPassword | null>;
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

    async findByEmail(email: string) {
      const result = await database.query<UserWithPassword>(
        `SELECT id, name, email, password_hash, role
         FROM public.users
         WHERE LOWER(email) = LOWER($1)`,
        [email],
      );

      return result.rows[0] ?? null;
    },
  };
}
