export type FuelType = "petrol" | "diesel" | "electric" | "hybrid" | "cng";

export type Transmission = "manual" | "automatic";

export type CarStatus = "available" | "reserved" | "sold";

export interface Car {
  id: string;
  make: string;
  model: string;
  category: string;
  year: number;
  price: string;
  quantity: number;
  mileage: number;
  fuel_type: FuelType;
  transmission: Transmission;
  status: CarStatus;
  created_at: string;
  updated_at: string;
}

export interface CarFilters {
  search?: string;
  make?: string;
  category?: string;
  fuel_type?: FuelType;
  transmission?: Transmission;
  status?: CarStatus;
  min_price?: string;
  max_price?: string;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CarListResponse {
  cars: Car[];
  pagination: Pagination;
}

export interface CarDetailsResponse {
  car: Car;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseApiError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  let code = "API_ERROR";
  let message = fallbackMessage;

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
    // Preserve the fallback message for non-JSON errors.
  }

  throw new ApiError(response.status, code, message);
}

async function apiGet<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    return parseApiError(response, "Something went wrong. Please try again.");
  }

  return (await response.json()) as T;
}

export async function getCars(
  filters: CarFilters = {},
  signal?: AbortSignal,
): Promise<CarListResponse> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const query = params.toString();

  return apiGet<CarListResponse>(
    `/api/cars${query ? `?${query}` : ""}`,
    signal,
  );
}

export async function getCarById(
  id: string,
  signal?: AbortSignal,
): Promise<CarDetailsResponse> {
  return apiGet<CarDetailsResponse>(
    `/api/cars/${encodeURIComponent(id)}`,
    signal,
  );
}

export interface CreateCarInput {
  make: string;
  model: string;
  category: string;
  year: number;
  price: string;
  quantity: number;
  mileage: number;
  fuel_type: FuelType;
  transmission: Transmission;
}

export interface UpdateCarInput extends Partial<CreateCarInput> {
  status?: CarStatus;
}

export async function createCar(
  input: CreateCarInput,
  accessToken: string,
): Promise<CarDetailsResponse> {
  const response = await fetch("/api/cars", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    return parseApiError(
      response,
      "Unable to create vehicle. Please try again.",
    );
  }

  return (await response.json()) as CarDetailsResponse;
}

export async function updateCar(
  id: string,
  input: UpdateCarInput,
  accessToken: string,
): Promise<CarDetailsResponse> {
  const response = await fetch(`/api/cars/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    return parseApiError(
      response,
      "Unable to update vehicle. Please try again.",
    );
  }

  return (await response.json()) as CarDetailsResponse;
}

export async function deleteCar(
  id: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(`/api/cars/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return parseApiError(
      response,
      "Unable to delete vehicle. Please try again.",
    );
  }

  // HTTP 204 intentionally has no response body.
}

export async function purchaseVehicle(
  id: string,
  accessToken: string,
): Promise<CarDetailsResponse> {
  const response = await fetch(
    `/api/vehicles/${encodeURIComponent(id)}/purchase`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    return parseApiError(
      response,
      "Unable to purchase vehicle. Please try again.",
    );
  }

  return (await response.json()) as CarDetailsResponse;
}

export async function restockVehicle(
  id: string,
  quantity: number,
  accessToken: string,
): Promise<CarDetailsResponse> {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Restock quantity must be a positive integer.",
    );
  }

  const response = await fetch(
    `/api/vehicles/${encodeURIComponent(id)}/restock`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ quantity }),
    },
  );

  if (!response.ok) {
    return parseApiError(
      response,
      "Unable to restock vehicle. Please try again.",
    );
  }

  return (await response.json()) as CarDetailsResponse;
}
