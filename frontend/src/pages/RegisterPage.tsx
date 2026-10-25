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
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { register } from "../api/auth";

const inputStyles =
  "w-full rounded-xl border border-white/10 bg-[#0B0F15] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const registerMutation = useMutation({
    mutationFn: register,

    onSuccess: () => {
      void navigate("/login", {
        replace: true,
        state: {
          registrationSuccess: true,
        },
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || normalizedName.length > 100) {
      setValidationError("Name must contain between 1 and 100 characters.");
      return;
    }

    if (
      !normalizedEmail ||
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setValidationError("Enter a valid email address.");
      return;
    }

    if (password.length < 15 || password.length > 128) {
      setValidationError(
        "Password must contain between 15 and 128 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    registerMutation.mutate({
      name: normalizedName,
      email: normalizedEmail,
      password,
    });
  }

  const errorMessage =
    validationError ||
    (registerMutation.isError
      ? registerMutation.error instanceof Error
        ? registerMutation.error.message
        : "Unable to create your account. Please try again."
      : "");

  return (
    <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#11151C] shadow-2xl shadow-black/30 lg:grid-cols-2">
      {/* Automotive Visual Panel */}
      <div className="relative hidden min-h-[780px] flex-col justify-between overflow-hidden bg-[#050505] p-12 text-white lg:flex">
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
              Join the Collection
            </p>

            <h2 className="mt-6 text-5xl font-black uppercase leading-[1.05] tracking-[-0.055em]">
              Find your
              <br />
              next great
              <br />
              <span className="text-white/60">drive.</span>
            </h2>

            <p className="mt-7 max-w-sm text-sm leading-8 text-slate-300">
              Create your AutoVault account and explore vehicles that match your
              lifestyle, needs, and budget.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 border-t border-white/20 pt-7 text-sm text-slate-300">
          <ShieldCheck size={20} className="text-blue-400" />
          Secure account registration
        </div>
      </div>

      {/* Registration Form */}
      <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-14 lg:py-16">
        <div className="mb-9">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            Join AutoVault
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
            Create your account
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            Fill in your details to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label
              htmlFor="register-name"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              Full Name
            </label>

            <div className="relative">
              <UserRound
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your full name"
                className={inputStyles}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="register-email"
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
                id="register-email"
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
              htmlFor="register-password"
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
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={15}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 15 characters"
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

            <p className="mt-2 text-xs text-slate-500">
              Use a password between 15 and 128 characters.
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="register-confirm-password"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              Confirm Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="register-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                className={inputStyles}
              />
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
            disabled={registerMutation.isPending}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {registerMutation.isPending ? (
              "Creating account..."
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-400 transition hover:text-blue-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
