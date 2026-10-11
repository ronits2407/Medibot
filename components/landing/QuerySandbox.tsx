"use client";

import React, { useState } from "react";
import { ShieldAlert, CheckCircle2, TrendingDown, Clock, Building2, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PresetItem {
  id: string;
  name: string;
  badge: string;
  isRestricted: boolean;
  schedule: string;
  therapeuticClass: string;
  composition: string;
  mrp: number;
  savingsPct: number;
  substitutesCount: number;
  substitutes: Array<{
    name: string;
    manufacturer: string;
    compositionMatch: string;
    mrp: number;
    savingsPct: number;
    quotes: Array<{
      platform: string;
      price: number;
      eta: string;
    }>;
  }>;
}

const PRESETS: PresetItem[] = [
  {
    id: "aug625",
    name: "Augmentin 625 Duo",
    badge: "Schedule H",
    isRestricted: true,
    schedule: "Schedule H",
    therapeuticClass: "Antibiotic / Penicillin Combination",
    composition: "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
    mrp: 223.50,
    savingsPct: 32.3,
    substitutesCount: 2,
    substitutes: [
      {
        name: "Moxikind-CV 625",
        manufacturer: "Mankind Pharma Ltd",
        compositionMatch: "100% Identical Active",
        mrp: 151.20,
        savingsPct: 32.3,
        quotes: [
          { platform: "1mg", price: 136.08, eta: "Tomorrow by 2 PM" },
          { platform: "PharmEasy", price: 139.50, eta: "24-48 hrs" },
          { platform: "Apollo 24|7", price: 142.00, eta: "2 Hours (Express)" },
        ],
      },
      {
        name: "Clavam 625",
        manufacturer: "Alkem Laboratories Ltd",
        compositionMatch: "100% Identical Active",
        mrp: 168.00,
        savingsPct: 24.8,
        quotes: [
          { platform: "1mg", price: 149.00, eta: "Tomorrow" },
          { platform: "PharmEasy", price: 152.00, eta: "In 2 days" },
          { platform: "Netmeds", price: 150.50, eta: "Tomorrow" },
        ],
      },
    ],
  },
  {
    id: "crocin650",
    name: "Crocin 650",
    badge: "OTC Analgesic",
    isRestricted: false,
    schedule: "OTC",
    therapeuticClass: "Analgesic & Antipyretic",
    composition: "Paracetamol (650mg)",
    mrp: 32.00,
    savingsPct: 68.8,
    substitutesCount: 3,
    substitutes: [
      {
        name: "PMBJP Paracetamol 650",
        manufacturer: "Jan Aushadhi (PMBJP)",
        compositionMatch: "100% Identical Active Generic",
        mrp: 10.00,
        savingsPct: 68.8,
        quotes: [
          { platform: "Jan Aushadhi (PMBJP)", price: 10.00, eta: "Kendras Nationwide" },
        ],
      },
      {
        name: "Pacimol 650",
        manufacturer: "Ipca Laboratories Ltd",
        compositionMatch: "100% Identical Active",
        mrp: 22.00,
        savingsPct: 31.3,
        quotes: [
          { platform: "1mg", price: 18.70, eta: "Tomorrow" },
          { platform: "PharmEasy", price: 19.14, eta: "24-48 hrs" },
        ],
      },
    ],
  },
  {
    id: "alprax05",
    name: "Alprazolam 0.5mg",
    badge: "Restricted (Schedule H1)",
    isRestricted: true,
    schedule: "Schedule H1",
    therapeuticClass: "Benzodiazepine / Controlled Anxiolytic",
    composition: "Alprazolam (0.5mg)",
    mrp: 42.00,
    savingsPct: 16.7,
    substitutesCount: 1,
    substitutes: [
      {
        name: "Restyl 0.5",
        manufacturer: "Cipla Ltd",
        compositionMatch: "100% Identical Active",
        mrp: 35.00,
        savingsPct: 16.7,
        quotes: [
          { platform: "PharmEasy", price: 31.50, eta: "Rx Verification Required" },
          { platform: "1mg", price: 32.00, eta: "Doctor Rx Upload" },
        ],
      },
    ],
  },
  {
    id: "allegra120",
    name: "Allegra 120mg",
    badge: "Antihistamine (OTC)",
    isRestricted: false,
    schedule: "OTC",
    therapeuticClass: "Non-Sedating Antihistamine",
    composition: "Fexofenadine (120mg)",
    mrp: 225.00,
    savingsPct: 40.0,
    substitutesCount: 1,
    substitutes: [
      {
        name: "Fexova 120",
        manufacturer: "Ipca Laboratories Ltd",
        compositionMatch: "100% Identical Active",
        mrp: 135.00,
        savingsPct: 40.0,
        quotes: [
          { platform: "1mg", price: 114.75, eta: "Tomorrow by 2 PM" },
          { platform: "PharmEasy", price: 118.00, eta: "24-48 hrs" },
        ],
      },
    ],
  },
];

export function QuerySandbox() {
  const [selectedId, setSelectedId] = useState("aug625");
  const current = PRESETS.find((p) => p.id === selectedId) || PRESETS[0];

  return (
    <div className="w-full rounded-[2rem] border-2 border-ink bg-sand p-6 shadow-brutal-lg">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b-2 border-ink pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sun px-3 py-1 font-mono text-xs font-bold text-ink border border-ink">
            🛡️ PS 1.2 LIVE SANDBOX
          </span>
          <h2 className="mt-2 font-heading text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Interactive MediBot Query Sandbox
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Simulate bot queries, Schedule H interception, composition matching, and price comparisons.
          </p>
        </div>

        <Link
          href="/chat"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-cream hover:bg-black transition-colors shadow-brutal-sm"
        >
          Open Chat Assistant <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Preset Selector Chips */}
      <div className="mt-6">
        <label className="text-xs font-bold uppercase tracking-wider text-ink/70">
          Select Query Preset:
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const active = preset.id === selectedId;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedId(preset.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all border-2 border-ink ${
                  active
                    ? "bg-ink text-cream shadow-brutal-sm"
                    : "bg-cream text-ink hover:bg-sun"
                }`}
              >
                {preset.name}{" "}
                <span
                  className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] ${
                    preset.isRestricted
                      ? "bg-destructive text-white"
                      : "bg-olive text-ink"
                  }`}
                >
                  {preset.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Intercept Banner if Schedule H */}
      {current.isRestricted ? (
        <div className="mt-6 rounded-2xl border-2 border-destructive bg-destructive/10 p-4 text-ink flex items-start gap-3 shadow-brutal-sm">
          <ShieldAlert className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-destructive">
              ⚠️ Schedule H / Restricted Intercept
            </span>
            <p className="mt-1 font-heading text-base font-bold text-destructive">
              &quot;This medication requires a valid prescription. Please consult your doctor.&quot;
            </p>
            <p className="mt-1 text-xs text-ink/80">
              Mandatory CDSCO prompt enforced character-for-character. Self-medication is blocked.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border-2 border-olive bg-olive/20 p-4 text-ink flex items-start gap-3 shadow-brutal-sm">
          <CheckCircle2 className="h-6 w-6 text-olive-deep shrink-0 mt-0.5" />
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-olive-deep">
              ✓ OTC Verified Safe
            </span>
            <p className="mt-1 font-heading text-base font-bold text-ink">
              Over-The-Counter medication approved for direct price comparison and substitution.
            </p>
          </div>
        </div>
      )}

      {/* Target Drug Identification Card */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border-2 border-ink bg-cream p-5 shadow-brutal-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Identified Compound
            </span>
            <span className="rounded-full border border-ink bg-sun px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
              {current.schedule}
            </span>
          </div>
          <h3 className="mt-2 font-heading text-2xl font-black text-ink">{current.name}</h3>
          <p className="text-xs font-semibold text-muted-foreground">{current.therapeuticClass}</p>

          <div className="mt-4 rounded-xl border border-ink/20 bg-sand/60 p-3">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Active Composition</span>
            <p className="font-mono text-xs font-bold text-ink mt-0.5">{current.composition}</p>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-bold">
            <span className="text-muted-foreground">Base MRP:</span>
            <span className="font-mono text-base font-black text-ink">₹{current.mrp.toFixed(2)}</span>
          </div>
        </div>

        {/* Max Potential Savings Box */}
        <div className="rounded-2xl border-2 border-ink bg-sun p-5 shadow-brutal-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-ink">
              <TrendingDown className="h-4 w-4" /> Max Potential Savings
            </div>
            <p className="mt-3 font-heading text-5xl font-black text-ink">
              {current.savingsPct}%
            </p>
            <span className="mt-1 inline-block text-xs font-bold text-ink/80">
              {current.substitutesCount} Verified Alternative(s)
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-ink/20 bg-cream/70 p-3 text-[11px] font-semibold text-ink">
            Target savings exceeds Rubric B1 benchmark (&ge; 25% average cost savings per user).
          </div>
        </div>
      </div>

      {/* Suggested Equivalents */}
      <div className="mt-6">
        <h4 className="font-heading text-lg font-bold text-ink">
          Suggested Composition-Equivalent Alternatives
        </h4>
        <div className="mt-3 space-y-3">
          {current.substitutes.map((sub, idx) => (
            <div
              key={idx}
              className="rounded-2xl border-2 border-ink bg-cream p-4 shadow-brutal-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-ink/15 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-heading text-lg font-black text-ink">{sub.name}</h5>
                    <span className="rounded-full bg-olive px-2.5 py-0.5 text-[10px] font-bold text-ink border border-ink/40">
                      {sub.compositionMatch}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" /> {sub.manufacturer}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block font-bold">MRP</span>
                    <span className="font-mono text-base font-extrabold text-ink">₹{sub.mrp.toFixed(2)}</span>
                  </div>
                  <div className="rounded-xl border border-ink bg-blush px-3 py-1 text-center">
                    <span className="text-[10px] font-bold block uppercase">Savings</span>
                    <span className="font-mono text-sm font-black text-ink">{sub.savingsPct}%</span>
                  </div>
                </div>
              </div>

              {/* Partner Quotes */}
              <div className="mt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Partner Pharmacy Certified Quotes:
                </span>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {sub.quotes.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="rounded-xl border border-ink/20 bg-sand/60 p-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-ink block">{q.platform}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {q.eta}
                        </span>
                      </div>
                      <span className="font-mono font-black text-ink text-sm">
                        ₹{q.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-sand/40 px-3 py-1.5 text-[11px] text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-sun-deep shrink-0" />
                Active composition is verifiably identical. Please confirm any substitution with a doctor or pharmacist.
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
