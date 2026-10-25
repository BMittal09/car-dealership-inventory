import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
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
  "w-full rounded-xl border border-white/10 bg-[#0B0F15] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

const labelStyles = "mb-2 block text-sm font-semibold text-slate-300";

const categories = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "coupe", label: "Coupe" },
  { value: "convertible", label: "Convertible" },
  { value: "pickup", label: "Pickup Truck" },
  { value: "van", label: "Van" },
  { value: "other", label: "Other" },
];

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
      className="rounded-2xl border border-white/10 bg-[#11151C] p-6 shadow-xl shadow-black/10 sm:p-8"
    >
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <SlidersHorizontal size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">Refine Your Search</h2>

            <p className="mt-1 text-xs text-slate-400">
              Find a vehicle that fits your preferences
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-blue-400"
        >
          <RotateCcw size={15} />
          Reset Filters
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="car-search" className={labelStyles}>
            Search by make or model
          </label>

          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              id="car-search"
              type="search"
              value={filters.search ?? ""}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search Toyota, BMW, Creta, Nexon..."
              maxLength={100}
              className={`${inputStyles} pl-11`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="car-make" className={labelStyles}>
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
          <label htmlFor="car-category" className={labelStyles}>
            Vehicle Category
          </label>

          <select
            id="car-category"
            value={filters.category ?? ""}
            onChange={(event) =>
              updateFilter("category", event.target.value || undefined)
            }
            className={inputStyles}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="car-fuel" className={labelStyles}>
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
          <label htmlFor="car-transmission" className={labelStyles}>
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
          <label htmlFor="car-status" className={labelStyles}>
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
          <label htmlFor="car-min-price" className={labelStyles}>
            Minimum Price (INR)
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
          <label htmlFor="car-max-price" className={labelStyles}>
            Maximum Price (INR)
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
