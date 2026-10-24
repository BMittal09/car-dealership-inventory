import { useState } from "react";
import { ArrowRight, CarFront, Menu, X } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";

const CURRENT_YEAR = new Date().getFullYear();

const navigation = [
  { label: "Home", path: "/" },
  { label: "Inventory", path: "/cars" },
];

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-lg">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
              <CarFront size={25} strokeWidth={1.8} />
            </span>

            <span className="text-2xl font-bold tracking-tight">
              Auto<span className="text-blue-600">Vault</span>
            </span>
          </Link>

          <div className="hidden items-center gap-9 md:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-600 hover:text-slate-950"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-5 md:flex">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 transition-colors hover:text-blue-600"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="rounded-lg p-2 text-slate-900 hover:bg-slate-100 md:hidden"
          >
            {mobileMenuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-slate-200 bg-white px-5 py-5 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-3 text-sm font-semibold ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-700 hover:bg-slate-50"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              <div className="my-2 border-t border-slate-100" />

              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Log in
              </Link>

              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="rounded-lg bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 lg:px-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-7 text-center sm:flex-row sm:px-8 sm:text-left lg:px-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <CarFront size={21} className="text-blue-600" />
            AutoVault
          </Link>

          <p className="text-sm text-slate-500">
            © {CURRENT_YEAR} AutoVault. All rights reserved.
          </p>

          <Link
            to="/cars"
            className="text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            Browse Inventory
          </Link>
        </div>
      </footer>
    </div>
  );
}
