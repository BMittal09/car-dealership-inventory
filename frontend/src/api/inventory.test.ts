import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, purchaseVehicle, restockVehicle } from "./cars";

const ACCESS_TOKEN = "test-user-access-token";

const VEHICLE_ID = "123e4567-e89b-42d3-a456-426614174000";

const testVehicle = {
  id: VEHICLE_ID,
  make: "Toyota",
  model: "Corolla",
  category: "sedan",
  year: 2023,
  price: "1250000.00",
  quantity: 5,
  mileage: 18000,
  fuel_type: "petrol",
  transmission: "automatic",
  status: "available",
  created_at: "2026-10-24T10:00:00.000Z",
  updated_at: "2026-10-24T10:00:00.000Z",
};

describe("Vehicle purchase and restock API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("purchases one vehicle using POST and JWT authentication", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          car: {
            ...testVehicle,
            quantity: 4,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const result = await purchaseVehicle(VEHICLE_ID, ACCESS_TOKEN);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/vehicles/${VEHICLE_ID}/purchase`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        }),
      }),
    );

    expect(result.car.quantity).toBe(4);
  });

  it("restocks vehicles using POST with the requested quantity", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          car: {
            ...testVehicle,
            quantity: 10,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const result = await restockVehicle(VEHICLE_ID, 5, ACCESS_TOKEN);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/vehicles/${VEHICLE_ID}/restock`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          quantity: 5,
        }),
      }),
    );

    expect(result.car.quantity).toBe(10);
  });

  it("handles out-of-stock purchase errors", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "OUT_OF_STOCK",
            message: "This vehicle is out of stock.",
          },
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await expect(
      purchaseVehicle(VEHICLE_ID, ACCESS_TOKEN),
    ).rejects.toMatchObject({
      status: 409,
      code: "OUT_OF_STOCK",
      message: "This vehicle is out of stock.",
    });
  });

  it("handles unauthorized purchase requests", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
          },
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await expect(
      purchaseVehicle(VEHICLE_ID, ACCESS_TOKEN),
    ).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("handles forbidden restock requests", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "Insufficient permissions.",
          },
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await expect(
      restockVehicle(VEHICLE_ID, 5, ACCESS_TOKEN),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("uses a safe fallback for non-JSON API errors", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response("Internal Server Error", {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      }),
    );

    await expect(
      purchaseVehicle(VEHICLE_ID, ACCESS_TOKEN),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
