import * as argon2 from "argon2";
import type { RegistrationInput } from "./registration.schema.js";
import type { PublicUser, UserRepository } from "./user.repository.js";

export interface AuthService {
  register(input: RegistrationInput): Promise<PublicUser | null>;
}

export function createAuthService(userRepository: UserRepository): AuthService {
  return {
    async register(input: RegistrationInput) {
      const passwordHash = await argon2.hash(input.password, {
        type: argon2.argon2id,
      });

      return userRepository.create({
        name: input.name,
        email: input.email,
        passwordHash,
      });
    },
  };
}
