import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { MANDATORY_DISCLAIMER } from "@/lib/constants";
import { Pill, ShieldCheck, Sparkles, TrendingDown, Clock, Search } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/chat");
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center pt-8">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30">
            <Pill className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Medi<span className="text-teal-600 dark:text-teal-400">Bot</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Verified Pharmacy Intelligence & Safety</p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-2xl mb-10">
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-5xl">
            Smarter medicine prices. <br />
            <span className="text-teal-600 dark:text-teal-400">Deterministic prescription safety.</span>
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300 text-base leading-relaxed">
            Compare real-time prices across certified Indian pharmacies, uncover composition-identical generic equivalents, and consult medication details with fail-closed safety guards.
          </p>
        </div>

        {/* Auth Box */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/chat" });
            }}
            className="space-y-4"
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm hover:shadow active:scale-[0.99]"
            >
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
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Quick Features Highlight */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>Schedule H / Rx Guards</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-teal-600" />
              <span>Save 25-70% on Generics</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              <span>Pincode Delivery SLA</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-teal-600" />
              <span>Composition Hashes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Disclaimer Footer */}
      <div className="w-full max-w-4xl mx-auto mt-12 text-center text-xs text-slate-400 dark:text-slate-500 px-4">
        <p className="leading-relaxed">
          <strong>Mandatory Notice:</strong> {MANDATORY_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
