import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  CarFront,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { Link } from "react-router";
import { getCars, type Car } from "../api/cars";
import { useAuth } from "../hooks/useAuth";
import { getCarImage } from "../utils/carImages";

const statusStyles: Record<Car["status"], string> = {
  available: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  reserved: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  sold: "border-white/10 bg-white/5 text-slate-300",
};

function formatPrice(price: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

export default function AdminPage() {
  const { user } = useAuth();

  const inventoryQuery = useQuery({
    queryKey: ["admin", "inventory-overview"],
    queryFn: ({ signal }) => getCars({ page: 1, limit: 5 }, signal),
  });

  const availableQuery = useQuery({
    queryKey: ["admin", "available-count"],
    queryFn: ({ signal }) =>
      getCars({ status: "available", page: 1, limit: 1 }, signal),
  });

  const reservedQuery = useQuery({
    queryKey: ["admin", "reserved-count"],
    queryFn: ({ signal }) =>
      getCars({ status: "reserved", page: 1, limit: 1 }, signal),
  });

  const soldQuery = useQuery({
    queryKey: ["admin", "sold-count"],
    queryFn: ({ signal }) =>
      getCars({ status: "sold", page: 1, limit: 1 }, signal),
  });

  const queries = [inventoryQuery, availableQuery, reservedQuery, soldQuery];

  const isLoading = queries.some((query) => query.isPending);
  const isError = queries.some((query) => query.isError);
  const isFetching = queries.some((query) => query.isFetching);

  const statistics = [
    {
      label: "Total Vehicles",
      value: inventoryQuery.data?.pagination.total ?? 0,
      icon: CarFront,
      color: "text-blue-400",
      background: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Available",
      value: availableQuery.data?.pagination.total ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
      background: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Reserved",
      value: reservedQuery.data?.pagination.total ?? 0,
      icon: Clock3,
      color: "text-amber-400",
      background: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Sold",
      value: soldQuery.data?.pagination.total ?? 0,
      icon: ShoppingBag,
      color: "text-slate-300",
      background: "bg-white/5",
      border: "border-white/10",
    },
  ];

  const recentCars = inventoryQuery.data?.cars ?? [];

  function refreshDashboard() {
    for (const query of queries) {
      void query.refetch();
    }
  }

  return (
    <div className="space-y-9 pb-12">
      {/* Dashboard Header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101521] px-7 py-10 sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
              <LayoutDashboard size={18} />
              Administrator Workspace
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-[-0.045em] text-white sm:text-5xl">
              Dashboard<span className="text-blue-500">.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Welcome back,{" "}
              <span className="font-semibold text-white">
                {user?.name ?? "Administrator"}
              </span>
              . Manage your collection and monitor your inventory.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={refreshDashboard}
              disabled={isFetching}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={isFetching ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              to="/admin/cars/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <Plus size={18} />
              Add Vehicle
            </Link>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div
          role="status"
          aria-label="Loading dashboard"
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl border border-white/10 bg-[#11151C]"
            />
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center"
        >
          <h2 className="text-xl font-bold text-white">
            Unable to load dashboard
          </h2>

          <p className="mt-3 text-sm text-red-200">
            We couldn't retrieve the latest inventory information.
          </p>

          <button
            type="button"
            onClick={refreshDashboard}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.map(
              ({ label, value, icon: Icon, color, background, border }) => (
                <div
                  key={label}
                  className="group rounded-2xl border border-white/10 bg-[#11151C] p-6 transition hover:-translate-y-1 hover:border-white/20 hover:bg-[#151B25]"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border ${background} ${color} ${border}`}
                    >
                      <Icon size={23} />
                    </span>

                    <ArrowUpRight
                      size={18}
                      className="text-slate-600 transition group-hover:text-blue-400"
                    />
                  </div>

                  <p className="mt-7 text-4xl font-bold tracking-tight text-white">
                    {value}
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-400">
                    {label}
                  </p>
                </div>
              ),
            )}
          </section>

          {/* Inventory Overview */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#11151C]">
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:p-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                  Your Collection
                </p>

                <h2 className="mt-3 text-2xl font-bold text-white">
                  Inventory Overview
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  A snapshot of your latest vehicle listings.
                </p>
              </div>

              <Link
                to="/admin/cars"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
              >
                Manage Vehicles
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-[#0B0F15] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Vehicle</th>
                    <th className="px-6 py-4 font-semibold">Year</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Details</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {recentCars.map((car) => (
                    <tr
                      key={car.id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={getCarImage(car.category)}
                            alt=""
                            loading="lazy"
                            className="h-14 w-20 shrink-0 rounded-lg object-cover"
                          />

                          <div>
                            <p className="font-semibold text-white">
                              {car.make} {car.model}
                            </p>

                            <p className="mt-1 text-xs capitalize text-slate-500">
                              {car.fuel_type} · {car.transmission}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-400">
                        {car.year}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-white">
                        {formatPrice(car.price)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusStyles[car.status]}`}
                        >
                          {car.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          to={`/cars/${car.id}`}
                          className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {recentCars.length === 0 && (
                <div className="px-6 py-14 text-center text-sm text-slate-400">
                  No vehicles in the inventory yet.
                </div>
              )}
            </div>
          </section>

          {/* Administrator Security Notice */}
          <section className="flex items-start gap-4 rounded-2xl border border-blue-500/20 bg-[#0B1124] p-6">
            <ShieldCheck size={25} className="shrink-0 text-blue-400" />

            <div>
              <h2 className="font-bold text-white">
                Secure Administrator Access
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-400">
                This workspace is protected by JWT authentication and backend
                role-based authorization. Authorized administrators can create,
                update, delete, and restock vehicles.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
