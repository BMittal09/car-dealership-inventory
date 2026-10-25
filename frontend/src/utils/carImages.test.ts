import { describe, expect, it } from "vitest";
import { getCarImage } from "./carImages";

describe("getCarImage", () => {
  it.each([
    ["sedan", "/images/sedan.jpg"],
    ["suv", "/images/suv.jpg"],
    ["hatchback", "/images/hatchback.jpg"],
    ["coupe", "/images/coupe.jpg"],
    ["convertible", "/images/convertible.jpg"],
    ["pickup", "/images/pickup.jpg"],
    ["van", "/images/van.jpg"],
    ["other", "/images/default-car.jpg"],
  ])("returns the correct image for %s", (category, expected) => {
    expect(getCarImage(category)).toBe(expected);
  });

  it("normalizes category capitalization and whitespace", () => {
    expect(getCarImage("  SUV  ")).toBe("/images/suv.jpg");
  });

  it("returns the fallback for unknown categories", () => {
    expect(getCarImage("unknown")).toBe("/images/default-car.jpg");
  });

  it("returns the fallback for missing categories", () => {
    expect(getCarImage(null)).toBe("/images/default-car.jpg");
    expect(getCarImage(undefined)).toBe("/images/default-car.jpg");
    expect(getCarImage("")).toBe("/images/default-car.jpg");
  });
});
