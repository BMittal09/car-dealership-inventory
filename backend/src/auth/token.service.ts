import { SignJWT } from "jose";
import type { PublicUser } from "./user.repository.js";

export const ACCESS_TOKEN_ALGORITHM = "HS256";
export const ACCESS_TOKEN_ISSUER = "car-dealership-auth";
export const ACCESS_TOKEN_AUDIENCE = "car-dealership-api";
export const ACCESS_TOKEN_LIFETIME_SECONDS = 3600;

export interface TokenService {
  issue(user: PublicUser): Promise<string>;
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
  };
}
