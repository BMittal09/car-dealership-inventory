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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cars"] }),
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
      ]);

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
              Add New Vehicle<span className="text-blue-500">.</span>
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Enter the vehicle details to add it to your collection.
            </p>
          </div>
        </div>
      </section>

      {/* Vehicle Form */}
      <form onSubmit={handleSubmit} className={carFormStyles.container}>
        <div className="mb-8 border-b border-white/10 pb-7">
          <h2 className="text-xl font-bold text-white">Vehicle Information</h2>

          <p className="mt-2 text-sm leading-7 text-slate-400">
            All fields are required. New vehicles are listed as available.
            Quantity can be zero for out-of-stock vehicles.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Manufacturer */}
          <div>
            <label htmlFor="car-make" className={carFormStyles.label}>
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
              className={carFormStyles.input}
            />
          </div>

          {/* Model */}
          <div>
            <label htmlFor="car-model" className={carFormStyles.label}>
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
              className={carFormStyles.input}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="car-category" className={carFormStyles.label}>
              Vehicle Category
            </label>

            <select
              id="car-category"
              required
              value={values.category}
              onChange={(event) => updateField("category", event.target.value)}
              className={carFormStyles.input}
            >
              <option value="">Select a category</option>

              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label htmlFor="car-year" className={carFormStyles.label}>
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
              className={carFormStyles.input}
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="car-price" className={carFormStyles.label}>
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
              className={carFormStyles.input}
            />
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="car-quantity" className={carFormStyles.label}>
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
              className={carFormStyles.input}
            />

            <p className={carFormStyles.helper}>
              Enter 0 if the vehicle is currently out of stock.
            </p>
          </div>

          {/* Mileage */}
          <div>
            <label htmlFor="car-mileage" className={carFormStyles.label}>
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
              className={carFormStyles.input}
            />
          </div>

          {/* Fuel */}
          <div>
            <label htmlFor="car-fuel" className={carFormStyles.label}>
              Fuel Type
            </label>

            <select
              id="car-fuel"
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
            <label htmlFor="car-transmission" className={carFormStyles.label}>
              Transmission
            </label>

            <select
              id="car-transmission"
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
            disabled={createMutation.isPending}
            className={carFormStyles.primaryButton}
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
