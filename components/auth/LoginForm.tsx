"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";

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
    <div className="w-full max-w-[440px] rounded-[36px] bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/80 dark:border-slate-800 p-8 sm:p-10 shadow-2xl shadow-slate-300/40 dark:shadow-black/40 relative overflow-hidden text-slate-900 dark:text-white transition-all">
      {/* Subtle Ambient Radial Highlight inside card */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative mb-8 text-left">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Sign in
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">
          Choose an option below to continue to your dashboard.
        </p>
      </div>

      {/* The 2 options: Google Login & Demo Login */}
      <div className="space-y-3.5 relative">
        {/* Google Provider Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={isLoading}
          className="w-full py-4 px-5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50/90 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-800 dark:text-white transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-slate-300 active:scale-[0.99] disabled:opacity-60 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-600/50 flex items-center justify-center shrink-0 shadow-2xs">
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
              <span className="block text-sm font-bold leading-tight">Continue with Google</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Use your Google account</span>
            </div>
          </div>
          {loadingType === "google" ? (
            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
          ) : (
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
          )}
        </button>

        {/* 1-Click Demo Button */}
        <button
          type="button"
          onClick={handleDemoClick}
          disabled={isLoading}
          className="w-full py-4 px-5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/60 hover:bg-teal-100/80 dark:hover:bg-teal-900/60 border border-teal-200/90 dark:border-teal-800 flex items-center justify-between text-teal-950 dark:text-teal-100 transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-teal-300 active:scale-[0.99] disabled:opacity-60 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-teal-600/25">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-bold text-teal-900 dark:text-teal-200 leading-tight">Try Demo Mode</span>
              <span className="block text-xs text-teal-700/80 dark:text-teal-400 font-medium">Instant guest access</span>
            </div>
          </div>
          {loadingType === "demo" ? (
            <Loader2 className="h-5 w-5 animate-spin text-teal-600 dark:text-teal-400" />
          ) : (
            <ArrowRight className="h-4 w-4 text-teal-600/70 dark:text-teal-400 group-hover:text-teal-900 dark:group-hover:text-teal-200 group-hover:translate-x-0.5 transition-all" />
          )}
        </button>
      </div>
    </div>
  );
}
