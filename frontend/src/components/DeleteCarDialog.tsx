import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { Car } from "../api/cars";

interface DeleteCarDialogProps {
  car: Car;
  isDeleting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteCarDialog({
  car,
  isDeleting,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteCarDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;

    cancelButtonRef.current?.focus();

    return () => {
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!isDeleting) {
          event.preventDefault();
          onCancel();
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
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDeleting, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-car-title"
        aria-describedby="delete-car-description"
        tabIndex={-1}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11151C] p-7 text-white shadow-2xl shadow-black/50 outline-none sm:p-9"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-400">
            <AlertTriangle size={28} />
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="Close dialog"
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Title */}
        <h2
          id="delete-car-title"
          className="mt-7 text-2xl font-bold tracking-tight text-white"
        >
          Delete Vehicle?
        </h2>

        {/* Description */}
        <p
          id="delete-car-description"
          className="mt-4 text-sm leading-7 text-slate-400"
        >
          Are you sure you want to permanently delete{" "}
          <strong className="font-semibold text-white">
            {car.make} {car.model}
          </strong>
          ? This action cannot be undone.
        </p>

        {/* Warning */}
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />

            <p className="text-sm leading-6 text-red-200">
              This vehicle listing will be permanently removed from your
              inventory.
            </p>
          </div>
        </div>

        {/* API Error */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={17} />

            {isDeleting ? "Deleting..." : "Delete Vehicle"}
          </button>
        </div>
      </div>
    </div>
  );
}
