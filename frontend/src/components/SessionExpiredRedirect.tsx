import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";

export default function SessionExpiredRedirect() {
  const { logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <Navigate
      to="/login"
      replace
      state={{
        from: location.pathname,
        sessionExpired: true,
      }}
    />
  );
}
