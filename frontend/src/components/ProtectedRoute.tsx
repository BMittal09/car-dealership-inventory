import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";
import { verifyAdminAccess } from "../api/auth";
import { ApiError } from "../api/cars";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, accessToken } = useAuth();
  const location = useLocation();

  const adminVerification = useQuery({
    queryKey: ["admin-verification", accessToken],
    queryFn: ({ signal }) => verifyAdminAccess(accessToken!, signal),
    enabled:
      requireAdmin &&
      isAuthenticated &&
      user?.role === "admin" &&
      Boolean(accessToken),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        return false;
      }

      return failureCount < 1;
    },
  });

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!requireAdmin) {
    return <Outlet />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/cars" replace />;
  }

  if (adminVerification.isPending || adminVerification.isFetching) {
    return (
      <div
        role="status"
        className="flex min-h-80 flex-col items-center justify-center gap-4"
      >
        <RefreshCw size={30} className="animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-600">
          Verifying administrator access...
        </p>
      </div>
    );
  }

  if (adminVerification.isError) {
    const error = adminVerification.error;

    if (error instanceof ApiError && error.status === 401) {
      return (
        <Navigate to="/login" replace state={{ from: location.pathname }} />
      );
    }

    if (error instanceof ApiError && error.status === 403) {
      return <Navigate to="/cars" replace />;
    }

    return (
      <div
        role="alert"
        className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white px-8 py-14 text-center"
      >
        <ShieldAlert size={42} className="mx-auto text-red-500" />

        <h1 className="mt-5 text-xl font-bold text-slate-950">
          Unable to verify access
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          We couldn't confirm your administrator permissions. Please check your
          connection and try again.
        </p>

        <button
          type="button"
          onClick={() => void adminVerification.refetch()}
          className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <Outlet />;
}
