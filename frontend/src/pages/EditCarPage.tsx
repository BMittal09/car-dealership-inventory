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

const inputStyles =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

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
        queryClient.invalidateQueries({ queryKey: ["cars"] }),
        queryClient.invalidateQueries({
          queryKey: ["car", car.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
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
      <div>
        <Link
          to="/admin/cars"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Vehicle Management
        </Link>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <CarFront size={28} />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Edit Vehicle
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Update {car.make} {car.model} and save your changes.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
      >
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-950">
            Vehicle Information
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Update vehicle specifications, inventory quantity, and availability
            status.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="edit-make"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Manufacturer
            </label>
            <input
              id="edit-make"
              required
              maxLength={100}
              value={values.make}
              onChange={(event) => updateField("make", event.target.value)}
              className={inputStyles}
            />
          </div>

          <div>
            <label
              htmlFor="edit-model"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Model
            </label>
            <input
              id="edit-model"
              required
              maxLength={100}
              value={values.model}
              onChange={(event) => updateField("model", event.target.value)}
              className={inputStyles}
            />
          </div>

          <div>
            <label
              htmlFor="edit-category"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Vehicle Category
            </label>
            <select
              id="edit-category"
              required
              value={values.category}
              onChange={(event) => updateField("category", event.target.value)}
              className={inputStyles}
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

          <div>
            <label
              htmlFor="edit-year"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
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
              className={inputStyles}
            />
          </div>

          <div>
            <label
              htmlFor="edit-price"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
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
              className={inputStyles}
            />
          </div>

          <div>
            <label
              htmlFor="edit-quantity"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
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
              className={inputStyles}
            />

            <p className="mt-2 text-xs text-slate-500">
              Set to 0 when the vehicle is out of stock.
            </p>
          </div>

          <div>
            <label
              htmlFor="edit-mileage"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
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
              className={inputStyles}
            />
          </div>

          <div>
            <label
              htmlFor="edit-fuel"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Fuel Type
            </label>
            <select
              id="edit-fuel"
              value={values.fuel_type}
              onChange={(event) =>
                updateField("fuel_type", event.target.value as FuelType)
              }
              className={inputStyles}
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
              <option value="cng">CNG</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-transmission"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Transmission
            </label>
            <select
              id="edit-transmission"
              value={values.transmission}
              onChange={(event) =>
                updateField("transmission", event.target.value as Transmission)
              }
              className={inputStyles}
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-status"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Availability Status
            </label>
            <select
              id="edit-status"
              value={values.status}
              onChange={(event) =>
                updateField("status", event.target.value as CarStatus)
              }
              className={inputStyles}
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <div className="mt-10 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-8 sm:flex-row">
          <Link
            to="/admin/cars"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
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
    return <div role="alert">Invalid vehicle link.</div>;
  }

  if (isPending) {
    return (
      <div
        role="status"
        className="flex min-h-80 items-center justify-center gap-3 text-slate-500"
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
        className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center"
      >
        <h1 className="text-2xl font-bold text-slate-950">
          {notFound ? "Vehicle not found" : "Unable to load vehicle"}
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          {notFound
            ? "The requested vehicle does not exist."
            : "Please check your connection and try again."}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/admin/cars"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Inventory
          </Link>

          {!notFound && (
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold"
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
