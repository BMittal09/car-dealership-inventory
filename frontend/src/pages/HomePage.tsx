import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  ChevronRight,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Quality First",
    description:
      "Explore vehicle listings with clear specifications and transparent information.",
  },
  {
    icon: SlidersHorizontal,
    title: "Find Your Fit",
    description:
      "Filter by price, manufacturer, fuel type, and transmission to narrow your search.",
  },
  {
    icon: BadgeCheck,
    title: "Simple Experience",
    description:
      "Compare vehicle details and discover the right option for your needs.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-24 pb-12">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_25%,rgba(37,99,235,0.32),transparent_50%)]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-20 h-96 w-96 rounded-full border border-white/10"
        />

        <div className="relative grid min-h-[560px] items-center gap-12 px-8 py-16 sm:px-14 lg:grid-cols-2 lg:px-20 lg:py-24">
          <div className="max-w-xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              <CarFront size={15} />
              Your next drive starts here
            </div>

            <h1 className="text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-[4.5rem]">
              Find the car
              <br />
              that moves
              <br />
              <span className="text-blue-400">you forward.</span>
            </h1>

            <p className="mt-7 max-w-lg text-base leading-8 text-slate-300 sm:text-lg">
              Discover vehicles, explore detailed specifications, and find the
              perfect match for your lifestyle and budget.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/cars"
                className="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-7 py-4 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Explore Inventory
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Get Started
                <ChevronRight size={17} />
              </Link>
            </div>
          </div>

          <div className="relative flex min-h-64 items-center justify-center lg:min-h-96">
            <div className="absolute h-64 w-64 rounded-full bg-blue-600/20 blur-3xl sm:h-80 sm:w-80" />

            <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm sm:p-12">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                  AutoVault
                </span>
                <span className="h-2 w-2 rounded-full bg-blue-400" />
              </div>

              <CarFront
                aria-hidden="true"
                className="mx-auto my-10 h-36 w-36 text-blue-300 sm:h-44 sm:w-44"
                strokeWidth={0.8}
              />

              <div className="border-t border-white/10 pt-6">
                <p className="text-xl font-semibold">
                  Your journey. Your choice.
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Explore the possibilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Discover AutoVault
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              A better way to find your car.
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              Everything you need to explore vehicle inventory in one
              straightforward experience.
            </p>
          </div>

          <Link
            to="/cars"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View all vehicles
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-8 transition hover:border-blue-200 hover:shadow-lg"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon size={24} strokeWidth={1.8} />
              </div>

              <h3 className="text-lg font-bold text-slate-950">{title}</h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-blue-50 px-8 py-12 sm:px-14 sm:py-16">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Search size={18} />
              Find your next vehicle
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Ready to explore the inventory?
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Browse available listings, compare specifications, and narrow your
              options using powerful search filters.
            </p>
          </div>

          <Link
            to="/cars"
            className="inline-flex shrink-0 items-center gap-3 rounded-xl bg-slate-950 px-7 py-4 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            Browse Vehicles
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
