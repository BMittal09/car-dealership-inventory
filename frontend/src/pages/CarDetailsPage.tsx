import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
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

const statusStyles: Record<Car["status"], string> = {
  available: "bg-emerald-100 text-emerald-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-slate-200 text-slate-700",
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
        <h1 className="text-2xl font-bold">Invalid vehicle link</h1>

        <Link to="/cars" className="mt-5 inline-block text-blue-600">
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
        <div className="h-6 w-40 rounded bg-slate-200" />
        <div className="h-14 w-80 max-w-full rounded bg-slate-200" />
        <div className="h-96 rounded-3xl bg-slate-200" />
        <div className="h-64 rounded-3xl bg-slate-100" />
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
        className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white px-8 py-20 text-center"
      >
        <CarFront size={48} className="mx-auto mb-6 text-slate-400" />

        <h1 className="text-2xl font-bold text-slate-950">
          {notFound ? "Vehicle not found" : "Unable to load vehicle"}
        </h1>

        <p className="mt-4 text-slate-600">
          {notFound
            ? "This vehicle may have been removed or the link is incorrect."
            : "Something went wrong while loading the vehicle details."}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/cars"
            className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Browse Inventory
          </Link>

          {!notFound && (
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50"
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
      <Link
        to="/cars"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
      >
        <ArrowLeft size={18} />
        Back to Inventory
      </Link>

      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            {car.make}
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            {car.make} {car.model}
          </h1>

          <p className="mt-4 text-slate-500">
            {car.year} Model · {car.transmission} · {car.fuel_type}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-5 py-2 text-sm font-semibold capitalize ${statusStyles[car.status]}`}
        >
          {car.status}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <div className="relative flex min-h-[350px] items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-blue-100 sm:min-h-[460px]">
            <div className="absolute h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />

            <CarFront
              aria-label="Vehicle illustration"
              role="img"
              size={180}
              strokeWidth={0.8}
              className="relative text-slate-400"
            />

            <span className="absolute bottom-6 left-6 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-slate-500 shadow-sm">
              Vehicle image not available
            </span>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
            <h2 className="text-2xl font-bold text-slate-950">
              Vehicle Specifications
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {specifications.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                    <Icon size={22} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">{label}</p>

                    <p className="mt-1 font-semibold capitalize text-slate-950">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-sm font-medium text-slate-500">Listed Price</p>

            <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              {formatPrice(car.price)}
            </p>

            <div className="my-8 border-t border-slate-100" />

            <div className="space-y-5">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Manufacturer</span>
                <span className="font-semibold">{car.make}</span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Model</span>
                <span className="font-semibold">{car.model}</span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold capitalize">{car.category}</span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Year</span>
                <span className="font-semibold">{car.year}</span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Availability</span>
                <span className="font-semibold capitalize">{car.status}</span>
              </div>
            </div>

            <PurchaseVehicleButton car={car} />

            <Link
              to="/cars"
              className="mt-7 flex w-full items-center justify-center rounded-xl border border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Explore More Vehicles
            </Link>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-7">
            <ShieldCheck size={26} className="text-blue-600" />

            <h3 className="mt-4 text-lg font-bold text-slate-950">
              Clear Vehicle Information
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              Review vehicle specifications, pricing, stock availability, and
              purchase options in one convenient place.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
