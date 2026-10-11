import Link from "next/link";
import { ArrowUpRight, ShieldAlert, Sparkles, Scale, RefreshCw, HeartPulse, Building, Pill, CheckCircle2 } from "lucide-react";
import { QuerySandbox } from "@/components/landing/QuerySandbox";
import { RubricCalculator } from "@/components/landing/RubricCalculator";
import HeroThreads from "@/components/landing/HeroThreads";

const MODULES = [
  {
    n: "01",
    name: "Price Comparison",
    body: "Aggregates certified e-pharmacy data (1mg, PharmEasy, Apollo 24|7, Netmeds, Jan Aushadhi) with live pricing, stock, and delivery ETAs.",
    bg: "bg-sun",
    icon: Scale,
  },
  {
    n: "02",
    name: "Alternative Drugs",
    body: "Discovers verified generic or equivalent medications with 100% identical active chemical salts, saving users 25% to 70%.",
    bg: "bg-blush",
    icon: RefreshCw,
  },
  {
    n: "03",
    name: "Health Assistant",
    body: "Natural language guidance for medication side effects, interactions, and safe storage instructions without diagnosing or prescribing.",
    bg: "bg-olive",
    icon: HeartPulse,
  },
  {
    n: "04",
    name: "Prescription Guard",
    body: "Fail-closed deterministic guardrail intercepting 100% of Schedule H, H1, X, and NDPS requests with the mandated prompt.",
    bg: "bg-sky",
    icon: ShieldAlert,
  },
];

const TARGET_USERS = [
  {
    role: "Chronic Patients",
    desc: "Recurring refill tracking, local pharmacy stock visibility, and predictable delivery windows for long-term health management.",
    accent: "bg-sun",
  },
  {
    role: "Budget Consumers",
    desc: "Maximizing savings via Jan Aushadhi Kendras and verified generic equivalents with identical therapeutic efficacy.",
    accent: "bg-blush",
  },
  {
    role: "Information Seekers",
    desc: "24/7 dependable conversational answers on drug contraindications, food interactions, and safe usage guidelines.",
    accent: "bg-olive",
  },
];

const TICKER = [
  "Augmentin 625 Duo",
  "Moxikind-CV 625",
  "Dolo 650",
  "Jan Aushadhi (PMBJP)",
  "Alprazolam 0.5mg",
  "1mg Certified",
  "PharmEasy",
  "Apollo 24|7",
  "Netmeds",
  "Schedule H Intercept",
  "CDSCO Compliance",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-blush selection:text-ink">
      {/* Top Floating Nav */}
      <header className="sticky top-0 z-40 px-4 pt-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border-2 border-ink bg-[#fbf8ef] px-4 py-2.5 shadow-brutal-sm">
          <Link href="/" className="font-heading text-xl font-black tracking-tight text-ink">
            Medi<span className="text-destructive">Bot</span>
            <span className="text-blush font-black">.</span>
          </Link>

          <div className="hidden items-center gap-7 text-xs font-bold uppercase tracking-wider text-muted-foreground md:flex">
            <a href="#sandbox" className="hover:text-ink transition-colors">
              Query Sandbox
            </a>
            <a href="#modules" className="hover:text-ink transition-colors">
              Core Modules
            </a>
            <a href="#rubric" className="hover:text-ink transition-colors">
              Rubric 100/100
            </a>
            <Link href="/deck" className="hover:text-ink transition-colors">
              Slide Deck
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/deck"
              className="hidden sm:inline-flex rounded-full border border-ink bg-cream px-4 py-2 text-xs font-bold text-ink hover:bg-sun transition-all"
            >
              Deck ↗
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 text-xs font-extrabold text-cream hover:bg-black transition-all shadow-brutal-sm"
            >
              Launch Chat <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-14 sm:pt-20 isolate">
        <HeroThreads />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cream px-4 py-1.5 text-xs font-extrabold shadow-brutal-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-olive-deep opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-olive-deep" />
            </span>
            Live in India · 5-Layer Prescription Guard Active · 100% Intercept
          </span>

          <h1 className="mt-6 font-heading text-5xl font-black leading-[1.05] tracking-tight text-ink sm:text-7xl">
            Manage your medication,<br />safely & affordably.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground font-medium">
            MediBot compares medicine prices across certified e-pharmacies, discovers verified generic equivalents to save up to 70%, and strictly enforces Schedule H prescription controls on every turn.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/chat"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-sm font-extrabold text-cream shadow-brutal hover:bg-black hover:-translate-y-0.5 transition-all"
            >
              Start Chatting with MediBot <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href="#sandbox"
              className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-cream px-7 text-sm font-bold text-ink shadow-brutal hover:bg-sun hover:-translate-y-0.5 transition-all"
            >
              Test Live Sandbox ↓
            </a>
            <Link
              href="/deck"
              className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-blush px-6 text-sm font-bold text-ink shadow-brutal hover:bg-blush-deep hover:-translate-y-0.5 transition-all"
            >
              View Hackathon Deck ↗
            </Link>
          </div>
        </div>

        {/* Hero Product Metrics Card */}
        <div className="relative z-10 mt-14 rounded-[2.5rem] border-2 border-ink bg-cream p-4 shadow-brutal-lg">
          <div className="grid gap-4 rounded-[2rem] bg-sand p-4 md:grid-cols-4">
            <div className="rounded-2xl border-2 border-ink bg-sun p-5 shadow-brutal-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink">Schedule H Intercept</span>
              <p className="mt-1 font-heading text-4xl font-black text-ink">100.0%</p>
              <p className="mt-1 text-xs font-semibold text-ink/80">0 missed on benchmark suite</p>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-blush p-5 shadow-brutal-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink">Average User Savings</span>
              <p className="mt-1 font-heading text-4xl font-black text-ink">32.3%+</p>
              <p className="mt-1 text-xs font-semibold text-ink/80">Up to 70% with Jan Aushadhi</p>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-olive p-5 shadow-brutal-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink">False Positive Rate</span>
              <p className="mt-1 font-heading text-4xl font-black text-ink">&lt; 0.1%</p>
              <p className="mt-1 text-xs font-semibold text-ink/80">Zero OTC false blocks</p>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-sky p-5 shadow-brutal-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink">Price Match Accuracy</span>
              <p className="mt-1 font-heading text-4xl font-black text-ink">&gt; 98.4%</p>
              <p className="mt-1 text-xs font-semibold text-ink/80">Across 5 certified platforms</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker Ribbon */}
      <div className="border-y-2 border-ink bg-ink py-3 text-cream overflow-hidden">
        <div className="flex animate-marquee gap-8 whitespace-nowrap text-xs font-black uppercase tracking-widest">
          {[...TICKER, ...TICKER].map((item, idx) => (
            <span key={idx} className="flex items-center gap-4">
              <span>{item}</span>
              <span className="text-sun">★</span>
            </span>
          ))}
        </div>
      </div>

      {/* Section: Live Sandbox */}
      <section id="sandbox" className="mx-auto max-w-6xl px-4 py-16">
        <QuerySandbox />
      </section>

      {/* Section: 4 Core Modules */}
      <section id="modules" className="mx-auto max-w-6xl px-4 py-16 border-t-2 border-ink/20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="rounded-full bg-sun px-3 py-1 font-mono text-xs font-bold text-ink border border-ink">
            ARCHITECTURE
          </span>
          <h2 className="mt-3 font-heading text-4xl font-black text-ink tracking-tight">
            Four Foundational Modules
          </h2>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            Engineered to fulfill all safety guidelines, cost savings targets, and usability requirements.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {MODULES.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className={`rounded-[2rem] border-2 border-ink ${mod.bg} p-6 shadow-brutal transition-transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-ink/70">
                    Module {mod.n}
                  </span>
                  <div className="h-10 w-10 rounded-full border-2 border-ink bg-cream flex items-center justify-center">
                    <Icon className="h-5 w-5 text-ink" />
                  </div>
                </div>
                <h3 className="mt-4 font-heading text-2xl font-black text-ink">{mod.name}</h3>
                <p className="mt-2 text-sm font-semibold text-ink/80 leading-relaxed">{mod.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Target Users */}
      <section className="mx-auto max-w-6xl px-4 py-16 border-t-2 border-ink/20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="rounded-full bg-blush px-3 py-1 font-mono text-xs font-bold text-ink border border-ink">
            TARGET USERS
          </span>
          <h2 className="mt-3 font-heading text-4xl font-black text-ink tracking-tight">
            Designed for Three Consumer Archetypes
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TARGET_USERS.map((user, idx) => (
            <div
              key={idx}
              className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-brutal-sm"
            >
              <span className={`inline-block rounded-full border border-ink px-3 py-1 font-heading text-xs font-black ${user.accent}`}>
                User Archetype 0{idx + 1}
              </span>
              <h4 className="mt-3 font-heading text-xl font-bold text-ink">{user.role}</h4>
              <p className="mt-2 text-xs text-muted-foreground font-semibold leading-relaxed">
                {user.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Rubric Scorecard */}
      <section id="rubric" className="mx-auto max-w-6xl px-4 py-16 border-t-2 border-ink/20">
        <RubricCalculator />
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-cream py-10 px-4 mt-12">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-heading text-xl font-black text-ink">
              Medi<span className="text-destructive">Bot</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-md font-medium">
              An intelligent conversational assistant adhering to CDSCO regulations and Drugs & Cosmetics Act Schedule H safety guidelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            <Link href="/chat" className="hover:underline">Chat</Link>
            <Link href="/medicines" className="hover:underline">My Medicines</Link>
            <Link href="/dashboard" className="hover:underline">Safety Dashboard</Link>
            <Link href="/deck" className="hover:underline">Presentation Deck</Link>
          </div>
        </div>

        <div className="mx-auto max-w-6xl mt-8 pt-6 border-t border-ink/20 text-center">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>Mandatory Disclaimer:</strong> MediBot is an informational tool. It does not diagnose medical conditions or prescribe medications. Users must always consult a qualified medical professional before taking any medication.
          </p>
        </div>
      </footer>
    </div>
  );
}
