"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  forgotPasswordSchema,
  verifyOtpSchema,
  type ForgotPasswordInput,
  type VerifyOtpInput,
} from "@/lib/validations/auth";
import { Mail, KeyRound, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [email, setEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: "", otp: "", newPassword: "" },
  });

  async function onRequestOtp(data: ForgotPasswordInput) {
    setServerError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || "Failed to send OTP");
        return;
      }

      setEmail(data.email);
      otpForm.setValue("email", data.email);
      if (result._devOtp) {
        setDevOtp(result._devOtp);
      }
      setStep("otp");
    } catch {
      setServerError("An unexpected error occurred.");
    }
  }

  async function onVerifyOtp(data: VerifyOtpInput) {
    setServerError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || "Failed to reset password");
        return;
      }

      setStep("success");
    } catch {
      setServerError("An unexpected error occurred.");
    }
  }

  if (step === "success") {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Password Reset Successful
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Your password has been reset. You can now sign in with your new
          password.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium py-2.5 px-4 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25"
          aria-label="Go to sign in"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8">
      <div className="mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-300 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
        <h2 className="text-xl font-semibold text-white mb-1">
          {step === "email" ? "Forgot Password" : "Enter OTP"}
        </h2>
        <p className="text-slate-400 text-sm">
          {step === "email"
            ? "Enter your email to receive a verification code"
            : `We sent a 6-digit code to ${email}`}
        </p>
      </div>

      {serverError && (
        <div
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 mb-4"
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

      {step === "email" ? (
        <form
          onSubmit={emailForm.handleSubmit(onRequestOtp)}
          className="space-y-5"
          noValidate
        >
          <div>
            <label
              htmlFor="forgot-email"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              aria-label="Email address"
              aria-invalid={!!emailForm.formState.errors.email}
              className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${
                emailForm.formState.errors.email
                  ? "border-red-500/50"
                  : "border-white/10"
              }`}
              placeholder="you@company.com"
              {...emailForm.register("email")}
            />
            {emailForm.formState.errors.email && (
              <p className="text-red-400 text-xs mt-1.5">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={emailForm.formState.isSubmitting}
            aria-label="Send OTP"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium py-2.5 px-4 rounded-lg hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
          >
            {emailForm.formState.isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mail className="w-5 h-5" />
            )}
            {emailForm.formState.isSubmitting ? "Sending..." : "Send OTP"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={otpForm.handleSubmit(onVerifyOtp)}
          className="space-y-5"
          noValidate
        >
          {devOtp && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-300 text-sm">
                <span className="font-medium">Dev Mode OTP:</span> {devOtp}
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="otp-code"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Verification Code
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              aria-label="6-digit OTP code"
              aria-invalid={!!otpForm.formState.errors.otp}
              className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${
                otpForm.formState.errors.otp
                  ? "border-red-500/50"
                  : "border-white/10"
              }`}
              placeholder="000000"
              {...otpForm.register("otp")}
            />
            {otpForm.formState.errors.otp && (
              <p className="text-red-400 text-xs mt-1.5">
                {otpForm.formState.errors.otp.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              aria-label="New password"
              aria-invalid={!!otpForm.formState.errors.newPassword}
              className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${
                otpForm.formState.errors.newPassword
                  ? "border-red-500/50"
                  : "border-white/10"
              }`}
              placeholder="••••••••"
              {...otpForm.register("newPassword")}
            />
            {otpForm.formState.errors.newPassword && (
              <p className="text-red-400 text-xs mt-1.5">
                {otpForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={otpForm.formState.isSubmitting}
            aria-label="Reset password"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium py-2.5 px-4 rounded-lg hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
          >
            {otpForm.formState.isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <KeyRound className="w-5 h-5" />
            )}
            {otpForm.formState.isSubmitting
              ? "Resetting..."
              : "Reset Password"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("email");
              setServerError(null);
            }}
            className="w-full text-slate-400 hover:text-slate-300 text-sm transition-colors py-2"
            aria-label="Use different email"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
