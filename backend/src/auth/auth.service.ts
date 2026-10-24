import * as argon2 from "argon2";
import type { RegistrationInput } from "./registration.schema.js";
import type { TokenService } from "./token.service.js";
import type { PublicUser, UserRepository } from "./user.repository.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: PublicUser;
}

export interface AuthService {
  register(input: RegistrationInput): Promise<PublicUser | null>;
  login(input: LoginInput): Promise<LoginResult | null>;
}

export function createAuthService(
  userRepository: UserRepository,
  tokenService: TokenService,
): AuthService {
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

    async login(input: LoginInput) {
      const storedUser = await userRepository.findByEmail(input.email);

      if (!storedUser) {
        return null;
      }

      const passwordMatches = await argon2.verify(
        storedUser.password_hash,
        input.password,
      );

      if (!passwordMatches) {
        return null;
      }

      const user: PublicUser = {
        id: storedUser.id,
        name: storedUser.name,
        email: storedUser.email,
        role: storedUser.role,
      };

      const accessToken = await tokenService.issue(user);

      return {
        accessToken,
        user,
      };
    },
  };
}
