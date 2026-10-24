import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createCar,
  updateCar,
  deleteCar,
  type CreateCarInput,
} from "./cars";

const ACCESS_TOKEN = "test-admin-access-token";

const testCar: CreateCarInput = {
  make: "Toyota",
  model: "Corolla",
  year: 2023,
  price: "1250000.00",
  mileage: 18000,
  fuel_type: "petrol",
  transmission: "automatic",
};

const createdCar = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  ...testCar,
  status: "available",
  created_at: "2026-10-24T10:00:00.000Z",
  updated_at: "2026-10-24T10:00:00.000Z",
};

describe("Vehicle management API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("creates a vehicle with the correct request and JWT", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ car: createdCar }), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const result = await createCar(testCar, ACCESS_TOKEN);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/cars",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(testCar),
      }),
    );

    expect(result.car.id).toBe(createdCar.id);
    expect(result.car.make).toBe("Toyota");
  });

  it("updates a vehicle using PATCH and the admin JWT", async () => {
    const fetchMock = vi.mocked(fetch);

    const updatedCar = {
      ...createdCar,
      price: "1190000.00",
      status: "reserved",
    };

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ car: updatedCar }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const update = {
      price: "1190000.00",
      status: "reserved" as const,
    };

    const result = await updateCar(createdCar.id, update, ACCESS_TOKEN);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/cars/${createdCar.id}`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(update),
      }),
    );

    expect(result.car.price).toBe("1190000.00");
    expect(result.car.status).toBe("reserved");
  });

  it("deletes a vehicle using DELETE and handles HTTP 204", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    );

    await expect(
      deleteCar(createdCar.id, ACCESS_TOKEN),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/cars/${createdCar.id}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        }),
      }),
    );
  });

  it("rejects vehicle creation when the backend returns 403", async () => {
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

    await expect(createCar(testCar, ACCESS_TOKEN)).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
      message: "Insufficient permissions.",
    });
  });

  it("returns an API error when updating a nonexistent vehicle", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "CAR_NOT_FOUND",
            message: "Car not found.",
          },
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await expect(
      updateCar(createdCar.id, { status: "sold" }, ACCESS_TOKEN),
    ).rejects.toMatchObject({
      status: 404,
      code: "CAR_NOT_FOUND",
    });
  });

  it("rejects deletion when authentication is invalid", async () => {
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

    await expect(deleteCar(createdCar.id, ACCESS_TOKEN)).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("uses a safe fallback when the backend returns non-JSON errors", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response("Internal Server Error", {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      }),
    );

    await expect(createCar(testCar, ACCESS_TOKEN)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
