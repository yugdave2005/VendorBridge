"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Invalid email or password. Please try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
        <p className="text-slate-400 text-sm">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            aria-label="Email address"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${
              errors.email ? "border-red-500/50" : "border-white/10"
            }`}
            placeholder="you@company.com"
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-red-400 text-xs mt-1.5">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-label="Password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
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
            <p id="password-error" className="text-red-400 text-xs mt-1.5">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-label="Sign in"
          id="login-submit-btn"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium py-2.5 px-4 rounded-lg hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Register Link */}
      <div className="mt-6 text-center">
        <p className="text-slate-400 text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Register as Vendor
          </Link>
        </p>
      </div>

      {/* Demo Credentials */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-slate-500 text-xs text-center mb-3">
          Demo Credentials
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { role: "Admin", email: "admin@vendorbridge.com" },
            { role: "Manager", email: "manager@vendorbridge.com" },
            { role: "Officer", email: "officer1@vendorbridge.com" },
            { role: "Vendor", email: "vendor1@vendorbridge.com" },
          ].map((demo) => (
            <button
              key={demo.role}
              type="button"
              onClick={() => {
                const emailInput = document.getElementById("login-email") as HTMLInputElement;
                const passwordInput = document.getElementById("login-password") as HTMLInputElement;
                if (emailInput && passwordInput) {
                  // Use native setter to trigger React's onChange
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, "value"
                  )?.set;
                  if (nativeInputValueSetter) {
                    nativeInputValueSetter.call(emailInput, demo.email);
                    emailInput.dispatchEvent(new Event("input", { bubbles: true }));
                    const pwd = demo.role === "Admin" ? "Admin@123" :
                      demo.role === "Manager" ? "Manager@123" :
                      demo.role === "Officer" ? "Officer@123" : "Vendor@123";
                    nativeInputValueSetter.call(passwordInput, pwd);
                    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
                  }
                }
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-slate-300 hover:text-white transition-all text-center"
              aria-label={`Auto-fill ${demo.role} credentials`}
            >
              {demo.role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
