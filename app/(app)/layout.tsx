import React from "react";
import Link from "next/link";
import { Pill, Shield, MessageSquare, LayoutDashboard } from "lucide-react";
import { DisclaimerFooter } from "@/components/disclaimer/DisclaimerFooter";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
        <Link href="/chat" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/30 group-hover:scale-105 transition-transform">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
              Medi<span className="text-teal-600 dark:text-teal-400">Bot</span>
            </span>
            <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              CDSCO Guarded
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MessageSquare className="h-4 w-4 text-teal-600" />
            Chat Assistant
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-teal-600" />
            Safety Dashboard
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {children}
      </main>

      {/* Persistent Disclaimer Compact Footer */}
      <DisclaimerFooter compact />
    </div>
  );
}
