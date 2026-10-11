import React from "react";
import Link from "next/link";
import { MessageSquare, LayoutDashboard, HeartPulse, Settings, Presentation, LogOut } from "lucide-react";
import { DisclaimerFooter } from "@/components/disclaimer/DisclaimerFooter";
import { auth, signOut } from "@/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth().catch(() => null);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground relative selection:bg-blush selection:text-ink">
      {/* Sleek, Compact Top Navigation Bar */}
      <header className="h-12 sm:h-13 border-b-2 border-ink bg-[#fbf8ef]/95 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 z-20 shrink-0 relative">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-6 w-6 rounded-full border-2 border-ink bg-sun flex items-center justify-center font-black text-xs text-ink shadow-[2px_2px_0_0_#17140f] group-hover:bg-sun-deep transition-colors">
              +
            </div>
            <span className="font-heading font-black text-lg text-ink tracking-tight">
              Medi<span className="text-destructive">Bot</span>
              <span className="text-blush">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/chat"
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-ink/30 text-xs font-bold text-ink hover:bg-sun hover:border-ink transition-all shadow-xs"
            >
              <MessageSquare className="h-3 w-3" />
              Chat Assistant
            </Link>

            <Link
              href="/medicines"
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-ink/30 text-xs font-bold text-ink hover:bg-blush hover:border-ink transition-all shadow-xs"
            >
              <HeartPulse className="h-3 w-3" />
              My Refills
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-ink/30 text-xs font-bold text-ink hover:bg-olive hover:border-ink transition-all shadow-xs"
            >
              <LayoutDashboard className="h-3 w-3" />
              Safety Dashboard
            </Link>

            <Link
              href="/deck"
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-ink/30 text-xs font-bold text-ink hover:bg-sky hover:border-ink transition-all shadow-xs"
            >
              <Presentation className="h-3 w-3" />
              Deck ↗
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-ink/30 text-xs font-bold text-ink hover:bg-sand hover:border-ink transition-all shadow-xs"
            >
              <Settings className="h-3 w-3" />
              Settings
            </Link>
          </nav>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-ink transition-colors"
          >
            Landing
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 pl-1">
                <div className="h-6 w-6 rounded-full border-2 border-ink bg-sun flex items-center justify-center font-bold text-[10px] uppercase text-ink overflow-hidden shrink-0 shadow-brutal-sm">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User profile"}
                      className="h-full w-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{session.user.name?.[0] || session.user.email?.[0] || "U"}</span>
                  )}
                </div>
                <span className="hidden lg:inline text-xs font-bold text-ink">
                  {session.user.name || "Demo User"}
                </span>
              </div>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-full border border-ink/30 p-1 text-ink hover:bg-sand transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-ink bg-sun px-2 py-0.5 text-[10px] font-black uppercase text-ink shadow-[2px_2px_0_0_#17140f]">
                Demo Mode
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-background">
        {children}
      </main>

      {/* Mandatory Regulatory Disclaimer Footer (Hidden on /chat) */}
      <DisclaimerFooter />
    </div>
  );
}
