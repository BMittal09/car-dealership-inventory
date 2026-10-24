import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  RefreshCw,
  Search,
} from "lucide-react";
import { getCars, type CarFilters as CarFiltersType } from "../api/cars";
import CarCard from "../components/CarCard";
import CarFilters from "../components/CarFilters";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const PAGE_SIZE = 9;

function isValidPrice(value: string | undefined) {
  if (value === undefined || value === "") {
    return true;
  }

  return (
    /^\d+(\.\d{1,2})?$/.test(value) &&
    Number.isFinite(Number(value)) &&
    Number(value) <= 9999999999.99
  );
}

function getPriceError(filters: CarFiltersType): string | null {
  if (!isValidPrice(filters.min_price) || !isValidPrice(filters.max_price)) {
    return "Enter valid, non-negative prices with at most two decimal places.";
  }

  if (
    filters.min_price &&
    filters.max_price &&
    Number(filters.min_price) > Number(filters.max_price)
  ) {
    return "Minimum price cannot be greater than maximum price.";
  }

  return null;
}

export default function InventoryPage() {
  const [filters, setFilters] = useState<CarFiltersType>({
    page: 1,
    limit: PAGE_SIZE,
  });

  const debouncedSearch = useDebouncedValue(filters.search, 400);
  const debouncedMake = useDebouncedValue(filters.make, 400);
  const debouncedMinPrice = useDebouncedValue(filters.min_price, 400);
  const debouncedMaxPrice = useDebouncedValue(filters.max_price, 400);

  const queryFilters: CarFiltersType = {
    ...filters,
    search: debouncedSearch,
    make: debouncedMake,
    min_price: debouncedMinPrice,
    max_price: debouncedMaxPrice,
  };

  const priceError = getPriceError(filters);
  const queryPriceError = getPriceError(queryFilters);

  const filtersAreSettling =
    filters.search !== debouncedSearch ||
    filters.make !== debouncedMake ||
    filters.min_price !== debouncedMinPrice ||
    filters.max_price !== debouncedMaxPrice;

  const {
    data,
    isPending,
    isError,
    isFetching,
    isPlaceholderData,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cars", queryFilters],
    queryFn: ({ signal }) => getCars(queryFilters, signal),
    enabled: !queryPriceError,
    placeholderData: (previousData) => previousData,
  });

  const cars = data?.cars ?? [];
  const pagination = data?.pagination;

  const showLoading =
    !priceError && (isPending || filtersAreSettling || isPlaceholderData);

  function handleFiltersChange(nextFilters: CarFiltersType) {
    setFilters({
      ...nextFilters,
      page: 1,
      limit: PAGE_SIZE,
    });
  }

  function resetFilters() {
    setFilters({
      page: 1,
      limit: PAGE_SIZE,
    });
  }

  function changePage(nextPage: number) {
    setFilters((current) => ({
      ...current,
      page: nextPage,
    }));
  }

  return (
    <div className="space-y-10 pb-12">
      <section className="rounded-3xl bg-slate-950 px-8 py-12 text-white sm:px-12 sm:py-16">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
          <CarFront size={19} />
          Explore AutoVault
        </div>

        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          Find your next vehicle.
        </h1>

        <p className="mt-5 max-w-2xl leading-8 text-slate-300">
          Explore our inventory, compare vehicle specifications, and discover
          the right car for your needs.
        </p>
      </section>

      <CarFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={resetFilters}
      />

      <section>
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Vehicle Collection
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Browse Inventory
            </h2>

            <p className="mt-3 text-sm text-slate-600">
              {!priceError && !showLoading && !isError && pagination
                ? `${pagination.total} vehicle${pagination.total === 1 ? "" : "s"} found`
                : "Explore our vehicle listings"}
            </p>
          </div>

          {isFetching && !showLoading && (
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw size={15} className="animate-spin" />
              Updating inventory...
            </span>
          )}
        </div>

        {priceError ? (
          <div
            role="alert"
            className="rounded-2xl border border-amber-200 bg-amber-50 px-8 py-10 text-center"
          >
            <h3 className="text-lg font-bold text-amber-900">
              Check your price filters
            </h3>

            <p className="mt-3 text-sm text-amber-800">{priceError}</p>
          </div>
        ) : showLoading ? (
          <div
            role="status"
            aria-label="Loading vehicles"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-[430px] animate-pulse rounded-2xl border border-slate-200 bg-white"
              >
                <div className="h-52 rounded-t-2xl bg-slate-200" />

                <div className="space-y-4 p-6">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-6 w-40 rounded bg-slate-200" />
                  <div className="h-20 rounded bg-slate-100" />
                  <div className="h-7 w-32 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-8 py-14 text-center"
          >
            <h3 className="text-xl font-bold text-slate-950">
              Unable to load inventory
            </h3>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
              {error instanceof Error
                ? error.message
                : "Something went wrong while loading vehicles."}
            </p>

            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : cars.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-8 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Search size={30} />
            </div>

            <h3 className="mt-6 text-xl font-bold text-slate-950">
              No vehicles found
            </h3>

            <p className="mt-3 text-sm text-slate-600">
              No vehicles match your current filters.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}

        {pagination &&
          pagination.totalPages > 1 &&
          !priceError &&
          !showLoading &&
          !isError && (
            <nav
              aria-label="Inventory pagination"
              className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-slate-200 pt-8 sm:flex-row"
            >
              <p className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.totalPages}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={(filters.page ?? 1) <= 1 || isFetching}
                  onClick={() =>
                    changePage(Math.max(1, (filters.page ?? 1) - 1))
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    (filters.page ?? 1) >= pagination.totalPages || isFetching
                  }
                  onClick={() => changePage((filters.page ?? 1) + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              </div>
            </nav>
          )}
      </section>
    </div>
  );
}
