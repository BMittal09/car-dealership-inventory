import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, PackagePlus, RefreshCw, X } from "lucide-react";
import { restockVehicle, type Car } from "../api/cars";
import { useAuth } from "../hooks/useAuth";

interface RestockVehicleDialogProps {
  car: Car;
  onClose: () => void;
}

const MAX_QUANTITY = 2147483647;

function validateQuantity(value: string, currentStock: number): string | null {
  if (!/^[0-9]+$/.test(value)) {
    return "Enter a positive whole number.";
  }

  const quantity = Number(value);

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_QUANTITY
  ) {
    return "Quantity must be between 1 and 2147483647.";
  }

  if (quantity > MAX_QUANTITY - currentStock) {
    return "Restock would exceed the maximum inventory quantity.";
  }

  return null;
}

export default function RestockVehicleDialog({
  car,
  onClose,
}: RestockVehicleDialogProps) {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState("");
  const [validationError, setValidationError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const restockMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!accessToken || user?.role !== "admin") {
        throw new Error("Administrator authentication required.");
      }

      return restockVehicle(car.id, amount, accessToken);
    },

    onSuccess: async (result) => {
      queryClient.setQueryData(["car", car.id], result);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cars"] }),
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({
          queryKey: ["car", car.id],
        }),
      ]);
    },
  });

  const isPending = restockMutation.isPending;

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    previousFocusRef.current = previouslyFocusedElement;

    inputRef.current?.focus();

    return () => {
      previouslyFocusedElement?.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = inputRef.current?.closest('[role="dialog"]');

      if (!dialog) {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), a[href]",
        ),
      );

      if (focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPending, onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const error = validateQuantity(quantity, car.quantity);

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");
    restockMutation.mutate(Number(quantity));
  }

  function handleClose() {
    if (isPending) {
      return;
    }

    onClose();
  }

  const quantityError = quantity
    ? validateQuantity(quantity, car.quantity)
    : null;

  const previewQuantity =
    quantity && !quantityError ? car.quantity + Number(quantity) : null;

  const errorMessage =
    validationError ||
    (restockMutation.isError
      ? restockMutation.error instanceof Error
        ? restockMutation.error.message
        : "Unable to restock vehicle. Please try again."
      : "");

  const updatedQuantity = restockMutation.data?.car.quantity ?? car.quantity;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restock-dialog-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#11151C] p-6 text-white shadow-2xl shadow-black/50 sm:p-8"
      >
        {/* Dialog Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              <PackagePlus size={19} />
              Inventory Management
            </div>

            <h2
              id="restock-dialog-title"
              className="mt-4 text-2xl font-bold tracking-tight text-white"
            >
              Restock Vehicle
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Add more units to your inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label="Close restock dialog"
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Vehicle Summary */}
        <div className="mt-7 rounded-2xl border border-white/10 bg-[#0B0F15] p-5">
          <p className="text-lg font-bold text-white">
            {car.make} {car.model}
          </p>

          <p className="mt-1 text-sm capitalize text-slate-500">
            {car.year} · {car.category}
          </p>

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-sm text-slate-400">Current Stock</span>

            <span className="font-bold text-white">
              {updatedQuantity} units
            </span>
          </div>
        </div>

        {restockMutation.isSuccess ? (
          <div className="mt-6 space-y-5">
            <div
              role="status"
              className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-300"
            >
              <CheckCircle2 size={20} />
              Vehicle restocked successfully.
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="restock-quantity"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Quantity to Add
              </label>

              <input
                ref={inputRef}
                id="restock-quantity"
                type="number"
                min={1}
                max={MAX_QUANTITY}
                step={1}
                required
                value={quantity}
                disabled={isPending}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setValidationError("");
                  restockMutation.reset();
                }}
                placeholder="e.g. 5"
                className="w-full rounded-xl border border-white/10 bg-[#0B0F15] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:opacity-50"
              />
            </div>

            {/* Stock Preview */}
            {previewQuantity !== null && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                <p className="text-sm text-blue-300">Stock After Restocking</p>

                <p className="mt-1 text-xl font-bold text-white">
                  {previewQuantity} units
                </p>
              </div>
            )}

            {/* Error */}
            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300"
              >
                {errorMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Restocking...
                  </>
                ) : (
                  <>
                    <PackagePlus size={17} />
                    Confirm Restock
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
