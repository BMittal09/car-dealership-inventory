import {
  ArrowUpRight,
  CalendarDays,
  Fuel,
  Gauge,
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
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />

        <span className="relative flex h-28 w-28 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-6xl shadow-sm">
          🚘
        </span>

        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusStyles[car.status]}`}
        >
          {car.status}
        </span>
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
