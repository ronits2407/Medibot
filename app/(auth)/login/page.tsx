import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { MANDATORY_DISCLAIMER } from "@/lib/constants";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/chat");
  }

  async function handleGoogleSignIn() {
    "use server";
    await signIn("google", { redirectTo: "/chat" });
  }

  async function handleDemoSignIn(email?: string, name?: string) {
    "use server";
    await signIn("credentials", {
      email: email || "demo@medibot.local",
      name: name || "Dr. Demo (Verified Tester)",
      redirectTo: "/chat",
    });
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/40 flex flex-col justify-between selection:bg-teal-600 selection:text-white">
      {/* Light Fluid Ambient Color Clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-cyan-300/30 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-teal-300/25 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-sky-200/40 rounded-full blur-[150px]" />
        <div className="absolute -bottom-24 -left-20 w-[700px] h-[700px] bg-emerald-200/30 rounded-full blur-[160px]" />
        <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-teal-200/30 rounded-full blur-[140px]" />

        {/* Subtle delicate dot grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#0d948815_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      </div>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-8 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left Column: strictly Brand & Headline only */}
          <div className="flex-1 space-y-6 max-w-2xl text-left">
            {/* Brand Logo & Name (no link) */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30">
                <svg
                  className="h-5.5 w-5.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <span className="font-black text-3xl tracking-tight text-slate-900">
                Medi<span className="text-teal-600">Bot</span>
              </span>
            </div>

            {/* Every Medicine Tab Line */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08]">
              Every medicine price your family needs, <br />
              <span className="text-teal-600">
                in one place.
              </span>
            </h1>
          </div>

          {/* Right Column: Floating Glassmorphic Login Card */}
          <div className="w-full lg:w-auto flex justify-center lg:justify-end">
            <LoginForm
              onGoogleSignIn={handleGoogleSignIn}
              onDemoSignIn={handleDemoSignIn}
            />
          </div>
        </div>
      </main>

      {/* Persistent Compliance Notice Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-[11px] text-slate-500 border-t border-slate-200/80">
        <p className="leading-relaxed">
          <strong className="text-slate-600">Mandatory Notice:</strong> {MANDATORY_DISCLAIMER}
        </p>
      </footer>
    </div>
  );
}
