import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { deleteCar, getCars, type Car, type CarStatus } from "../api/cars";
import DeleteCarDialog from "../components/DeleteCarDialog";
import { useAuth } from "../hooks/useAuth";

const PAGE_SIZE = 10;

const statusStyles: Record<CarStatus, string> = {
  available: "bg-emerald-50 text-emerald-700",
  reserved: "bg-amber-50 text-amber-700",
  sold: "bg-slate-100 text-slate-700",
};

interface NavigationState {
  successMessage?: string;
}

function formatPrice(price: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

export default function AdminCarsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CarStatus | undefined>();

  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(() => {
    const state = location.state as NavigationState | null;
    return state?.successMessage ?? null;
  });

  const {
    data,
    isPending,
    isError,
    isFetching,
    isPlaceholderData,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "cars", { page, search, status }],
    queryFn: ({ signal }) =>
      getCars(
        {
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          status,
        },
        signal,
      ),
    placeholderData: (previousData) => previousData,
  });

  const cars = data?.cars ?? [];
  const pagination = data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: async (carId: string) => {
      if (!accessToken) {
        throw new Error("Authentication required. Please log in again.");
      }

      await deleteCar(carId, accessToken);
    },

    onSuccess: async () => {
      const deletedCar = selectedCar;

      setSelectedCar(null);

      setSuccessMessage(
        deletedCar
          ? `${deletedCar.make} ${deletedCar.model} deleted successfully.`
          : "Vehicle deleted successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["cars"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["car"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin"],
        }),
      ]);

      // If the final record on a page was deleted,
      // return to the previous page.
      if (pagination && page > 1) {
        const newTotal = Math.max(0, pagination.total - 1);
        const lastPage = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));

        if (page > lastPage) {
          setPage(lastPage);
        }
      }
    },
  });

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateStatus(value: string) {
    setStatus(value ? (value as CarStatus) : undefined);
    setPage(1);
  }

  function openDeleteDialog(car: Car) {
    deleteMutation.reset();
    setSelectedCar(car);
  }

  function closeDeleteDialog() {
    if (deleteMutation.isPending) {
      return;
    }

    setSelectedCar(null);
    deleteMutation.reset();
  }

  function confirmDelete() {
    if (!selectedCar || deleteMutation.isPending) {
      return;
    }

    deleteMutation.mutate(selectedCar.id);
  }

  function dismissSuccessMessage() {
    setSuccessMessage(null);

    void navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }

  const deleteError = deleteMutation.isError
    ? deleteMutation.error instanceof Error
      ? deleteMutation.error.message
      : "Unable to delete vehicle. Please try again."
    : null;

  return (
    <div className="space-y-8 pb-12">
      {successMessage && (
        <div
          role="status"
          className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={21} className="shrink-0 text-emerald-600" />

            <p className="text-sm font-semibold text-emerald-800">
              {successMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={dismissSuccessMessage}
            aria-label="Dismiss notification"
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Manage Vehicles
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            View and manage your dealership inventory.
          </p>
        </div>

        <Link
          to="/admin/cars/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          <Plus size={18} />
          Add Vehicle
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              aria-label="Search vehicles"
              placeholder="Search by make or model..."
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            aria-label="Filter by status"
            value={status ?? ""}
            onChange={(event) => updateStatus(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Vehicle Inventory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {pagination && !isPlaceholderData
                ? `${pagination.total} vehicle${pagination.total === 1 ? "" : "s"} found`
                : "Loading vehicles..."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh inventory"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={19} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>

        {isPending || isPlaceholderData ? (
          <div
            role="status"
            className="flex min-h-64 items-center justify-center gap-3 text-slate-500"
          >
            <RefreshCw size={20} className="animate-spin" />
            Loading vehicles...
          </div>
        ) : isError ? (
          <div role="alert" className="px-6 py-16 text-center">
            <p className="font-semibold text-red-600">
              Unable to load vehicles
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {error instanceof Error ? error.message : "Please try again."}
            </p>

            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : cars.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <CarFront size={42} className="mx-auto text-slate-400" />

            <h3 className="mt-5 text-lg font-bold text-slate-950">
              No vehicles found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Vehicle</th>

                  <th className="px-6 py-4 font-semibold">Year</th>

                  <th className="px-6 py-4 font-semibold">Price</th>

                  <th className="px-6 py-4 font-semibold">Mileage</th>

                  <th className="px-6 py-4 font-semibold">Status</th>

                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {cars.map((car) => (
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

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {new Intl.NumberFormat("en-IN").format(car.mileage)} km
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusStyles[car.status]}`}
                      >
                        {car.status}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/cars/${car.id}/edit`}
                          aria-label={`Edit ${car.make} ${car.model}`}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={18} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => openDeleteDialog(car)}
                          aria-label={`Delete ${car.make} ${car.model}`}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pagination &&
        pagination.totalPages > 1 &&
        !isError &&
        !isPlaceholderData && (
          <nav
            aria-label="Admin inventory pagination"
            className="flex flex-col items-center justify-between gap-4 sm:flex-row"
          >
            <p className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pagination.totalPages || isFetching}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          </nav>
        )}

      {selectedCar && (
        <DeleteCarDialog
          car={selectedCar}
          isDeleting={deleteMutation.isPending}
          errorMessage={deleteError}
          onConfirm={confirmDelete}
          onCancel={closeDeleteDialog}
        />
      )}
    </div>
  );
}
