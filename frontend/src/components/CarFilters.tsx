import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import type {
  CarFilters as CarFiltersType,
  CarStatus,
  FuelType,
  Transmission,
} from "../api/cars";

interface CarFiltersProps {
  filters: CarFiltersType;
  onChange: (filters: CarFiltersType) => void;
  onReset: () => void;
}

const inputStyles =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

export default function CarFilters({
  filters,
  onChange,
  onReset,
}: CarFiltersProps) {
  function updateFilter<K extends keyof CarFiltersType>(
    key: K,
    value: CarFiltersType[K],
  ) {
    onChange({
      ...filters,
      [key]: value,
      page: 1,
    });
  }

  return (
    <section
      aria-label="Vehicle filters"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <SlidersHorizontal size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Filter Vehicles
            </h2>
            <p className="text-xs text-slate-500">Narrow down your search</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <RotateCcw size={15} />
          Reset Filters
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <label
            htmlFor="car-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Search by make or model
          </label>

          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="car-search"
              type="search"
              value={filters.search ?? ""}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="e.g. Toyota, Creta, Nexon..."
              maxLength={100}
              className={`${inputStyles} pl-11`}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="car-make"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Manufacturer
          </label>

          <input
            id="car-make"
            type="text"
            value={filters.make ?? ""}
            onChange={(event) => updateFilter("make", event.target.value)}
            placeholder="e.g. Honda"
            maxLength={100}
            className={inputStyles}
          />
        </div>

        <div>
          <label
            htmlFor="car-fuel"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Fuel Type
          </label>

          <select
            id="car-fuel"
            value={filters.fuel_type ?? ""}
            onChange={(event) =>
              updateFilter(
                "fuel_type",
                event.target.value
                  ? (event.target.value as FuelType)
                  : undefined,
              )
            }
            className={inputStyles}
          >
            <option value="">All fuel types</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
            <option value="cng">CNG</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="car-transmission"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Transmission
          </label>

          <select
            id="car-transmission"
            value={filters.transmission ?? ""}
            onChange={(event) =>
              updateFilter(
                "transmission",
                event.target.value
                  ? (event.target.value as Transmission)
                  : undefined,
              )
            }
            className={inputStyles}
          >
            <option value="">All transmissions</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="car-status"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Availability
          </label>

          <select
            id="car-status"
            value={filters.status ?? ""}
            onChange={(event) =>
              updateFilter(
                "status",
                event.target.value
                  ? (event.target.value as CarStatus)
                  : undefined,
              )
            }
            className={inputStyles}
          >
            <option value="">All vehicles</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="car-min-price"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Minimum Price (₹)
          </label>

          <input
            id="car-min-price"
            type="number"
            min="0"
            step="0.01"
            value={filters.min_price ?? ""}
            onChange={(event) => updateFilter("min_price", event.target.value)}
            placeholder="Minimum price"
            className={inputStyles}
          />
        </div>

        <div>
          <label
            htmlFor="car-max-price"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Maximum Price (₹)
          </label>

          <input
            id="car-max-price"
            type="number"
            min="0"
            step="0.01"
            value={filters.max_price ?? ""}
            onChange={(event) => updateFilter("max_price", event.target.value)}
            placeholder="Maximum price"
            className={inputStyles}
          />
        </div>
      </div>
    </section>
  );
}
