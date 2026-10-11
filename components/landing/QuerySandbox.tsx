"use client";

import React, { useState } from "react";
import { ArrowRight, Sparkles, Store, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface PresetItem {
  id: string;
  name: string;
  schedule: string;
  isRestricted: boolean;
  therapeuticClass: string;
  composition: string;
  mrp: number;
  savingsPct: number;
  bestSubstitute: {
    name: string;
    manufacturer: string;
    mrp: number;
    bestPrice: number;
    platform: string;
    eta: string;
  };
  quotes: Array<{
    platform: string;
    price: number;
    eta: string;
  }>;
}

const PRESETS: PresetItem[] = [
  {
    id: "aug625",
    name: "Augmentin 625 Duo",
    schedule: "Schedule H",
    isRestricted: true,
    therapeuticClass: "Antibiotic",
    composition: "Amoxicillin 500mg + Clavulanic Acid 125mg",
    mrp: 223.50,
    savingsPct: 32.3,
    bestSubstitute: {
      name: "Moxikind-CV 625",
      manufacturer: "Mankind Pharma",
      mrp: 151.20,
      bestPrice: 136.08,
      platform: "Tata 1mg",
      eta: "Tomorrow",
    },
    quotes: [
      { platform: "Tata 1mg", price: 136.08, eta: "Tomorrow" },
      { platform: "PharmEasy", price: 139.50, eta: "24-48 hrs" },
      { platform: "Apollo 24|7", price: 142.00, eta: "2 Hours" },
      { platform: "Jan Aushadhi", price: 75.00, eta: "PMBJP Kendra" },
    ],
  },
  {
    id: "crocin650",
    name: "Crocin 650",
    schedule: "OTC",
    isRestricted: false,
    therapeuticClass: "Analgesic & Antipyretic",
    composition: "Paracetamol 650mg",
    mrp: 32.00,
    savingsPct: 68.8,
    bestSubstitute: {
      name: "Jan Aushadhi Paracetamol 650",
      manufacturer: "Govt PMBJP",
      mrp: 10.00,
      bestPrice: 10.00,
      platform: "PMBJP Kendra",
      eta: "Walk-in",
    },
    quotes: [
      { platform: "Jan Aushadhi", price: 10.00, eta: "Immediate" },
      { platform: "Pacimol (1mg)", price: 18.70, eta: "Tomorrow" },
      { platform: "PharmEasy", price: 19.14, eta: "Tomorrow" },
    ],
  },
  {
    id: "alprax05",
    name: "Alprazolam 0.5mg",
    schedule: "Schedule H1",
    isRestricted: true,
    therapeuticClass: "Anxiolytic",
    composition: "Alprazolam 0.5mg",
    mrp: 42.00,
    savingsPct: 16.7,
    bestSubstitute: {
      name: "Restyl 0.5",
      manufacturer: "Cipla Ltd",
      mrp: 35.00,
      bestPrice: 31.50,
      platform: "PharmEasy",
      eta: "Rx Upload Required",
    },
    quotes: [
      { platform: "PharmEasy", price: 31.50, eta: "Doctor Rx" },
      { platform: "Tata 1mg", price: 32.00, eta: "Doctor Rx" },
      { platform: "Apollo 24|7", price: 33.25, eta: "Doctor Rx" },
    ],
  },
  {
    id: "allegra120",
    name: "Allegra 120mg",
    schedule: "OTC",
    isRestricted: false,
    therapeuticClass: "Antihistamine",
    composition: "Fexofenadine 120mg",
    mrp: 225.00,
    savingsPct: 40.0,
    bestSubstitute: {
      name: "Fexova 120",
      manufacturer: "Ipca Laboratories",
      mrp: 135.00,
      bestPrice: 114.75,
      platform: "Tata 1mg",
      eta: "Tomorrow",
    },
    quotes: [
      { platform: "Tata 1mg", price: 114.75, eta: "Tomorrow" },
      { platform: "PharmEasy", price: 118.00, eta: "Tomorrow" },
      { platform: "Apollo 24|7", price: 122.50, eta: "2 Hours" },
    ],
  },
];

export function QuerySandbox() {
  const [selectedId, setSelectedId] = useState("aug625");
  const current = PRESETS.find((p) => p.id === selectedId) || PRESETS[0];

  return (
    <div className="w-full rounded-[2.5rem] border-[3px] border-ink bg-cream p-6 sm:p-8 shadow-[10px_10px_0_0_#17140f] text-ink">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-2 border-ink/20 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-sun px-3 py-1 font-mono text-xs font-bold text-ink">
            LIVE QUERY SANDBOX
          </span>
          <h2 className="mt-2 font-heading text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Try a real medicine query
          </h2>
          <p className="text-xs sm:text-sm text-ink/70 mt-0.5">
            Compare brand vs. generic salt prices across certified Indian pharmacies.
          </p>
        </div>

        <Link
          href="/chat"
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-cream hover:bg-black transition-all shadow-brutal-sm"
        >
          Open Chat <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Preset Pills */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/60 mr-1">
          Preset:
        </span>
        {PRESETS.map((preset) => {
          const active = preset.id === selectedId;
          return (
            <button
              key={preset.id}
              onClick={() => setSelectedId(preset.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all border-2 border-ink cursor-pointer ${
                active
                  ? "bg-ink text-cream shadow-[3px_3px_0_0_#17140f]"
                  : "bg-white text-ink hover:bg-sun"
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Bento */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* Left: Queried Drug Card */}
        <div className="flex flex-col justify-between rounded-3xl border-2 border-ink bg-white p-6 shadow-brutal-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/60">
                Searched Reference
              </span>
              <span className="rounded-full border border-ink bg-sand px-3 py-0.5 font-mono text-xs font-bold">
                {current.schedule}
              </span>
            </div>

            <h3 className="mt-3 font-heading text-2xl sm:text-3xl font-black text-ink">
              {current.name}
            </h3>
            <p className="text-xs font-medium text-ink/60 mt-0.5">
              {current.therapeuticClass}
            </p>

            <div className="mt-4 rounded-2xl border border-ink/20 bg-sand/50 p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase text-ink/60">
                Active Chemical Salt
              </p>
              <p className="font-mono text-xs font-bold text-ink mt-0.5">
                {current.composition}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-ink/15 flex items-end justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-ink/60 block">Brand MRP</span>
              <span className="font-heading text-3xl font-black text-ink">
                ₹{current.mrp.toFixed(2)}
              </span>
            </div>

            {current.isRestricted ? (
              <div className="text-right max-w-[200px]">
                <span className="rounded-full border border-ink bg-sand px-2.5 py-0.5 text-[10px] font-bold inline-block">
                  Prescription Mandated
                </span>
                <p className="text-[10px] text-ink/70 mt-1 italic leading-tight">
                  &ldquo;Requires valid prescription. Consult doctor.&rdquo;
                </p>
              </div>
            ) : (
              <span className="rounded-full border border-ink bg-olive/30 px-3 py-1 text-xs font-bold text-ink">
                OTC Approved
              </span>
            )}
          </div>
        </div>

        {/* Right: Verified Generic Equivalent & Savings */}
        <div className="flex flex-col justify-between rounded-3xl border-2 border-ink bg-sun p-6 shadow-brutal-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/75">
                100% Identical Generic
              </span>
              <span className="rounded-full border border-ink bg-ink px-3 py-0.5 font-mono text-xs font-bold text-cream">
                Save {current.savingsPct}%
              </span>
            </div>

            <h4 className="mt-3 font-heading text-2xl sm:text-3xl font-black text-ink">
              {current.bestSubstitute.name}
            </h4>
            <p className="text-xs font-bold text-ink/70 mt-0.5">
              by {current.bestSubstitute.manufacturer}
            </p>

            {/* Quick Pharmacy Quotes */}
            <div className="mt-4 space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/70">
                Live E-Pharmacy Quotes:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {current.quotes.slice(0, 4).map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-ink/20 bg-cream/80 p-2.5 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-ink block">{q.platform}</span>
                      <span className="text-[10px] text-ink/60">{q.eta}</span>
                    </div>
                    <span className="font-mono text-sm font-black text-ink">
                      ₹{q.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-ink/20 flex items-center justify-between text-xs font-bold">
            <span>Verified by Active Salt Hash</span>
            <span className="font-mono">Exact Milligram Match</span>
          </div>
        </div>
      </div>
    </div>
  );
}
