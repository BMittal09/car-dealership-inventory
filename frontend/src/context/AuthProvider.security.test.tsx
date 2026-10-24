import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import AuthProvider from "./AuthProvider";
import { useAuth } from "../hooks/useAuth";

function createTestToken(): string {
  const payload = {
    sub: "test-admin-id",
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

function SecurityTestComponent() {
  const { login, logout, isAuthenticated, user, accessToken } = useAuth();

  const queryClient = useQueryClient();

  function handleLogin() {
    login({
      accessToken: createTestToken(),
      user: {
        id: "test-admin-id",
        name: "Test Administrator",
        email: "admin@example.com",
        role: "admin",
      },
    });

    queryClient.setQueryData(["admin", "inventory-overview"], { total: 12 });
  }

  function handleSwitchAccount() {
    logout();

    login({
      accessToken: createTestToken(),
      user: {
        id: "second-user-id",
        name: "Second Administrator",
        email: "second@example.com",
        role: "admin",
      },
    });

    queryClient.setQueryData(["admin", "inventory-overview"], { total: 25 });
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

      <p data-testid="cache-status">
        {queryClient.getQueryData(["admin", "inventory-overview"])
          ? "Admin cache present"
          : "Admin cache empty"}
      </p>

      <button type="button" onClick={handleLogin}>
        Log in
      </button>

      <button type="button" onClick={logout}>
        Log out
      </button>

      <button type="button" onClick={handleSwitchAccount}>
        Switch account
      </button>
    </div>
  );
}

function renderSecurityTest() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SecurityTestComponent />
      </AuthProvider>
    </QueryClientProvider>,
  );

  return {
    ...result,
    queryClient,
  };
}

describe("Authentication cache security", () => {
  it("clears cached administrator data after logout", async () => {
    const user = userEvent.setup();

    const { queryClient } = renderSecurityTest();

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByTestId("auth-status")).toHaveTextContent(
      "Authenticated",
    );

    expect(queryClient.getQueryData(["admin", "inventory-overview"])).toEqual({
      total: 12,
    });

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(screen.getByTestId("auth-status")).toHaveTextContent("Logged out");

    expect(screen.getByTestId("user-name")).toHaveTextContent("No user");

    expect(screen.getByTestId("token-status")).toHaveTextContent("No token");

    await waitFor(() => {
      expect(
        queryClient.getQueryData(["admin", "inventory-overview"]),
      ).toBeUndefined();
    });
  });

  it("preserves the new session and cache after a rapid account switch", async () => {
    const user = userEvent.setup();

    const { queryClient } = renderSecurityTest();

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByTestId("user-name")).toHaveTextContent(
      "Test Administrator",
    );

    expect(queryClient.getQueryData(["admin", "inventory-overview"])).toEqual({
      total: 12,
    });

    await user.click(screen.getByRole("button", { name: "Switch account" }));

    expect(screen.getByTestId("auth-status")).toHaveTextContent(
      "Authenticated",
    );

    expect(screen.getByTestId("user-name")).toHaveTextContent(
      "Second Administrator",
    );

    expect(screen.getByTestId("token-status")).toHaveTextContent(
      "Token present",
    );

    expect(queryClient.getQueryData(["admin", "inventory-overview"])).toEqual({
      total: 25,
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(["admin", "inventory-overview"])).toEqual(
        { total: 25 },
      );
    });
  });
});
