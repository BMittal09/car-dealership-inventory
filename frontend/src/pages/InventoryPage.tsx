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
      {/* Inventory Hero */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101521] px-8 py-14 text-white sm:px-12 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl"
        />

        <div className="relative">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-blue-400">
            <CarFront size={19} />
            Explore AutoVault
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            The Collection.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">
            Explore exceptional vehicles, compare specifications, and discover
            the right drive for your lifestyle.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
              Curated Inventory
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
              Transparent Details
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
              Find Your Drive
            </span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <CarFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={resetFilters}
      />

      {/* Inventory Grid */}
      <section>
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Vehicle Collection
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Browse Inventory
            </h2>

            <p className="mt-3 text-sm text-slate-400">
              {!priceError && !showLoading && !isError && pagination
                ? `${pagination.total} vehicle${pagination.total === 1 ? "" : "s"} found`
                : "Explore our vehicle listings"}
            </p>
          </div>

          {isFetching && !showLoading && (
            <span className="inline-flex items-center gap-2 text-sm text-slate-400">
              <RefreshCw size={15} className="animate-spin" />
              Updating inventory...
            </span>
          )}
        </div>

        {/* Invalid Price */}
        {priceError ? (
          <div
            role="alert"
            className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-8 py-12 text-center"
          >
            <h3 className="text-lg font-bold text-amber-300">
              Check your price filters
            </h3>

            <p className="mt-3 text-sm text-amber-200">{priceError}</p>
          </div>
        ) : showLoading ? (
          /* Loading Skeletons */
          <div
            role="status"
            aria-label="Loading vehicles"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-[480px] animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-[#11151C]"
              >
                <div className="h-56 bg-white/10" />

                <div className="space-y-5 p-6">
                  <div className="h-4 w-20 rounded bg-white/10" />
                  <div className="h-7 w-40 rounded bg-white/10" />
                  <div className="h-20 rounded bg-white/5" />
                  <div className="h-8 w-32 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          /* API Error */
          <div
            role="alert"
            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-8 py-14 text-center"
          >
            <h3 className="text-xl font-bold text-white">
              Unable to load inventory
            </h3>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-red-200">
              {error instanceof Error
                ? error.message
                : "Something went wrong while loading vehicles."}
            </p>

            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : cars.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-white/10 bg-[#11151C] px-8 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Search size={30} />
            </div>

            <h3 className="mt-6 text-xl font-bold text-white">
              No vehicles found
            </h3>

            <p className="mt-3 text-sm text-slate-400">
              No vehicles match your current filters.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Vehicle Cards */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination &&
          pagination.totalPages > 1 &&
          !priceError &&
          !showLoading &&
          !isError && (
            <nav
              aria-label="Inventory pagination"
              className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row"
            >
              <p className="text-sm text-slate-400">
                Page {pagination.page} of {pagination.totalPages}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={(filters.page ?? 1) <= 1 || isFetching}
                  onClick={() =>
                    changePage(Math.max(1, (filters.page ?? 1) - 1))
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#11151C] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-blue-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
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
