export type FuelType = "petrol" | "diesel" | "electric" | "hybrid" | "cng";

export type Transmission = "manual" | "automatic";

export type CarStatus = "available" | "reserved" | "sold";

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: string;
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

async function apiGet<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

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
      // Keep the fallback message if the response is not JSON.
    }

    throw new ApiError(response.status, code, message);
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
