import type { RequestHandler } from "express";
import type { UserRepository } from "./user.repository.js";

export function createRequireAdmin(
  userRepository: UserRepository,
): RequestHandler {
  return async (_request, response, next) => {
    const authenticatedUser = response.locals.authenticatedUser;

    if (!authenticatedUser) {
      response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
      return;
    }

    const user = await userRepository.findById(authenticatedUser.id);

    if (!user) {
      response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
      return;
    }

    if (user.role !== "admin") {
      response.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions.",
        },
      });
      return;
    }

    response.locals.currentUser = user;

    next();
  };
}
