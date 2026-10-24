import { jwtVerify, SignJWT } from "jose";
import type { PublicUser } from "./user.repository.js";

export const ACCESS_TOKEN_ALGORITHM = "HS256";
export const ACCESS_TOKEN_ISSUER = "car-dealership-auth";
export const ACCESS_TOKEN_AUDIENCE = "car-dealership-api";
export const ACCESS_TOKEN_LIFETIME_SECONDS = 3600;

export interface AuthenticatedUser {
  id: string;
  role: PublicUser["role"];
}

export interface TokenService {
  issue(user: PublicUser): Promise<string>;
  verify(token: string): Promise<AuthenticatedUser | null>;
}

export function createTokenService(jwtSecret: string): TokenService {
  const signingKey = new TextEncoder().encode(jwtSecret);

  return {
    async issue(user: PublicUser) {
      const issuedAt = Math.floor(Date.now() / 1000);

      return new SignJWT({
        role: user.role,
      })
        .setProtectedHeader({
          alg: ACCESS_TOKEN_ALGORITHM,
          typ: "JWT",
        })
        .setSubject(user.id)
        .setIssuer(ACCESS_TOKEN_ISSUER)
        .setAudience(ACCESS_TOKEN_AUDIENCE)
        .setIssuedAt(issuedAt)
        .setExpirationTime(issuedAt + ACCESS_TOKEN_LIFETIME_SECONDS)
        .sign(signingKey);
    },

    async verify(token: string) {
      try {
        const { payload } = await jwtVerify(token, signingKey, {
          algorithms: [ACCESS_TOKEN_ALGORITHM],
          issuer: ACCESS_TOKEN_ISSUER,
          audience: ACCESS_TOKEN_AUDIENCE,
        });

        if (
          typeof payload.sub !== "string" ||
          (payload.role !== "user" && payload.role !== "admin")
        ) {
          return null;
        }

        return {
          id: payload.sub,
          role: payload.role,
        };
      } catch {
        return null;
      }
    },
  };
}
