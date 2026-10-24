import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthProvider from "../context/AuthProvider";
import { useAuth } from "../hooks/useAuth";
import ProtectedRoute from "./ProtectedRoute";
import type { AuthUser } from "../api/auth";

const verifyAdminAccessMock = vi.hoisted(() => vi.fn());

vi.mock("../api/auth", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api/auth")>();

  return {
    ...original,
    verifyAdminAccess: verifyAdminAccessMock,
  };
});

function createTestToken(): string {
  const payload = {
    sub: "test-user-id",
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

const regularUser: AuthUser = {
  id: "test-user-id",
  name: "Regular User",
  email: "user@example.com",
  role: "user",
};

const adminUser: AuthUser = {
  id: "test-admin-id",
  name: "Admin User",
  email: "admin@example.com",
  role: "admin",
};

function SessionControls({ user }: { user?: AuthUser }) {
  const { login, isAuthenticated, accessToken } = useAuth();

  const [ready, setReady] = useState(false);

  function establishSession() {
    if (user) {
      login({
        accessToken: createTestToken(),
        user,
      });
    }

    setReady(true);
  }

  return (
    <div>
      <p data-testid="session-status">
        {isAuthenticated ? "Authenticated" : "Logged out"}
      </p>

      <p data-testid="session-token">
        {accessToken ? "Token present" : "No token"}
      </p>

      {!ready && (
        <button type="button" onClick={establishSession}>
          Start session
        </button>
      )}

      {ready && (
        <Routes>
          <Route path="/login" element={<h1>Login Page</h1>} />

          <Route path="/cars" element={<h1>Inventory Page</h1>} />

          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<h1>Admin Dashboard</h1>} />
          </Route>
        </Routes>
      )}
    </div>
  );
}

function renderProtectedRoute(user?: AuthUser) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/admin"]}>
          <SessionControls user={user} />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    verifyAdminAccessMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated visitors to login", async () => {
    const user = userEvent.setup();

    renderProtectedRoute();

    await user.click(screen.getByRole("button", { name: "Start session" }));

    expect(
      await screen.findByRole("heading", {
        name: "Login Page",
      }),
    ).toBeInTheDocument();

    expect(screen.getByTestId("session-status")).toHaveTextContent(
      "Logged out",
    );

    expect(verifyAdminAccessMock).not.toHaveBeenCalled();
  });

  it("redirects regular users to inventory", async () => {
    const user = userEvent.setup();

    renderProtectedRoute(regularUser);

    await user.click(screen.getByRole("button", { name: "Start session" }));

    expect(
      await screen.findByRole("heading", {
        name: "Inventory Page",
      }),
    ).toBeInTheDocument();

    expect(screen.getByTestId("session-status")).toHaveTextContent(
      "Authenticated",
    );

    expect(verifyAdminAccessMock).not.toHaveBeenCalled();
  });

  it("allows administrators after backend verification", async () => {
    verifyAdminAccessMock.mockResolvedValue({
      status: "ok",
    });

    const user = userEvent.setup();

    renderProtectedRoute(adminUser);

    await user.click(screen.getByRole("button", { name: "Start session" }));

    expect(
      await screen.findByRole("heading", {
        name: "Admin Dashboard",
      }),
    ).toBeInTheDocument();

    expect(screen.getByTestId("session-status")).toHaveTextContent(
      "Authenticated",
    );

    expect(screen.getByTestId("session-token")).toHaveTextContent(
      "Token present",
    );

    expect(verifyAdminAccessMock).toHaveBeenCalledTimes(1);
  });

  it("redirects administrators when backend returns 403", async () => {
    const { ApiError } = await import("../api/cars");

    verifyAdminAccessMock.mockRejectedValue(
      new ApiError(403, "FORBIDDEN", "Insufficient permissions."),
    );

    const user = userEvent.setup();

    renderProtectedRoute(adminUser);

    await user.click(screen.getByRole("button", { name: "Start session" }));

    expect(
      await screen.findByRole("heading", {
        name: "Inventory Page",
      }),
    ).toBeInTheDocument();

    // A 403 revokes admin access without necessarily
    // invalidating the user's authentication session.
    expect(screen.getByTestId("session-status")).toHaveTextContent(
      "Authenticated",
    );

    expect(verifyAdminAccessMock).toHaveBeenCalledTimes(1);
  });

  it("shows a retry option when verification fails", async () => {
    verifyAdminAccessMock.mockRejectedValue(new Error("Network unavailable"));

    const user = userEvent.setup();

    renderProtectedRoute(adminUser);

    await user.click(screen.getByRole("button", { name: "Start session" }));

    // Network errors are automatically retried once.
    expect(
      await screen.findByRole(
        "heading",
        { name: "Unable to verify access" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Try Again",
      }),
    ).toBeInTheDocument();

    // Simulate the backend becoming available again.
    verifyAdminAccessMock.mockResolvedValue({
      status: "ok",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Try Again",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Admin Dashboard",
      }),
    ).toBeInTheDocument();

    expect(verifyAdminAccessMock).toHaveBeenCalledTimes(3);
  });

  it("clears the session when backend verification returns 401", async () => {
    const { ApiError } = await import("../api/cars");

    verifyAdminAccessMock.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "Authentication required."),
    );

    const user = userEvent.setup();

    renderProtectedRoute(adminUser);

    await user.click(screen.getByRole("button", { name: "Start session" }));

    // The rejected token must redirect to login.
    expect(
      await screen.findByRole("heading", {
        name: "Login Page",
      }),
    ).toBeInTheDocument();

    // Verify that authentication was actually cleared.
    expect(
      await screen.findByText("Logged out", {
        selector: '[data-testid="session-status"]',
      }),
    ).toBeInTheDocument();

    // Verify that the JWT is no longer stored in context.
    expect(screen.getByTestId("session-token")).toHaveTextContent("No token");

    // Authorization was attempted against the backend.
    expect(verifyAdminAccessMock).toHaveBeenCalled();
  });
});
