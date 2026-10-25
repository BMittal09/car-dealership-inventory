import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CarFront, RefreshCw, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ApiError,
  getCarById,
  updateCar,
  type Car,
  type CarStatus,
  type FuelType,
  type Transmission,
  type UpdateCarInput,
} from "../api/cars";
import { carFormStyles } from "../components/carFormStyles";
import { useAuth } from "../hooks/useAuth";

interface CarFormValues {
  make: string;
  model: string;
  category: string;
  year: string;
  price: string;
  quantity: string;
  mileage: string;
  fuel_type: FuelType;
  transmission: Transmission;
  status: CarStatus;
}

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

function toFormValues(car: Car): CarFormValues {
  return {
    make: car.make,
    model: car.model,
    category: car.category,
    year: String(car.year),
    price: car.price,
    quantity: String(car.quantity),
    mileage: String(car.mileage),
    fuel_type: car.fuel_type,
    transmission: car.transmission,
    status: car.status,
  };
}

function validateForm(values: CarFormValues): string | null {
  if (!values.make.trim() || values.make.trim().length > 100) {
    return "Manufacturer must contain between 1 and 100 characters.";
  }

  if (!values.model.trim() || values.model.trim().length > 100) {
    return "Model must contain between 1 and 100 characters.";
  }

  if (!values.category.trim() || values.category.trim().length > 100) {
    return "Please select a valid vehicle category.";
  }

  const year = Number(values.year);

  if (
    !/^\d+$/.test(values.year) ||
    !Number.isSafeInteger(year) ||
    year < 1886 ||
    year > 2100
  ) {
    return "Enter a valid model year between 1886 and 2100.";
  }

  if (
    !/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(values.price) ||
    !Number.isFinite(Number(values.price))
  ) {
    return "Enter a valid non-negative price with at most two decimal places.";
  }

  const quantity = Number(values.quantity);

  if (
    !/^\d+$/.test(values.quantity) ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    quantity > 2147483647
  ) {
    return "Quantity must be a whole number between 0 and 2147483647.";
  }

  const mileage = Number(values.mileage);

  if (
    !/^\d+$/.test(values.mileage) ||
    !Number.isSafeInteger(mileage) ||
    mileage < 0
  ) {
    return "Mileage must be a non-negative whole number.";
  }

  return null;
}

function EditCarForm({ car }: { car: Car }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const [values, setValues] = useState<CarFormValues>(() => toFormValues(car));
  const [validationError, setValidationError] = useState("");

  const updateMutation = useMutation({
    mutationFn: (input: UpdateCarInput) => {
      if (!accessToken) {
        throw new Error("Authentication required. Please log in again.");
      }

      return updateCar(car.id, input, accessToken);
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["cars"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["car", car.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin"],
        }),
      ]);

      void navigate("/admin/cars", {
        replace: true,
        state: {
          successMessage: "Vehicle updated successfully.",
        },
      });
    },
  });

  function updateField<K extends keyof CarFormValues>(
    field: K,
    value: CarFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setValidationError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validateForm(values);

    if (error) {
      setValidationError(error);
      return;
    }

    const input: UpdateCarInput = {
      make: values.make.trim(),
      model: values.model.trim(),
      category: values.category.trim(),
      year: Number(values.year),
      price: Number(values.price).toFixed(2),
      quantity: Number(values.quantity),
      mileage: Number(values.mileage),
      fuel_type: values.fuel_type,
      transmission: values.transmission,
      status: values.status,
    };

    setValidationError("");
    updateMutation.mutate(input);
  }

  const errorMessage =
    validationError ||
    (updateMutation.isError
      ? updateMutation.error instanceof Error
        ? updateMutation.error.message
        : "Unable to update vehicle. Please try again."
      : "");

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Back Navigation */}
      <Link
        to="/admin/cars"
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
      >
        <ArrowLeft size={17} />
        Back to Vehicle Management
      </Link>

      {/* Page Header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101521] px-7 py-9 sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl"
        />

        <div className="relative flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <CarFront size={28} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Inventory Management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Edit Vehicle
              <span className="text-blue-500">.</span>
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Update {car.make} {car.model} and save your changes.
            </p>
          </div>
        </div>
      </section>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className={carFormStyles.container}>
        <div className="mb-8 border-b border-white/10 pb-7">
          <h2 className="text-xl font-bold text-white">Vehicle Information</h2>

          <p className="mt-2 text-sm leading-7 text-slate-400">
            Update vehicle specifications, inventory quantity, and availability
            status.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Manufacturer */}
          <div>
            <label htmlFor="edit-make" className={carFormStyles.label}>
              Manufacturer
            </label>

            <input
              id="edit-make"
              type="text"
              required
              maxLength={100}
              value={values.make}
              onChange={(event) => updateField("make", event.target.value)}
              className={carFormStyles.input}
            />
          </div>

          {/* Model */}
          <div>
            <label htmlFor="edit-model" className={carFormStyles.label}>
              Model
            </label>

            <input
              id="edit-model"
              type="text"
              required
              maxLength={100}
              value={values.model}
              onChange={(event) => updateField("model", event.target.value)}
              className={carFormStyles.input}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="edit-category" className={carFormStyles.label}>
              Vehicle Category
            </label>

            <select
              id="edit-category"
              required
              value={values.category}
              onChange={(event) => updateField("category", event.target.value)}
              className={carFormStyles.input}
            >
              {!categories.some(
                (category) => category.value === values.category,
              ) && (
                <option value={values.category}>
                  {values.category || "Select a category"}
                </option>
              )}

              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label htmlFor="edit-year" className={carFormStyles.label}>
              Model Year
            </label>

            <input
              id="edit-year"
              type="number"
              required
              min={1886}
              max={2100}
              step={1}
              value={values.year}
              onChange={(event) => updateField("year", event.target.value)}
              className={carFormStyles.input}
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="edit-price" className={carFormStyles.label}>
              Price (INR)
            </label>

            <input
              id="edit-price"
              type="number"
              required
              min={0}
              max={9999999999.99}
              step="0.01"
              value={values.price}
              onChange={(event) => updateField("price", event.target.value)}
              className={carFormStyles.input}
            />
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="edit-quantity" className={carFormStyles.label}>
              Quantity in Stock
            </label>

            <input
              id="edit-quantity"
              type="number"
              required
              min={0}
              max={2147483647}
              step={1}
              value={values.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
              className={carFormStyles.input}
            />

            <p className={carFormStyles.helper}>
              Set to 0 when the vehicle is out of stock.
            </p>
          </div>

          {/* Mileage */}
          <div>
            <label htmlFor="edit-mileage" className={carFormStyles.label}>
              Mileage (km)
            </label>

            <input
              id="edit-mileage"
              type="number"
              required
              min={0}
              step={1}
              value={values.mileage}
              onChange={(event) => updateField("mileage", event.target.value)}
              className={carFormStyles.input}
            />
          </div>

          {/* Fuel Type */}
          <div>
            <label htmlFor="edit-fuel" className={carFormStyles.label}>
              Fuel Type
            </label>

            <select
              id="edit-fuel"
              value={values.fuel_type}
              onChange={(event) =>
                updateField("fuel_type", event.target.value as FuelType)
              }
              className={carFormStyles.input}
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
              <option value="cng">CNG</option>
            </select>
          </div>

          {/* Transmission */}
          <div>
            <label htmlFor="edit-transmission" className={carFormStyles.label}>
              Transmission
            </label>

            <select
              id="edit-transmission"
              value={values.transmission}
              onChange={(event) =>
                updateField("transmission", event.target.value as Transmission)
              }
              className={carFormStyles.input}
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>

          {/* Availability */}
          <div>
            <label htmlFor="edit-status" className={carFormStyles.label}>
              Availability Status
            </label>

            <select
              id="edit-status"
              value={values.status}
              onChange={(event) =>
                updateField("status", event.target.value as CarStatus)
              }
              className={carFormStyles.input}
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        {/* Validation / API Error */}
        {errorMessage && (
          <div role="alert" className={carFormStyles.error}>
            {errorMessage}
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-10 flex flex-col-reverse justify-end gap-3 border-t border-white/10 pt-8 sm:flex-row">
          <Link to="/admin/cars" className={carFormStyles.secondaryButton}>
            Cancel
          </Link>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className={carFormStyles.primaryButton}
          >
            <Save size={18} />

            {updateMutation.isPending ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditCarPage() {
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
      <div
        role="alert"
        className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-300"
      >
        Invalid vehicle link.
      </div>
    );
  }

  if (isPending) {
    return (
      <div
        role="status"
        className="flex min-h-80 items-center justify-center gap-3 text-slate-400"
      >
        <RefreshCw size={22} className="animate-spin" />
        Loading vehicle details...
      </div>
    );
  }

  if (isError) {
    const notFound =
      error instanceof ApiError && [400, 404].includes(error.status);

    return (
      <div
        role="alert"
        className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#11151C] p-10 text-center"
      >
        <h1 className="text-2xl font-bold text-white">
          {notFound ? "Vehicle not found" : "Unable to load vehicle"}
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-400">
          {notFound
            ? "The requested vehicle does not exist."
            : "Please check your connection and try again."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/admin/cars"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Back to Inventory
          </Link>

          {!notFound && (
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return <EditCarForm key={data.car.id} car={data.car} />;
}
