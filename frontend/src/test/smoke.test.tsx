import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

function TestComponent() {
  return (
    <div>
      <h1>AutoVault Testing Ready</h1>
      <p>React component testing is configured.</p>
    </div>
  );
}

describe("Frontend test environment", () => {
  it("renders a React component successfully", () => {
    render(<TestComponent />);

    expect(
      screen.getByRole("heading", {
        name: "AutoVault Testing Ready",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("React component testing is configured."),
    ).toBeInTheDocument();
  });
});
