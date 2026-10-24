import {
  ArrowUpRight,
  CalendarDays,
  CarFront,
  Fuel,
  Gauge,
  Package,
  Settings2,
} from "lucide-react";
import { Link } from "react-router";
import type { Car } from "../api/cars";

interface CarCardProps {
  car: Car;
}

const statusStyles: Record<Car["status"], string> = {
  available: "bg-emerald-50 text-emerald-700",
  reserved: "bg-amber-50 text-amber-700",
  sold: "bg-slate-100 text-slate-600",
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
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />

        <CarFront
          size={112}
          strokeWidth={1}
          aria-label="Vehicle illustration"
          className="relative text-slate-400"
        />

        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusStyles[car.status]}`}
        >
          {car.status}
        </span>

        {isOutOfStock && (
          <span className="absolute right-4 top-4 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
            Out of Stock
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              {car.make}
            </p>

            <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              {car.model}
            </h3>

            <p className="mt-2 text-xs font-medium capitalize text-slate-500">
              {car.category}
            </p>
          </div>

          <Link
            to={`/cars/${car.id}`}
            aria-label={`View ${car.make} ${car.model}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
          >
            <ArrowUpRight size={19} />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-5">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays size={16} className="text-slate-400" />
            {car.year}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Gauge size={16} className="text-slate-400" />
            {formatMileage(car.mileage)}
          </div>

          <div className="flex items-center gap-2 text-sm capitalize text-slate-600">
            <Fuel size={16} className="text-slate-400" />
            {car.fuel_type}
          </div>

          <div className="flex items-center gap-2 text-sm capitalize text-slate-600">
            <Settings2 size={16} className="text-slate-400" />
            {car.transmission}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Package size={17} className="text-slate-500" />

            <span className="text-sm font-medium text-slate-700">
              Stock Quantity
            </span>
          </div>

          <span
            className={`text-sm font-bold ${
              isOutOfStock ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {car.quantity}
          </span>
        </div>

        <p
          className={`mt-3 text-xs font-medium ${
            isPurchasable ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {isPurchasable
            ? "Available for purchase"
            : isOutOfStock
              ? "Currently out of stock"
              : "Not available for purchase"}
        </p>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Listed price</p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {formatPrice(car.price)}
            </p>
          </div>

          <Link
            to={`/cars/${car.id}`}
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
