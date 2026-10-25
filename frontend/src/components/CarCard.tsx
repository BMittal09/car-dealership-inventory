import {
  ArrowUpRight,
  CalendarDays,
  Fuel,
  Gauge,
  Package,
  Settings2,
} from "lucide-react";
import { Link } from "react-router";
import type { Car } from "../api/cars";
import { getCarImage } from "../utils/carImages";

interface CarCardProps {
  car: Car;
}

const statusStyles: Record<Car["status"], string> = {
  available: "border-emerald-400/25 bg-emerald-500/15 text-emerald-300",
  reserved: "border-amber-400/25 bg-amber-500/15 text-amber-300",
  sold: "border-white/15 bg-white/10 text-slate-300",
};

function formatPrice(price: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

function formatMileage(mileage: number) {
  return `${new Intl.NumberFormat("en-IN").format(mileage)} km`;
}

export default function CarCard({ car }: CarCardProps) {
  const isOutOfStock = car.quantity === 0;
  const isPurchasable = car.status === "available" && car.quantity > 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#11151C] transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-black/30">
      {/* Vehicle photograph */}
      <div className="relative h-56 overflow-hidden bg-[#080B10]">
        <img
          src={getCarImage(car.category)}
          alt={`Representative ${car.category} vehicle photograph`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(event) => {
            const image = event.currentTarget;
            const fallback = "/images/default-car.jpg";

            if (!image.src.endsWith(fallback)) {
              image.src = fallback;
            }
          }}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080B10]/75 via-transparent to-black/20" />

        {/* Availability */}
        <span
          className={`absolute left-4 top-4 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize backdrop-blur-md ${statusStyles[car.status]}`}
        >
          {car.status}
        </span>

        {isOutOfStock && (
          <span className="absolute right-4 top-4 rounded-full border border-red-400/30 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 backdrop-blur-md">
            Out of Stock
          </span>
        )}

        {/* Representative photo disclosure */}
        <span className="absolute bottom-3 left-4 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
          Representative photo
        </span>

        <Link
          to={`/cars/${car.id}`}
          aria-label={`View ${car.make} ${car.model}`}
          className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-md transition hover:border-blue-500 hover:bg-blue-600"
        >
          <ArrowUpRight size={20} />
        </Link>
      </div>

      {/* Vehicle information */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              {car.make}
            </p>

            <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">
              {car.model}
            </h3>

            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              {car.category}
            </p>
          </div>

          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
            {car.year}
          </span>
        </div>

        {/* Specifications */}
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-4 border-y border-white/10 py-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <CalendarDays size={16} className="text-blue-400" />
            {car.year}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Gauge size={16} className="text-blue-400" />
            {formatMileage(car.mileage)}
          </div>

          <div className="flex items-center gap-2 text-sm capitalize text-slate-400">
            <Fuel size={16} className="text-blue-400" />
            {car.fuel_type}
          </div>

          <div className="flex items-center gap-2 text-sm capitalize text-slate-400">
            <Settings2 size={16} className="text-blue-400" />
            {car.transmission}
          </div>
        </div>

        {/* Inventory */}
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0B0F15] px-4 py-3">
          <div className="flex items-center gap-2">
            <Package size={17} className="text-slate-400" />

            <span className="text-sm font-medium text-slate-300">
              Stock Quantity
            </span>
          </div>

          <span
            className={`text-sm font-bold ${
              isOutOfStock ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {car.quantity}
          </span>
        </div>

        <p
          className={`mt-3 text-xs font-medium ${
            isPurchasable ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {isPurchasable
            ? "Available for purchase"
            : isOutOfStock
              ? "Currently out of stock"
              : "Not available for purchase"}
        </p>

        {/* Price and CTA */}
        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Listed price</p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-white">
              {formatPrice(car.price)}
            </p>
          </div>

          <Link
            to={`/cars/${car.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
          >
            View Details
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
