import type { RequestHandler } from "express";
import type { TokenService } from "./token.service.js";

export function createAuthMiddleware(
  tokenService: TokenService,
): RequestHandler {
  return async (request, response, next) => {
    const unauthorized = () => {
      response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
    };

    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer ([^\s]+)$/);

    if (!match) {
      unauthorized();
      return;
    }

    const token = match[1];

    if (!token) {
      unauthorized();
      return;
    }

    const authenticatedUser = await tokenService.verify(token);

    if (!authenticatedUser) {
      unauthorized();
      return;
    }

    response.locals.authenticatedUser = authenticatedUser;

    next();
  };
}
