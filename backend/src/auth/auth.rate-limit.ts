import { rateLimit } from "express-rate-limit";

const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_AUTH_RATE_LIMIT_MAX = 10;

export function createAuthRateLimiters(max = DEFAULT_AUTH_RATE_LIMIT_MAX) {
  if (!Number.isSafeInteger(max) || max < 1) {
    throw new Error("Authentication rate limit must be a positive integer.");
  }

  const options = {
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit: max,
    standardHeaders: "draft-8" as const,
    legacyHeaders: false,
    handler: (
      _request: unknown,
      response: {
        status: (code: number) => {
          json: (body: unknown) => void;
        };
      },
    ) => {
      response.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many authentication requests. Please try again later.",
        },
      });
    },
  };

  return {
    loginLimiter: rateLimit({
      ...options,
    }),

    registrationLimiter: rateLimit({
      ...options,
    }),
  };
}
