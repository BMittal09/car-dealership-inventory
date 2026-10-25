import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  Fuel,
  Gauge,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { ApiError, getCarById, type Car } from "../api/cars";
import PurchaseVehicleButton from "../components/PurchaseVehicleButton";
import { getCarImage } from "../utils/carImages";

const statusStyles: Record<Car["status"], string> = {
  available: "border-emerald-400/25 bg-emerald-500/15 text-emerald-300",
  reserved: "border-amber-400/25 bg-amber-500/15 text-amber-300",
  sold: "border-white/15 bg-white/10 text-slate-300",
};

function formatPrice(price: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

function formatMileage(mileage: number) {
  return `${new Intl.NumberFormat("en-IN").format(mileage)} km`;
}

export default function CarDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["car", id],
    queryFn: ({ signal }) => getCarById(id!, signal),
    enabled: Boolean(id),
    retry: (failureCount, queryError) =>
      !(
        queryError instanceof ApiError && [400, 404].includes(queryError.status)
      ) && failureCount < 1,
  });

  if (!id) {
    return (
      <div role="alert" className="py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Invalid vehicle link</h1>

        <Link
          to="/cars"
          className="mt-5 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={17} />
          Return to Inventory
        </Link>
      </div>
    );
  }

  if (isPending) {
    return (
      <div
        role="status"
        aria-label="Loading vehicle details"
        className="animate-pulse space-y-8"
      >
        <div className="h-6 w-40 rounded bg-white/10" />
        <div className="h-14 w-80 max-w-full rounded bg-white/10" />
        <div className="h-96 rounded-3xl bg-[#11151C]" />
        <div className="h-64 rounded-3xl bg-[#11151C]" />
      </div>
    );
  }

  if (isError) {
    const notFound =
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400);

    return (
      <div
        role="alert"
        className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#11151C] px-8 py-20 text-center"
      >
        <CarFront size={48} className="mx-auto mb-6 text-slate-500" />

        <h1 className="text-2xl font-bold text-white">
          {notFound ? "Vehicle not found" : "Unable to load vehicle"}
        </h1>

        <p className="mt-4 text-slate-400">
          {notFound
            ? "This vehicle may have been removed or the link is incorrect."
            : "Something went wrong while loading the vehicle details."}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/cars"
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Browse Inventory
          </Link>

          {!notFound && (
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  const car = data.car;

  const specifications = [
    {
      label: "Model Year",
      value: String(car.year),
      icon: CalendarDays,
    },
    {
      label: "Vehicle Category",
      value: car.category,
      icon: Tag,
    },
    {
      label: "Mileage",
      value: formatMileage(car.mileage),
      icon: Gauge,
    },
    {
      label: "Fuel Type",
      value: car.fuel_type,
      icon: Fuel,
    },
    {
      label: "Transmission",
      value: car.transmission,
      icon: Settings2,
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Back Navigation */}
      <Link
        to="/cars"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-blue-400"
      >
        <ArrowLeft size={18} />
        Back to Inventory
      </Link>

      {/* Vehicle Header */}
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            {car.make} / The Collection
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            {car.make} <span className="text-slate-400">{car.model}</span>
          </h1>

          <p className="mt-4 text-sm capitalize text-slate-400">
            {car.year} Model · {car.transmission} · {car.fuel_type}
          </p>
        </div>

        <span
          className={`w-fit rounded-full border px-5 py-2 text-sm font-semibold capitalize ${statusStyles[car.status]}`}
        >
          {car.status}
        </span>
      </div>

      {/* Main Details Layout */}
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          {/* Vehicle Photograph */}
          <div className="relative h-[350px] overflow-hidden rounded-3xl border border-white/10 bg-[#11151C] sm:h-[460px] lg:h-[500px]">
            <img
              src={getCarImage(car.category)}
              alt={`Representative ${car.category} vehicle photograph`}
              decoding="async"
              className="h-full w-full object-cover"
              onError={(event) => {
                const image = event.currentTarget;
                const fallback = "/images/default-car.jpg";

                if (!image.src.endsWith(fallback)) {
                  image.src = fallback;
                }
              }}
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
                Representative vehicle photograph
              </span>

              <span className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold capitalize text-white backdrop-blur-md">
                {car.category}
              </span>
            </div>
          </div>

          {/* Specifications */}
          <section className="rounded-3xl border border-white/10 bg-[#11151C] p-7 sm:p-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                  Vehicle Overview
                </p>

                <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                  Specifications
                </h2>
              </div>

              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Vehicle Details
              </span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {specifications.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0B0F15] p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/15 bg-blue-500/10 text-blue-400">
                    <Icon size={22} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">{label}</p>

                    <p className="mt-1 font-semibold capitalize text-white">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Purchase Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#11151C] p-7 shadow-xl shadow-black/10 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Listed Price
            </p>

            <p className="mt-4 text-4xl font-bold tracking-tight text-white">
              {formatPrice(car.price)}
            </p>

            <div className="my-8 border-t border-white/10" />

            <div className="space-y-5">
              {[
                ["Manufacturer", car.make],
                ["Model", car.model],
                ["Category", car.category],
                ["Year", String(car.year)],
                ["Availability", car.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">{label}</span>

                  <span className="font-semibold capitalize text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Existing Purchase Logic */}
            <PurchaseVehicleButton car={car} />

            <Link
              to="/cars"
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-4 text-sm font-semibold text-slate-300 transition hover:border-blue-500/30 hover:bg-white/5 hover:text-white"
            >
              Explore More Vehicles
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* Information Card */}
          <div className="rounded-3xl border border-blue-500/20 bg-[#0B1124] p-7">
            <ShieldCheck size={26} className="text-blue-400" />

            <h3 className="mt-4 text-lg font-bold text-white">
              Clear Vehicle Information
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              Review vehicle specifications, pricing, stock availability, and
              purchase options in one convenient place.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
