import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Car } from "../api/cars";
import RestockVehicleDialog from "./RestockVehicleDialog";

const restockVehicleMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("../api/cars", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api/cars")>();

  return {
    ...original,
    restockVehicle: (...args: unknown[]) => restockVehicleMock(...args),
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

const onClose = vi.fn();

function renderDialog(car: Car = testCar) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  useAuthMock.mockReturnValue({
    user: {
      id: "admin-user-id",
      name: "Test Administrator",
      email: "admin@example.com",
      role: "admin",
    },
    accessToken: "test-admin-token",
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RestockVehicleDialog car={car} onClose={onClose} />
    </QueryClientProvider>,
  );

  return {
    ...result,
    queryClient,
  };
}

describe("RestockVehicleDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays vehicle information and current stock", () => {
    renderDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();

    expect(screen.getByText(/5 units/i)).toBeInTheDocument();
  });

  it("previews the new quantity before restocking", async () => {
    const user = userEvent.setup();

    renderDialog();

    const input = screen.getByRole("spinbutton", {
      name: /quantity to add/i,
    });

    await user.type(input, "3");

    expect(screen.getByText(/8 units/i)).toBeInTheDocument();
  });

  it.each(["0", "-2", "1.5", "abc"])(
    "rejects invalid restock quantity %s",
    async (quantity) => {
      const user = userEvent.setup();

      renderDialog();

      const input = screen.getByRole("spinbutton", {
        name: /quantity to add/i,
      });

      await user.type(input, quantity);

      await user.click(
        screen.getByRole("button", {
          name: /confirm restock/i,
        }),
      );

      expect(restockVehicleMock).not.toHaveBeenCalled();
    },
  );

  it("submits a valid restock request with the administrator JWT", async () => {
    const user = userEvent.setup();

    restockVehicleMock.mockResolvedValue({
      car: {
        ...testCar,
        quantity: 8,
      },
    });

    renderDialog();

    await user.type(
      screen.getByRole("spinbutton", {
        name: /quantity to add/i,
      }),
      "3",
    );

    await user.click(
      screen.getByRole("button", {
        name: /confirm restock/i,
      }),
    );

    await waitFor(() => {
      expect(restockVehicleMock).toHaveBeenCalledWith(
        testCar.id,
        3,
        "test-admin-token",
      );
    });
  });

  it("refreshes inventory after a successful restock", async () => {
    const user = userEvent.setup();

    restockVehicleMock.mockResolvedValue({
      car: {
        ...testCar,
        quantity: 8,
      },
    });

    const { queryClient } = renderDialog();

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.type(
      screen.getByRole("spinbutton", {
        name: /quantity to add/i,
      }),
      "3",
    );

    await user.click(
      screen.getByRole("button", {
        name: /confirm restock/i,
      }),
    );

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["cars"],
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["admin"],
      });
    });
  });

  it("displays API errors when restocking fails", async () => {
    const user = userEvent.setup();

    restockVehicleMock.mockRejectedValue(
      new Error("Restock would exceed the maximum inventory quantity."),
    );

    renderDialog();

    await user.type(
      screen.getByRole("spinbutton", {
        name: /quantity to add/i,
      }),
      "3",
    );

    await user.click(
      screen.getByRole("button", {
        name: /confirm restock/i,
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Restock would exceed the maximum inventory quantity.",
    );
  });

  it("prevents duplicate submissions while restocking", async () => {
    const user = userEvent.setup();

    restockVehicleMock.mockReturnValue(new Promise(() => {}));

    renderDialog();

    await user.type(
      screen.getByRole("spinbutton", {
        name: /quantity to add/i,
      }),
      "3",
    );

    await user.click(
      screen.getByRole("button", {
        name: /confirm restock/i,
      }),
    );

    expect(
      screen.getByRole("button", {
        name: /restocking/i,
      }),
    ).toBeDisabled();
  });

  it("closes without restocking when Cancel is clicked", async () => {
    const user = userEvent.setup();

    renderDialog();

    await user.click(
      screen.getByRole("button", {
        name: /cancel/i,
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(restockVehicleMock).not.toHaveBeenCalled();
  });
});
