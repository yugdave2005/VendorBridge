"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { Eye, EyeOff, UserPlus, Loader2 } from "lucide-react";

const VENDOR_CATEGORIES = [
  "IT Services",
  "Office Supplies",
  "Manufacturing",
  "Logistics",
  "Consulting",
  "Construction",
  "Healthcare",
  "Food & Beverages",
  "Electrical",
  "General",
];

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      companyName: "",
      category: "General",
    },
  });

  async function onSubmit(data: SignupInput) {
    setServerError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || "Registration failed");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">
          Create Account
        </h2>
        <p className="text-slate-400 text-sm">
          Register as a vendor to get started
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2"
            role="alert"
            aria-live="polite"
          >
            <svg
              className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-300 text-sm">{serverError}</p>
          </div>
        )}

        {/* Name */}
        <div>
          <label
            htmlFor="signup-name"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            aria-label="Full name"
            aria-invalid={!!errors.name}
            className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${
              errors.name ? "border-red-500/50" : "border-white/10"
            }`}
            placeholder="John Doe"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            aria-label="Email address"
            aria-invalid={!!errors.email}
            className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${
              errors.email ? "border-red-500/50" : "border-white/10"
            }`}
            placeholder="you@company.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1.5">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label
            htmlFor="signup-company"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Company Name
          </label>
          <input
            id="signup-company"
            type="text"
            aria-label="Company name"
            aria-invalid={!!errors.companyName}
            className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${
              errors.companyName ? "border-red-500/50" : "border-white/10"
            }`}
            placeholder="Acme Corp"
            {...register("companyName")}
          />
          {errors.companyName && (
            <p className="text-red-400 text-xs mt-1.5">
              {errors.companyName.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="signup-category"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Business Category
          </label>
          <select
            id="signup-category"
            aria-label="Business category"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
            {...register("category")}
          >
            {VENDOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-800">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-label="Password"
              aria-invalid={!!errors.password}
              className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all pr-12 ${
                errors.password ? "border-red-500/50" : "border-white/10"
              }`}
              placeholder="••••••••"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1.5">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="signup-confirm-password"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-label="Confirm password"
              aria-invalid={!!errors.confirmPassword}
              className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all pr-12 ${
                errors.confirmPassword ? "border-red-500/50" : "border-white/10"
              }`}
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1.5">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-label="Create account"
          id="signup-submit-btn"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium py-2.5 px-4 rounded-lg hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <UserPlus className="w-5 h-5" />
          )}
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-slate-400 text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
