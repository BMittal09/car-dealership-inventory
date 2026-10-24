import { Link, NavLink, Outlet } from "react-router";

const CURRENT_YEAR = new Date().getFullYear();

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-xl font-bold tracking-tight">
            AutoVault
          </Link>

          <div className="flex items-center gap-6">
            <NavLink to="/" end className="hover:text-blue-600">
              Home
            </NavLink>

            <NavLink to="/cars" className="hover:text-blue-600">
              Inventory
            </NavLink>

            <NavLink to="/login" className="hover:text-blue-600">
              Login
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="mx-auto min-h-[75vh] max-w-7xl px-6 py-12">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © {CURRENT_YEAR} AutoVault. All rights reserved.
      </footer>
    </div>
  );
}
