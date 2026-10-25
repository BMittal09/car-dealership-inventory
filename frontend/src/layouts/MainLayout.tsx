import { useState } from "react";
import {
  ArrowRight,
  CarFront,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

const CURRENT_YEAR = new Date().getFullYear();

const navigation = [
  { label: "Home", path: "/" },
  { label: "Inventory", path: "/cars" },
];

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    logout();
    closeMobileMenu();
    void navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#090B0F] text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090B0F]/95 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          {/* Brand */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#05070C] text-white ring-1 ring-white/10">
              <CarFront size={25} strokeWidth={1.8} />
            </span>

            <span className="text-2xl font-bold tracking-tight text-white">
              Auto<span className="text-blue-500">Vault</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-10 md:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `relative flex h-20 items-center text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-blue-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-blue-500"
                      : "text-slate-400 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `relative flex h-20 items-center gap-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-blue-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-blue-500"
                      : "text-slate-400 hover:text-white"
                  }`
                }
              >
                <LayoutDashboard size={17} />
                Dashboard
              </NavLink>
            )}
          </div>

          {/* Desktop authentication */}
          <div className="hidden items-center gap-5 md:flex">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <UserRound size={18} className="text-blue-400" />
                  <span className="max-w-36 truncate">{user.name}</span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-300 transition hover:text-white"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Get Started
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="rounded-lg border border-white/10 p-2 text-white transition hover:bg-white/10 md:hidden"
          >
            {mobileMenuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </nav>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-white/10 bg-[#0D1016] px-5 py-5 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${
                      isActive
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <LayoutDashboard size={17} />
                  Admin Dashboard
                </NavLink>
              )}

              <div className="my-3 border-t border-white/10" />

              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-300">
                    <UserRound size={18} className="text-blue-400" />
                    {user.name}
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                  >
                    <LogOut size={17} />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5"
                  >
                    Log in
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 lg:px-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#07090D]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
            <div className="max-w-sm">
              <Link
                to="/"
                className="inline-flex items-center gap-3 text-xl font-bold tracking-tight"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <CarFront size={23} />
                </span>

                <span className="text-white">
                  Auto<span className="text-blue-500">Vault</span>
                </span>
              </Link>

              <p className="mt-5 text-sm leading-7 text-slate-400">
                Discover exceptional vehicles through a modern, seamless
                automotive experience.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-14 gap-y-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                  Explore
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    to="/"
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    Home
                  </Link>

                  <Link
                    to="/cars"
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    Inventory
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                  Account
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-left text-sm text-slate-400 transition hover:text-white"
                    >
                      Log out
                    </button>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="text-sm text-slate-400 transition hover:text-white"
                      >
                        Log in
                      </Link>

                      <Link
                        to="/register"
                        className="text-sm text-slate-400 transition hover:text-white"
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row">
            <p>© {CURRENT_YEAR} AutoVault. All rights reserved.</p>

            <p>Discover the drive.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
