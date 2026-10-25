import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  Gauge,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router";

const benefits = [
  {
    icon: ShieldCheck,
    number: "01",
    title: "Confidence in every choice.",
    description:
      "Explore detailed vehicle specifications and transparent listings to make informed decisions.",
  },
  {
    icon: SlidersHorizontal,
    number: "02",
    title: "Find your perfect match.",
    description:
      "Discover vehicles that suit your lifestyle with intuitive search and filtering.",
  },
  {
    icon: BadgeCheck,
    number: "03",
    title: "A seamless experience.",
    description:
      "From discovery to inventory availability, everything is designed around simplicity.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-24 pb-16 sm:space-y-32">
      {/* Cinematic Hero */}
      <section className="relative isolate min-h-[680px] overflow-hidden rounded-[1.75rem] bg-[#050505] text-white sm:min-h-[760px] lg:min-h-[790px]">
        {/* Hero Photograph */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-[position:45%_center] bg-no-repeat brightness-[1.35] sm:bg-center"
          style={{
            backgroundImage: "url('/images/hero-car.jpg')",
          }}
        />

        {/* Readability gradients */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/30 to-black/75"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-transparent"
        />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative flex min-h-[680px] flex-col justify-between px-7 py-9 sm:min-h-[760px] sm:px-12 sm:py-12 lg:min-h-[790px] lg:px-16">
          {/* Top Label */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_18px_rgba(59,130,246,0.8)]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/75 sm:text-xs">
                AutoVault / The Collection
              </span>
            </div>

            <span className="hidden text-xs font-medium uppercase tracking-[0.2em] text-white/50 sm:block">
              Drive beyond ordinary
            </span>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-4xl pb-10 pt-20 sm:pb-16">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-9 bg-blue-400" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
                Discover your next drive
              </p>
            </div>

            <h1 className="text-[clamp(3.4rem,8vw,7.5rem)] font-black uppercase leading-[0.93] tracking-[-0.065em] text-white">
              Not just
              <br />
              a car.
              <br />
              <span className="text-white/55">A statement.</span>
            </h1>

            <p className="mt-8 max-w-lg text-sm leading-7 text-white/75 sm:text-base sm:leading-8">
              Exceptional vehicles. Thoughtfully curated. Discover the
              collection and find a drive that reflects who you are.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/cars"
                className="group inline-flex items-center justify-center gap-4 rounded-full bg-blue-600 px-7 py-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-500 sm:px-9"
              >
                Explore Collection
                <ArrowUpRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-4 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:text-blue-300"
              >
                Join AutoVault
                <ChevronRight size={17} />
              </Link>
            </div>
          </div>

          {/* Hero Footer */}
          <div className="relative z-10 flex items-end justify-between gap-6 border-t border-white/20 pt-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
                The AutoVault Experience
              </p>

              <p className="mt-2 text-sm font-medium text-white/85">
                Your journey begins here.
              </p>
            </div>

            <a
              href="#discover"
              aria-label="Scroll to discover AutoVault"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-white hover:bg-white/10"
            >
              <ArrowDown size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section
        id="discover"
        className="grid scroll-mt-28 items-end gap-10 lg:grid-cols-[1fr_1.1fr]"
      >
        <div>
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
            <span className="h-px w-8 bg-blue-500" />
            The AutoVault Philosophy
          </p>

          <h2 className="mt-6 max-w-xl text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            The right car
            <br />
            changes
            <br />
            <span className="text-slate-400">everything.</span>
          </h2>
        </div>

        <div className="max-w-xl lg:pb-2">
          <p className="text-base leading-8 text-slate-400 sm:text-lg">
            Finding your next vehicle should feel exciting, not overwhelming.
            AutoVault brings together intuitive discovery, detailed
            specifications, and transparent inventory information in one
            thoughtfully designed experience.
          </p>

          <Link
            to="/cars"
            className="group mt-7 inline-flex items-center gap-3 text-sm font-bold text-white transition hover:text-blue-400"
          >
            Discover the Inventory
            <ArrowUpRight
              size={18}
              className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="space-y-9">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
              Why AutoVault
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Built around your journey.
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-7 text-slate-400">
            A better way to explore, compare, and discover vehicles.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map(({ icon: Icon, number, title, description }) => (
            <div
              key={number}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#11151C] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-[#151B25] hover:shadow-xl hover:shadow-black/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#090B0F] text-blue-400 transition-colors group-hover:border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white">
                  <Icon size={24} strokeWidth={1.6} />
                </div>

                <span className="text-sm font-semibold text-slate-500">
                  {number}
                </span>
              </div>

              <h3 className="mt-12 max-w-xs text-xl font-bold leading-snug tracking-tight text-white">
                {title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                {description}
              </p>

              <div className="mt-8 h-px w-full bg-white/10 transition-colors group-hover:bg-blue-500/30" />
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0B1124] px-8 py-14 text-white sm:px-14 sm:py-20 lg:px-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <Gauge size={18} className="text-blue-400" />

              <span className="text-xs font-bold uppercase tracking-[0.24em] text-blue-300">
                Your next chapter
              </span>
            </div>

            <h2 className="mt-7 text-4xl font-bold leading-[1.1] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Your next drive
              <br />
              starts here.
            </h2>

            <p className="mt-6 max-w-lg text-base leading-8 text-slate-400">
              Explore the collection, compare specifications, and discover the
              vehicle that feels right for you.
            </p>
          </div>

          <Link
            to="/cars"
            className="group inline-flex shrink-0 items-center justify-center gap-4 self-start rounded-full bg-blue-600 px-8 py-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-500 lg:self-auto"
          >
            Browse Vehicles
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="relative mt-16 flex flex-wrap items-center justify-between gap-5 border-t border-white/15 pt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
            AutoVault — Discover the Drive
          </p>

          <div className="flex items-center gap-2 text-xs font-medium text-white/50">
            <Search size={14} />
            Explore. Compare. Discover.
          </div>
        </div>
      </section>
    </div>
  );
}
