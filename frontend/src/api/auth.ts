import { ApiError } from "./cars";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface CurrentUserResponse {
  user: AuthUser;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let code = "API_ERROR";
    let message = "Something went wrong. Please try again.";

    try {
      const body: {
        error?: {
          code?: string;
          message?: string;
        };
      } = await response.json();

      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch {
      // Keep the fallback error if the response is not JSON.
    }

    throw new ApiError(response.status, code, message);
  }

  return (await response.json()) as T;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<LoginResponse>(response);
}

export async function register(
  input: RegisterInput,
): Promise<RegisterResponse> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<RegisterResponse>(response);
}

export async function getCurrentUser(
  accessToken: string,
  signal?: AbortSignal,
): Promise<CurrentUserResponse> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  return parseApiResponse<CurrentUserResponse>(response);
}

export interface AdminVerificationResponse {
  status: "ok";
}

export async function verifyAdminAccess(
  accessToken: string,
  signal?: AbortSignal,
): Promise<AdminVerificationResponse> {
  const response = await fetch("/api/admin/health", {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  return parseApiResponse<AdminVerificationResponse>(response);
}
