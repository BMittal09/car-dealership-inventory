import { Link } from "react-router";

export default function HomePage() {
  return (
    <section className="py-20 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Find Your Next Car</h1>

      <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
        Explore our vehicle inventory and find the right car for you.
      </p>

      <Link
        to="/cars"
        className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
      >
        Browse Inventory
      </Link>
    </section>
  );
}
