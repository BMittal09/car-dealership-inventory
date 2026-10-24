import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeleteCarDialog from "./DeleteCarDialog";
import type { Car } from "../api/cars";

const testCar: Car = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  make: "Nissan",
  model: "Magnite",
  year: 2023,
  price: "825000.00",
  mileage: 16500,
  fuel_type: "petrol",
  transmission: "manual",
  status: "reserved",
  created_at: "2026-10-24T10:00:00.000Z",
  updated_at: "2026-10-24T10:00:00.000Z",
};

const onConfirm = vi.fn();
const onCancel = vi.fn();

interface DialogOverrides {
  isDeleting?: boolean;
  errorMessage?: string | null;
}

function renderDialog(overrides: DialogOverrides = {}) {
  return render(
    <DeleteCarDialog
      car={testCar}
      isDeleting={overrides.isDeleting ?? false}
      errorMessage={overrides.errorMessage ?? null}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
}

describe("DeleteCarDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays the selected vehicle and deletion warning", () => {
    renderDialog();

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    expect(screen.getByText("Nissan Magnite")).toBeInTheDocument();

    expect(
      screen.getByText(/This action cannot be undone/i),
    ).toBeInTheDocument();
  });

  it("focuses the Cancel button when opened", () => {
    renderDialog();

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("allows the administrator to cancel deletion", async () => {
    const user = userEvent.setup();

    renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation before deletion", async () => {
    const user = userEvent.setup();

    renderDialog();

    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete Vehicle" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables actions while deletion is in progress", () => {
    renderDialog({ isDeleting: true });

    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    expect(screen.getByRole("button", { name: "Close dialog" })).toBeDisabled();
  });

  it("displays API errors without closing the dialog", () => {
    renderDialog({
      errorMessage: "Unable to delete vehicle. Please try again.",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to delete vehicle. Please try again.",
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    const user = userEvent.setup();

    renderDialog();

    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does not close with Escape during deletion", async () => {
    const user = userEvent.setup();

    renderDialog({ isDeleting: true });

    await user.keyboard("{Escape}");

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("keeps keyboard focus inside the dialog when tabbing forward", async () => {
    const user = userEvent.setup();

    renderDialog();

    const closeButton = screen.getByRole("button", {
      name: "Close dialog",
    });

    const deleteButton = screen.getByRole("button", {
      name: "Delete Vehicle",
    });

    deleteButton.focus();

    expect(deleteButton).toHaveFocus();

    await user.tab();

    expect(closeButton).toHaveFocus();
  });

  it("keeps keyboard focus inside the dialog when tabbing backward", async () => {
    const user = userEvent.setup();

    renderDialog();

    const closeButton = screen.getByRole("button", {
      name: "Close dialog",
    });

    const deleteButton = screen.getByRole("button", {
      name: "Delete Vehicle",
    });

    closeButton.focus();

    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });

    expect(deleteButton).toHaveFocus();
  });

  it("restores focus to the previous element when unmounted", () => {
    const previousButton = document.createElement("button");
    previousButton.textContent = "Open delete dialog";

    document.body.appendChild(previousButton);
    previousButton.focus();

    expect(previousButton).toHaveFocus();

    const { unmount } = renderDialog();

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    unmount();

    expect(previousButton).toHaveFocus();

    previousButton.remove();
  });
});
