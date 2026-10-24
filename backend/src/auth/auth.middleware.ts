import type { RequestHandler } from "express";
import type { AuthenticatedUser, TokenService } from "./token.service.js";

export interface AuthenticatedRequest {
  authenticatedUser?: AuthenticatedUser;
}

export function createAuthMiddleware(
  tokenService: TokenService,
): RequestHandler {
  return async (request, response, next) => {
    const authorization = request.headers.authorization;

    const match = authorization?.match(/^Bearer ([^\s]+)$/);

    if (!match) {
      response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });

      return;
    }

    const token = match[1];

    if (!token) {
      response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });

      return;
    }

    const authenticatedUser = await tokenService.verify(token);

    if (!authenticatedUser) {
      response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });

      return;
    }

    response.locals.authenticatedUser = authenticatedUser;

    next();
  };
}
