import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Car } from "../api/cars";
import PurchaseVehicleButton from "./PurchaseVehicleButton";

const purchaseVehicleMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("../api/cars", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api/cars")>();

  return {
    ...original,
    purchaseVehicle: (...args: unknown[]) => purchaseVehicleMock(...args),
  };
});

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

const testCar: Car = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  make: "Toyota",
  model: "Camry",
  category: "sedan",
  year: 2023,
  price: "1850000.00",
  quantity: 5,
  mileage: 18000,
  fuel_type: "petrol",
  transmission: "automatic",
  status: "available",
  created_at: "2026-10-24T10:00:00.000Z",
  updated_at: "2026-10-24T10:00:00.000Z",
};

function renderButton(car: Car = testCar, authenticated = true) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  useAuthMock.mockReturnValue({
    user: authenticated
      ? {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          role: "user",
        }
      : null,
    accessToken: authenticated ? "test-access-token" : null,
    isAuthenticated: authenticated,
    login: vi.fn(),
    logout: vi.fn(),
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PurchaseVehicleButton car={car} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...result, queryClient };
}

async function openConfirmation(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /purchase vehicle/i }));
}

describe("PurchaseVehicleButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an enabled purchase button when stock is available", () => {
    renderButton();

    expect(
      screen.getByRole("button", { name: /purchase vehicle/i }),
    ).toBeEnabled();

    expect(screen.getByText(/5 units in stock/i)).toBeInTheDocument();
  });

  it("directs unauthenticated users to login", () => {
    renderButton(testCar, false);

    expect(
      screen.getByRole("link", { name: /log in to purchase/i }),
    ).toHaveAttribute("href", "/login");

    expect(purchaseVehicleMock).not.toHaveBeenCalled();
  });

  it("disables purchasing when stock is zero", () => {
    renderButton({ ...testCar, quantity: 0 });

    expect(
      screen.getByRole("button", { name: /out of stock/i }),
    ).toBeDisabled();
  });

  it.each(["reserved", "sold"] as const)(
    "disables purchasing when vehicle status is %s",
    (status) => {
      renderButton({ ...testCar, status });

      expect(
        screen.getByRole("button", { name: /unavailable/i }),
      ).toBeDisabled();
    },
  );

  it("opens confirmation without immediately purchasing", async () => {
    const user = userEvent.setup();
    renderButton();

    await openConfirmation(user);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    expect(screen.getByText(/confirm vehicle purchase/i)).toBeInTheDocument();

    expect(purchaseVehicleMock).not.toHaveBeenCalled();
  });

  it("cancels purchase without changing inventory", async () => {
    const user = userEvent.setup();
    renderButton();

    await openConfirmation(user);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    expect(purchaseVehicleMock).not.toHaveBeenCalled();
    expect(screen.getByText(/5 units in stock/i)).toBeInTheDocument();
  });

  it("purchases only after confirmation and refreshes inventory", async () => {
    const user = userEvent.setup();

    purchaseVehicleMock.mockResolvedValue({
      car: { ...testCar, quantity: 4 },
    });

    const { queryClient } = renderButton();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await openConfirmation(user);

    expect(purchaseVehicleMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /confirm purchase/i }));

    await waitFor(() => {
      expect(purchaseVehicleMock).toHaveBeenCalledWith(
        testCar.id,
        "test-access-token",
      );
    });

    expect(await screen.findByText(/purchase successful/i)).toBeInTheDocument();

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["cars"],
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["car", testCar.id],
    });

    expect(screen.getByText(/4 units in stock/i)).toBeInTheDocument();
  });

  it("displays an API error when confirmed purchase fails", async () => {
    const user = userEvent.setup();

    purchaseVehicleMock.mockRejectedValue(
      new Error("This vehicle is out of stock."),
    );

    renderButton();
    await openConfirmation(user);

    await user.click(screen.getByRole("button", { name: /confirm purchase/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This vehicle is out of stock.",
    );

    expect(screen.getByText(/5 units in stock/i)).toBeInTheDocument();
  });

  it("disables confirmation controls while purchase is pending", async () => {
    const user = userEvent.setup();

    purchaseVehicleMock.mockReturnValue(new Promise(() => {}));

    renderButton();

    await openConfirmation(user);

    const dialog = screen.getByRole("alertdialog");

    await user.click(
      within(dialog).getByRole("button", {
        name: /confirm purchase/i,
      }),
    );

    await waitFor(() => {
      expect(
        within(dialog).getByRole("button", {
          name: /processing/i,
        }),
      ).toBeDisabled();
    });

    expect(
      within(dialog).getByRole("button", {
        name: /cancel/i,
      }),
    ).toBeDisabled();

    expect(
      within(dialog).getByRole("button", {
        name: /close purchase confirmation/i,
      }),
    ).toBeDisabled();
  });

  it("explains that no payment is collected", async () => {
    const user = userEvent.setup();
    renderButton();

    await openConfirmation(user);

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      /no payment is collected/i,
    );
  });
});
