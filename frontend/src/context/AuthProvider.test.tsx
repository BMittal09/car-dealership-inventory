import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import AuthProvider from "./AuthProvider";
import { useAuth } from "../hooks/useAuth";
import type { LoginResponse } from "../api/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function createTestToken(expiresInSeconds: number): string {
  const payload = {
    sub: "test-user-id",
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `header.${encodedPayload}.signature`;
}

const testUser: LoginResponse["user"] = {
  id: "test-user-id",
  name: "Test User",
  email: "test@example.com",
  role: "user",
};

function AuthTestComponent() {
  const { user, accessToken, isAuthenticated, login, logout } = useAuth();

  const [error, setError] = useState("");

  function handleLogin() {
    login({
      accessToken: createTestToken(3600),
      user: testUser,
    });
  }

  function handleExpiredLogin() {
    try {
      login({
        accessToken: createTestToken(-60),
        user: testUser,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unknown error",
      );
    }
  }

  function handleInvalidLogin() {
    try {
      login({
        accessToken: "invalid-token",
        user: testUser,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unknown error",
      );
    }
  }

  return (
    <div>
      <p data-testid="auth-status">
        {isAuthenticated ? "Authenticated" : "Logged out"}
      </p>

      <p data-testid="user-name">{user?.name ?? "No user"}</p>

      <p data-testid="token-status">
        {accessToken ? "Token present" : "No token"}
      </p>

      {error && <p role="alert">{error}</p>}

      <button type="button" onClick={handleLogin}>
        Log in
      </button>

      <button type="button" onClick={logout}>
        Log out
      </button>

      <button type="button" onClick={handleExpiredLogin}>
        Expired login
      </button>

      <button type="button" onClick={handleInvalidLogin}>
        Invalid login
      </button>
    </div>
  );
}

function renderAuthProvider() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("AuthProvider", () => {
  it("starts with no authenticated user", () => {
    renderAuthProvider();

    expect(screen.getByTestId("auth-status")).toHaveTextContent("Logged out");

    expect(screen.getByTestId("user-name")).toHaveTextContent("No user");

    expect(screen.getByTestId("token-status")).toHaveTextContent("No token");
  });

  it("stores the authenticated user and token after login", async () => {
    const user = userEvent.setup();

    renderAuthProvider();

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByTestId("auth-status")).toHaveTextContent(
      "Authenticated",
    );

    expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");

    expect(screen.getByTestId("token-status")).toHaveTextContent(
      "Token present",
    );
  });

  it("clears authentication state after logout", async () => {
    const user = userEvent.setup();

    renderAuthProvider();

    await user.click(screen.getByRole("button", { name: "Log in" }));

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(screen.getByTestId("auth-status")).toHaveTextContent("Logged out");

    expect(screen.getByTestId("user-name")).toHaveTextContent("No user");

    expect(screen.getByTestId("token-status")).toHaveTextContent("No token");
  });

  it("rejects expired authentication tokens", async () => {
    const user = userEvent.setup();

    renderAuthProvider();

    await user.click(screen.getByRole("button", { name: "Expired login" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid or expired authentication token.",
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("Logged out");
  });

  it("rejects malformed authentication tokens", async () => {
    const user = userEvent.setup();

    renderAuthProvider();

    await user.click(screen.getByRole("button", { name: "Invalid login" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid or expired authentication token.",
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("Logged out");
  });
});
