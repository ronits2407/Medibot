"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { LoginPincodePrompt } from "@/components/location/LoginPincodePrompt";

interface LoginFormProps {
  onGoogleSignIn: () => Promise<void>;
  onDemoSignIn: (email?: string, name?: string) => Promise<void>;
}

export function LoginForm({ onGoogleSignIn, onDemoSignIn }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"google" | "demo" | null>(null);

  const handleGoogleClick = async () => {
    setIsLoading(true);
    setLoadingType("google");
    try {
      await onGoogleSignIn();
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleDemoClick = async () => {
    setIsLoading(true);
    setLoadingType("demo");
    try {
      await onDemoSignIn("demo@medibot.local", "Dr. Demo (Verified Tester)");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className="w-full max-w-[440px] rounded-3xl bg-[#fbf8ef] border-3 border-ink p-8 sm:p-10 shadow-[8px_8px_0_0_#17140f] relative overflow-hidden text-ink">
      {/* Header */}
      <div className="relative mb-8 text-left">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/60 bg-sand px-2.5 py-0.5 rounded-full border border-ink inline-block mb-2">
          Secure Access
        </span>
        <h2 className="text-3xl font-heading font-black tracking-tight text-ink">
          Sign In
        </h2>
        <p className="text-ink/70 text-sm mt-1.5 font-medium">
          Choose an option below to continue to your medicine dashboard.
        </p>
      </div>

      {/* The 2 options: Google Login & Demo Login */}
      <div className="space-y-3.5 relative">
        {/* Google Provider Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-2xl bg-cream hover:bg-sand border-2 border-ink flex items-center justify-between text-ink transition-all cursor-pointer shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-white border-2 border-ink flex items-center justify-center shrink-0 shadow-xs">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div className="text-left">
              <span className="block text-sm font-heading font-black leading-tight text-ink">Continue with Google</span>
              <span className="block text-xs text-ink/60 font-medium">Use your Google account</span>
            </div>
          </div>
          {loadingType === "google" ? (
            <Loader2 className="h-5 w-5 animate-spin text-ink" />
          ) : (
            <ArrowRight className="h-4 w-4 text-ink group-hover:translate-x-0.5 transition-all" />
          )}
        </button>

        {/* 1-Click Demo Button */}
        <button
          type="button"
          onClick={handleDemoClick}
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-2xl bg-sun hover:bg-sun-deep border-2 border-ink flex items-center justify-between text-ink transition-all cursor-pointer shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-cream shrink-0 border border-ink shadow-xs">
              <Sparkles className="h-4 w-4 text-sun" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-heading font-black text-ink leading-tight">Try Demo Mode</span>
              <span className="block text-xs text-ink/70 font-medium">Instant guest access</span>
            </div>
          </div>
          {loadingType === "demo" ? (
            <Loader2 className="h-5 w-5 animate-spin text-ink" />
          ) : (
            <ArrowRight className="h-4 w-4 text-ink group-hover:translate-x-0.5 transition-all" />
          )}
        </button>
      </div>

      {/* Auto Location / Delivery Pincode */}
      <LoginPincodePrompt />
    </div>
  );
}
