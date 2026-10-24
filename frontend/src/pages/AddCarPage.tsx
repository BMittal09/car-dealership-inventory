import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CarFront, Plus, Save } from "lucide-react";
import { Link, useNavigate } from "react-router";
import {
  createCar,
  type CreateCarInput,
  type FuelType,
  type Transmission,
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
}

const initialValues: CarFormValues = {
  make: "",
  model: "",
  category: "",
  year: "",
  price: "",
  quantity: "",
  mileage: "",
  fuel_type: "petrol",
  transmission: "manual",
};

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

export default function AddCarPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const [values, setValues] = useState<CarFormValues>(initialValues);
  const [validationError, setValidationError] = useState("");

  const createMutation = useMutation({
    mutationFn: (input: CreateCarInput) => {
      if (!accessToken) {
        throw new Error("Authentication required. Please log in again.");
      }

      return createCar(input, accessToken);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["cars"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin"],
      });

      void navigate("/admin/cars", {
        replace: true,
        state: {
          successMessage: "Vehicle added successfully.",
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

    setValidationError("");

    const input: CreateCarInput = {
      make: values.make.trim(),
      model: values.model.trim(),
      category: values.category.trim(),
      year: Number(values.year),
      price: Number(values.price).toFixed(2),
      quantity: Number(values.quantity),
      mileage: Number(values.mileage),
      fuel_type: values.fuel_type,
      transmission: values.transmission,
    };

    createMutation.mutate(input);
  }

  const errorMessage =
    validationError ||
    (createMutation.isError
      ? createMutation.error instanceof Error
        ? createMutation.error.message
        : "Unable to create vehicle. Please try again."
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
              Add New Vehicle
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Enter the vehicle details to add it to your inventory.
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
            All fields are required. New vehicles are listed as available.
            Quantity can be zero for out-of-stock vehicles.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
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
              required
              maxLength={100}
              placeholder="e.g. Toyota"
              value={values.make}
              onChange={(event) => updateField("make", event.target.value)}
              className={inputStyles}
            />
          </div>

          <div>
            <label
              htmlFor="car-model"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Model
            </label>

            <input
              id="car-model"
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Corolla"
              value={values.model}
              onChange={(event) => updateField("model", event.target.value)}
              className={inputStyles}
            />
          </div>

          <div>
            <label
              htmlFor="car-category"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Vehicle Category
            </label>

            <select
              id="car-category"
              required
              value={values.category}
              onChange={(event) => updateField("category", event.target.value)}
              className={inputStyles}
            >
              <option value="">Select a category</option>

              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="car-year"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Model Year
            </label>

            <input
              id="car-year"
              type="number"
              required
              min={1886}
              max={2100}
              step={1}
              placeholder="e.g. 2023"
              value={values.year}
              onChange={(event) => updateField("year", event.target.value)}
              className={inputStyles}
            />
          </div>

          <div>
            <label
              htmlFor="car-price"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Price (INR)
            </label>

            <input
              id="car-price"
              type="number"
              required
              min={0}
              max={9999999999.99}
              step="0.01"
              placeholder="e.g. 1250000"
              value={values.price}
              onChange={(event) => updateField("price", event.target.value)}
              className={inputStyles}
            />
          </div>

          <div>
            <label
              htmlFor="car-quantity"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Quantity in Stock
            </label>

            <input
              id="car-quantity"
              type="number"
              required
              min={0}
              max={2147483647}
              step={1}
              placeholder="e.g. 5"
              value={values.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
              className={inputStyles}
            />

            <p className="mt-2 text-xs text-slate-500">
              Enter 0 if the vehicle is currently out of stock.
            </p>
          </div>

          <div>
            <label
              htmlFor="car-mileage"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Mileage (km)
            </label>

            <input
              id="car-mileage"
              type="number"
              required
              min={0}
              step={1}
              placeholder="e.g. 18000"
              value={values.mileage}
              onChange={(event) => updateField("mileage", event.target.value)}
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
              htmlFor="car-transmission"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Transmission
            </label>

            <select
              id="car-transmission"
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
            disabled={createMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <>
                <Save size={18} />
                Saving Vehicle...
              </>
            ) : (
              <>
                <Plus size={18} />
                Add Vehicle
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
