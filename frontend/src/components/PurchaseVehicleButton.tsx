import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShoppingCart, X } from "lucide-react";
import { Link } from "react-router";
import { purchaseVehicle, type Car } from "../api/cars";
import { useAuth } from "../hooks/useAuth";

interface PurchaseVehicleButtonProps {
  car: Car;
}

function formatPrice(price: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

export default function PurchaseVehicleButton({
  car,
}: PurchaseVehicleButtonProps) {
  const { accessToken, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [showConfirmation, setShowConfirmation] = useState(false);

  const purchaseButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const purchaseMutation = useMutation({
    mutationFn: () => {
      if (!accessToken) {
        throw new Error("Authentication required. Please log in.");
      }

      return purchaseVehicle(car.id, accessToken);
    },

    onSuccess: async (result) => {
      // Immediately update the cached vehicle details.
      queryClient.setQueryData(["car", car.id], result);

      // Refresh public inventory and administrator queries.
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

      setShowConfirmation(false);
    },
  });

  const isPending = purchaseMutation.isPending;

  const remainingQuantity = purchaseMutation.data?.car.quantity ?? car.quantity;

  const isOutOfStock = remainingQuantity === 0;
  const isUnavailable = car.status !== "available";

  const stockLabel =
    remainingQuantity === 1
      ? "1 unit in stock"
      : `${remainingQuantity} units in stock`;

  function openConfirmation() {
    if (
      !isAuthenticated ||
      !accessToken ||
      isOutOfStock ||
      isUnavailable ||
      isPending
    ) {
      return;
    }

    purchaseMutation.reset();
    setShowConfirmation(true);
  }

  function closeConfirmation() {
    if (isPending) {
      return;
    }

    setShowConfirmation(false);
  }

  function confirmPurchase() {
    if (isPending || !showConfirmation) {
      return;
    }

    purchaseMutation.mutate();
  }

  useEffect(() => {
    if (!showConfirmation) {
      return;
    }

    const previouslyFocusedElement = document.activeElement;

    // Capture the element before the effect cleanup runs.
    // This prevents the React Hooks exhaustive-deps warning.
    const purchaseButtonElement = purchaseButtonRef.current;

    confirmButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!isPending) {
          event.preventDefault();
          setShowConfirmation(false);
        }

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
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

      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      } else {
        purchaseButtonElement?.focus();
      }
    };
  }, [showConfirmation, isPending]);

  return (
    <div className="mt-8 space-y-4 border-t border-slate-100 pt-7">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-600">
          Inventory Availability
        </span>

        <span
          className={`text-sm font-bold ${
            isOutOfStock ? "text-red-600" : "text-emerald-700"
          }`}
        >
          {stockLabel}
        </span>
      </div>

      {purchaseMutation.isSuccess && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 size={19} />
          Purchase successful! Inventory has been updated.
        </div>
      )}

      {purchaseMutation.isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {purchaseMutation.error instanceof Error
            ? purchaseMutation.error.message
            : "Unable to purchase vehicle. Please try again."}
        </div>
      )}

      {isOutOfStock ? (
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-6 py-4 text-sm font-semibold text-slate-500"
        >
          Out of Stock
        </button>
      ) : isUnavailable ? (
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-6 py-4 text-sm font-semibold text-slate-500"
        >
          Vehicle Unavailable
        </button>
      ) : !isAuthenticated ? (
        <Link
          to="/login"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          <ShoppingCart size={18} />
          Log In to Purchase
        </Link>
      ) : (
        <button
          ref={purchaseButtonRef}
          type="button"
          disabled={isPending || showConfirmation}
          onClick={openConfirmation}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingCart size={18} />
          {isPending ? "Processing Purchase..." : "Purchase Vehicle"}
        </button>
      )}

      <p className="text-xs leading-5 text-slate-500">
        This action decreases available inventory by one unit. No payment is
        collected.
      </p>

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8">
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="purchase-dialog-title"
            aria-describedby="purchase-dialog-description"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                  <ShoppingCart size={19} />
                  Inventory Purchase
                </div>

                <h2
                  id="purchase-dialog-title"
                  className="mt-3 text-2xl font-bold text-slate-950"
                >
                  Confirm Vehicle Purchase
                </h2>
              </div>

              <button
                type="button"
                onClick={closeConfirmation}
                disabled={isPending}
                aria-label="Close purchase confirmation"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>

            <p
              id="purchase-dialog-description"
              className="mt-5 text-sm leading-7 text-slate-600"
            >
              You are about to purchase one unit of the following vehicle. This
              will decrease the available inventory by one unit. No payment is
              collected.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <p className="text-lg font-bold text-slate-950">
                {car.make} {car.model}
              </p>

              <p className="mt-1 text-sm capitalize text-slate-500">
                {car.year} · {car.category}
              </p>

              <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">Listed Price</span>

                  <span className="font-bold text-slate-950">
                    {formatPrice(car.price)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">Current Stock</span>

                  <span className="font-semibold text-slate-950">
                    {remainingQuantity} units
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">Stock After Purchase</span>

                  <span className="font-semibold text-blue-700">
                    {Math.max(0, remainingQuantity - 1)} units
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={isPending}
                className="flex-1 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                ref={confirmButtonRef}
                type="button"
                onClick={confirmPurchase}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart size={17} />
                {isPending ? "Processing Purchase..." : "Confirm Purchase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
