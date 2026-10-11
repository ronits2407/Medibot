import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { MANDATORY_DISCLAIMER } from "@/lib/constants";
import { LoginForm } from "@/components/auth/LoginForm";
import HeroThreads from "@/components/landing/HeroThreads";

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
    <div className="min-h-screen relative overflow-hidden bg-[#f5f0e1] flex flex-col justify-between text-ink selection:bg-sun selection:text-ink">
      {/* Neo-Brutalist subtle dot grid + dynamic hero threads */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <HeroThreads />
        <div className="absolute inset-0 bg-[radial-gradient(#17140f10_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      </div>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-8 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left Column: Brand & Headline */}
          <div className="flex-1 space-y-6 max-w-2xl text-left">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-sun border-2 border-ink flex items-center justify-center text-ink shadow-brutal-sm">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <span className="font-heading font-black text-3xl tracking-tight text-ink">
                Medi<span className="underline decoration-sun decoration-4 underline-offset-4">Bot</span>
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-black text-ink tracking-tight leading-[1.05]">
              Every medicine price your family needs, <br />
              <span className="bg-sun px-3 py-0.5 border-2 border-ink shadow-brutal-xs inline-block mt-2">
                in one place.
              </span>
            </h1>

            <p className="text-sm sm:text-base font-semibold text-ink/70 max-w-lg">
              Compare live rates across 1mg, Apollo, PharmEasy, and Jan Aushadhi. CDSCO Schedule H safety interception built-in.
            </p>
          </div>

          {/* Right Column: Floating Brutalist Login Card */}
          <div className="w-full lg:w-auto flex justify-center lg:justify-end">
            <LoginForm
              onGoogleSignIn={handleGoogleSignIn}
              onDemoSignIn={handleDemoSignIn}
            />
          </div>
        </div>
      </main>

      {/* Persistent Compliance Notice Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-[11px] text-ink/70 border-t-2 border-ink/20 font-mono">
        <p className="leading-relaxed">
          <strong className="text-ink font-bold">Mandatory CDSCO Notice:</strong> {MANDATORY_DISCLAIMER}
        </p>
      </footer>
    </div>
  );
}
