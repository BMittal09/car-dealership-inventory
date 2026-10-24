import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser, LoginResponse } from "../api/auth";
import { AuthContext } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

function getTokenExpiration(token: string): number | null {
  try {
    const payloadPart = token.split(".")[1];

    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");

    const payload = JSON.parse(atob(normalized)) as { exp?: unknown };

    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const [session, setSession] = useState<AuthSession | null>(null);

  const logout = useCallback(() => {
    // Immediately clear the authenticated session.
    setSession(null);

    // Clear cached queries synchronously so a later login
    // cannot be affected by delayed cleanup.
    queryClient.clear();
  }, [queryClient]);

  const login = useCallback(
    (result: LoginResponse) => {
      const expiration = getTokenExpiration(result.accessToken);

      if (!expiration || expiration <= Date.now()) {
        throw new Error("Invalid or expired authentication token.");
      }

      // Remove any data belonging to a previous session.
      queryClient.clear();

      setSession({
        user: result.user,
        accessToken: result.accessToken,
      });
    },
    [queryClient],
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    const expiration = getTokenExpiration(session.accessToken);

    const remaining = expiration ? expiration - Date.now() : 0;

    const timeout = window.setTimeout(
      () => {
        logout();
      },
      Math.max(0, Math.min(remaining, 2_147_483_647)),
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [session, logout]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: session !== null,
      login,
      logout,
    }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
