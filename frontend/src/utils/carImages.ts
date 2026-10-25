const categoryImages: Record<string, string> = {
  sedan: "/images/sedan.jpg",
  suv: "/images/suv.jpg",
  hatchback: "/images/hatchback.jpg",
  coupe: "/images/coupe.jpg",
  convertible: "/images/convertible.jpg",
  pickup: "/images/pickup.jpg",
  van: "/images/van.jpg",
  other: "/images/default-car.jpg",
};

const DEFAULT_IMAGE = "/images/default-car.jpg";

export function getCarImage(category: string | null | undefined): string {
  if (!category) {
    return DEFAULT_IMAGE;
  }

  const normalizedCategory = category.trim().toLowerCase();

  return categoryImages[normalizedCategory] ?? DEFAULT_IMAGE;
}
