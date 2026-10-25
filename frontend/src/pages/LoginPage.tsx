import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  CarFront,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { login } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

const inputStyles =
  "w-full rounded-xl border border-white/10 bg-[#0B0F15] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: saveSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await login(credentials);
      saveSession(result);
      return result;
    },

    onSuccess: (result) => {
      if (result.user.role === "admin") {
        void navigate("/admin", { replace: true });
      } else {
        void navigate("/cars", { replace: true });
      }
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setValidationError("Enter a valid email address.");
      return;
    }

    if (!password) {
      setValidationError("Enter your password.");
      return;
    }

    loginMutation.mutate({
      email: normalizedEmail,
      password,
    });
  }

  const errorMessage =
    validationError ||
    (loginMutation.isError
      ? loginMutation.error instanceof Error
        ? loginMutation.error.message
        : "Unable to log in. Please try again."
      : "");

  return (
    <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#11151C] shadow-2xl shadow-black/30 lg:min-h-[680px] lg:grid-cols-2">
      {/* Automotive Visual Panel */}
      <div className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden bg-[#050505] p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center brightness-90"
          style={{
            backgroundImage: "url('/images/hero-car.jpg')",
          }}
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/90"
        />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <CarFront size={26} />
            </div>

            <span className="text-2xl font-bold tracking-tight">
              Auto<span className="text-blue-400">Vault</span>
            </span>
          </Link>

          <div className="mt-24">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300">
              Welcome to AutoVault
            </p>

            <h2 className="mt-6 text-5xl font-black uppercase leading-[1.05] tracking-[-0.055em]">
              Your next
              <br />
              journey
              <br />
              <span className="text-white/60">starts here.</span>
            </h2>

            <p className="mt-7 max-w-sm text-sm leading-8 text-slate-300">
              Sign in to explore exceptional vehicles and discover a driving
              experience designed around you.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 border-t border-white/20 pt-7 text-sm text-slate-300">
          <ShieldCheck size={20} className="text-blue-400" />
          Secure account authentication
        </div>
      </div>

      {/* Login Form */}
      <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-14 lg:py-20">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            Welcome Back
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
            Sign in to AutoVault
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            Enter your account credentials to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={inputStyles}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className={`${inputStyles} pr-12`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {errorMessage}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loginMutation.isPending ? (
              "Signing in..."
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-400 transition hover:text-blue-300"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
