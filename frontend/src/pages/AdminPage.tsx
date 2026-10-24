import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router";
import { getCars, type Car } from "../api/cars";
import { useAuth } from "../hooks/useAuth";

const statusStyles: Record<Car["status"], string> = {
  available: "bg-emerald-50 text-emerald-700",
  reserved: "bg-amber-50 text-amber-700",
  sold: "bg-slate-100 text-slate-700",
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
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Available",
      value: availableQuery.data?.pagination.total ?? 0,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Reserved",
      value: reservedQuery.data?.pagination.total ?? 0,
      icon: Clock3,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Sold",
      value: soldQuery.data?.pagination.total ?? 0,
      icon: ShoppingBag,
      color: "bg-slate-100 text-slate-600",
    },
  ];

  const recentCars = inventoryQuery.data?.cars ?? [];

  function refreshDashboard() {
    for (const query of queries) {
      void query.refetch();
    }
  }

  return (
    <div className="space-y-10 pb-12">
      <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <LayoutDashboard size={18} />
            Administrator Workspace
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            Admin Dashboard
          </h1>

          <p className="mt-4 text-slate-600">
            Welcome back, {user?.name ?? "Administrator"}. Here's an overview of
            your vehicle inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshDashboard}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={17} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
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
              className="h-36 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center"
        >
          <h2 className="text-xl font-bold text-slate-950">
            Unable to load dashboard
          </h2>

          <p className="mt-3 text-sm text-slate-600">
            We couldn't retrieve the latest inventory information.
          </p>

          <button
            type="button"
            onClick={refreshDashboard}
            className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}
                  >
                    <Icon size={23} />
                  </span>
                </div>

                <p className="mt-6 text-3xl font-bold tracking-tight text-slate-950">
                  {value}
                </p>

                <p className="mt-2 text-sm font-medium text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Inventory Overview
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  A snapshot of your vehicle listings.
                </p>
              </div>

              <Link
                to="/admin/cars"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Manage Vehicles
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Vehicle</th>
                    <th className="px-6 py-4 font-semibold">Year</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Details</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentCars.map((car) => (
                    <tr key={car.id} className="hover:bg-slate-50">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">
                          {car.make} {car.model}
                        </p>
                        <p className="mt-1 text-xs capitalize text-slate-500">
                          {car.fuel_type} · {car.transmission}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {car.year}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-950">
                        {formatPrice(car.price)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusStyles[car.status]}`}
                        >
                          {car.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <Link
                          to={`/cars/${car.id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {recentCars.length === 0 && (
                <div className="px-6 py-14 text-center text-sm text-slate-500">
                  No vehicles in the inventory yet.
                </div>
              )}
            </div>
          </section>

          <section className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <ShieldCheck size={25} className="shrink-0 text-blue-600" />

            <div>
              <h2 className="font-bold text-slate-950">Administrator Access</h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                This dashboard is protected by JWT authentication and backend
                role-based authorization. Vehicle management controls will be
                added next.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
