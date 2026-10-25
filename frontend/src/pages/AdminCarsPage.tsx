import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  CheckCircle2,
  PackagePlus,
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
import RestockVehicleDialog from "../components/RestockVehicleDialog";
import { useAuth } from "../hooks/useAuth";
import { getCarImage } from "../utils/carImages";

const PAGE_SIZE = 10;

const statusStyles: Record<CarStatus, string> = {
  available: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  reserved: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  sold: "border-white/10 bg-white/5 text-slate-300",
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
  const [restockCar, setRestockCar] = useState<Car | null>(null);

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

  function openRestockDialog(car: Car) {
    setRestockCar(car);
  }

  function closeRestockDialog() {
    setRestockCar(null);
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
      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={21} className="shrink-0 text-emerald-400" />

            <p className="text-sm font-semibold text-emerald-300">
              {successMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={dismissSuccessMessage}
            aria-label="Dismiss notification"
            className="rounded-lg p-1 text-emerald-300 transition hover:bg-emerald-500/15"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101521] px-7 py-10 sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>

            <div className="mt-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
              <CarFront size={18} />
              Administrator Workspace
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-white sm:text-5xl">
              Manage Vehicles<span className="text-blue-500">.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              View, update, restock, and manage your dealership inventory from
              one central workspace.
            </p>
          </div>

          <Link
            to="/admin/cars/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 sm:self-auto"
          >
            <Plus size={18} />
            Add Vehicle
          </Link>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="rounded-2xl border border-white/10 bg-[#11151C] p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">Search Inventory</h2>

          <p className="mt-1 text-sm text-slate-400">
            Find and manage individual vehicle listings.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="search"
              aria-label="Search vehicles"
              placeholder="Search by make or model..."
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0B0F15] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>

          <select
            aria-label="Filter by status"
            value={status ?? ""}
            onChange={(event) => updateStatus(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0B0F15] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </section>

      {/* Inventory Table */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#11151C]">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-6 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Your Collection
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              Vehicle Inventory
            </h2>

            <p className="mt-2 text-sm text-slate-400">
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
            className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={19} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>

        {isPending || isPlaceholderData ? (
          <div
            role="status"
            className="flex min-h-64 items-center justify-center gap-3 text-slate-400"
          >
            <RefreshCw size={20} className="animate-spin" />
            Loading vehicles...
          </div>
        ) : isError ? (
          <div role="alert" className="px-6 py-16 text-center">
            <p className="font-semibold text-red-400">
              Unable to load vehicles
            </p>

            <p className="mt-2 text-sm text-slate-400">
              {error instanceof Error ? error.message : "Please try again."}
            </p>

            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Try Again
            </button>
          </div>
        ) : cars.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <CarFront size={32} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-white">
              No vehicles found
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead className="bg-[#0B0F15] text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Vehicle</th>

                  <th className="px-6 py-4 font-semibold">Category</th>

                  <th className="px-6 py-4 font-semibold">Year</th>

                  <th className="px-6 py-4 font-semibold">Price</th>

                  <th className="px-6 py-4 font-semibold">Stock</th>

                  <th className="px-6 py-4 font-semibold">Status</th>

                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {cars.map((car) => (
                  <tr key={car.id} className="transition hover:bg-white/[0.03]">
                    {/* Vehicle */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={getCarImage(car.category)}
                          alt=""
                          loading="lazy"
                          className="h-14 w-20 shrink-0 rounded-lg bg-[#0B0F15] object-cover"
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

                    {/* Category */}
                    <td className="px-6 py-5 text-sm capitalize text-slate-400">
                      {car.category}
                    </td>

                    {/* Year */}
                    <td className="px-6 py-5 text-sm text-slate-400">
                      {car.year}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-5 text-sm font-semibold text-white">
                      {formatPrice(car.price)}
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-5">
                      <span
                        className={`text-sm font-bold ${
                          car.quantity === 0
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {car.quantity}
                      </span>

                      {car.quantity === 0 && (
                        <p className="mt-1 text-xs text-red-400">
                          Out of stock
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusStyles[car.status]}`}
                      >
                        {car.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openRestockDialog(car)}
                          aria-label={`Restock ${car.make} ${car.model}`}
                          title="Restock vehicle"
                          className="rounded-lg border border-transparent p-2.5 text-emerald-400 transition hover:border-emerald-500/20 hover:bg-emerald-500/10"
                        >
                          <PackagePlus size={18} />
                        </button>

                        <Link
                          to={`/admin/cars/${car.id}/edit`}
                          aria-label={`Edit ${car.make} ${car.model}`}
                          title="Edit vehicle"
                          className="rounded-lg border border-transparent p-2.5 text-blue-400 transition hover:border-blue-500/20 hover:bg-blue-500/10"
                        >
                          <Pencil size={18} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => openDeleteDialog(car)}
                          aria-label={`Delete ${car.make} ${car.model}`}
                          title="Delete vehicle"
                          className="rounded-lg border border-transparent p-2.5 text-red-400 transition hover:border-red-500/20 hover:bg-red-500/10"
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

      {/* Pagination */}
      {pagination &&
        pagination.totalPages > 1 &&
        !isError &&
        !isPlaceholderData && (
          <nav
            aria-label="Admin inventory pagination"
            className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row"
          >
            <p className="text-sm text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#11151C] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pagination.totalPages || isFetching}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          </nav>
        )}

      {/* Delete Confirmation */}
      {selectedCar && (
        <DeleteCarDialog
          car={selectedCar}
          isDeleting={deleteMutation.isPending}
          errorMessage={deleteError}
          onConfirm={confirmDelete}
          onCancel={closeDeleteDialog}
        />
      )}

      {/* Restock Dialog */}
      {restockCar && (
        <RestockVehicleDialog car={restockCar} onClose={closeRestockDialog} />
      )}
    </div>
  );
}
