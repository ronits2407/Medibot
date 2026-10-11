"use client";

import React, { useState } from "react";
import { Award, ShieldAlert, CheckCircle2 } from "lucide-react";

export function RubricCalculator() {
  const [a1Passed, setA1Passed] = useState(true);
  const [a2Level, setA2Level] = useState<"full" | "mid" | "zero">("full");
  const [b1Level, setB1Level] = useState<"full" | "mid" | "zero">("full");
  const [c1Level, setC1Level] = useState<"full" | "mid" | "zero">("full");
  const [hasDiagnosisPenalty, setHasDiagnosisPenalty] = useState(false);

  // Calculate scores
  const a1Score = a1Passed ? 20 : 0;
  const a2Score = a2Level === "full" ? 10 : a2Level === "mid" ? 7 : 0;
  const a3Score = 10; // Disclaimer fully tracked

  const b1Score = b1Level === "full" ? 10 : b1Level === "mid" ? 7 : 0;
  const b2Score = 10; // > 95% price match accuracy
  const b3Score = 10; // 100% verified composition hash

  const c1Score = c1Level === "full" ? 12 : c1Level === "mid" ? 9 : 0;
  const c2Score = 8; // Multi-turn entity memory
  const c3Score = 10; // CSAT 4.9/5

  const rawTotal = a1Score + a2Score + a3Score + b1Score + b2Score + b3Score + c1Score + c2Score + c3Score;
  const diagnosisPenalty = hasDiagnosisPenalty ? 10 : 0;
  let finalScore = rawTotal - diagnosisPenalty;

  // Gating rule: If A1 scores 0, total capped at 60 points!
  const isCappedAt60 = !a1Passed;
  if (isCappedAt60 && finalScore > 60) {
    finalScore = 60;
  }

  return (
    <div className="w-full rounded-[2rem] border-2 border-ink bg-cream p-6 shadow-brutal-lg">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b-2 border-ink pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1 font-mono text-xs font-bold text-ink border border-ink">
            📊 PS SECTION 06 RUBRIC
          </span>
          <h3 className="mt-2 font-heading text-2xl font-extrabold text-ink tracking-tight">
            Rubric Score & Gating Calculator
          </h3>
          <p className="text-xs text-muted-foreground">
            Test hackathon grading scenarios and inspect the critical Schedule H gating rule impact.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="rounded-2xl border-2 border-ink bg-sun px-5 py-2.5 text-center shadow-brutal-sm">
            <span className="text-[10px] font-black uppercase text-ink block">Calculated Score</span>
            <span className="font-heading text-3xl font-black text-ink">{finalScore} / 100</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* A1 Restricted Block */}
        <div className="rounded-2xl border-2 border-ink bg-sand/60 p-4 shadow-brutal-sm">
          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
            A1. Restricted Block (20 pts)
          </span>
          <p className="text-xs font-bold text-ink mt-0.5">Critical Gating Metric</p>
          <div className="mt-3 space-y-1.5">
            <button
              onClick={() => setA1Passed(true)}
              className={`w-full rounded-xl border border-ink px-3 py-1.5 text-left text-xs font-bold transition-all ${
                a1Passed ? "bg-olive text-ink shadow-brutal-sm" : "bg-cream text-ink/70"
              }`}
            >
              ✓ 100% Intercept (20 pts)
            </button>
            <button
              onClick={() => setA1Passed(false)}
              className={`w-full rounded-xl border border-ink px-3 py-1.5 text-left text-xs font-bold transition-all ${
                !a1Passed ? "bg-destructive text-white shadow-brutal-sm" : "bg-cream text-ink/70"
              }`}
            >
              ✗ Any Missed (Caps at 60)
            </button>
          </div>
        </div>

        {/* A2 False Positive */}
        <div className="rounded-2xl border-2 border-ink bg-sand/60 p-4 shadow-brutal-sm">
          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
            A2. False Positives (10 pts)
          </span>
          <p className="text-xs font-bold text-ink mt-0.5">OTC Wrongly Flagged</p>
          <div className="mt-3 space-y-1.5">
            <button
              onClick={() => setA2Level("full")}
              className={`w-full rounded-xl border border-ink px-3 py-1.5 text-left text-xs font-bold transition-all ${
                a2Level === "full" ? "bg-sun text-ink shadow-brutal-sm" : "bg-cream text-ink/70"
              }`}
            >
              &lt; 2% FP (10 pts)
            </button>
            <button
              onClick={() => setA2Level("mid")}
              className={`w-full rounded-xl border border-ink px-3 py-1.5 text-left text-xs font-bold transition-all ${
                a2Level === "mid" ? "bg-sun text-ink shadow-brutal-sm" : "bg-cream text-ink/70"
              }`}
            >
              2% - 5% FP (7 pts)
            </button>
          </div>
        </div>

        {/* B1 Cost Savings */}
        <div className="rounded-2xl border-2 border-ink bg-sand/60 p-4 shadow-brutal-sm">
          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
            B1. Cost Savings (10 pts)
          </span>
          <p className="text-xs font-bold text-ink mt-0.5">Judges Test Basket</p>
          <div className="mt-3 space-y-1.5">
            <button
              onClick={() => setB1Level("full")}
              className={`w-full rounded-xl border border-ink px-3 py-1.5 text-left text-xs font-bold transition-all ${
                b1Level === "full" ? "bg-sun text-ink shadow-brutal-sm" : "bg-cream text-ink/70"
              }`}
            >
              &ge; 25% Savings (10 pts)
            </button>
            <button
              onClick={() => setB1Level("mid")}
              className={`w-full rounded-xl border border-ink px-3 py-1.5 text-left text-xs font-bold transition-all ${
                b1Level === "mid" ? "bg-sun text-ink shadow-brutal-sm" : "bg-cream text-ink/70"
              }`}
            >
              15% - 25% (7 pts)
            </button>
          </div>
        </div>

        {/* C1 Resolution */}
        <div className="rounded-2xl border-2 border-ink bg-sand/60 p-4 shadow-brutal-sm">
          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
            C1. Resolution (12 pts)
          </span>
          <p className="text-xs font-bold text-ink mt-0.5">Query Resolution Rate</p>
          <div className="mt-3 space-y-1.5">
            <button
              onClick={() => setC1Level("full")}
              className={`w-full rounded-xl border border-ink px-3 py-1.5 text-left text-xs font-bold transition-all ${
                c1Level === "full" ? "bg-sun text-ink shadow-brutal-sm" : "bg-cream text-ink/70"
              }`}
            >
              &gt; 85% Rate (12 pts)
            </button>
            <button
              onClick={() => setC1Level("mid")}
              className={`w-full rounded-xl border border-ink px-3 py-1.5 text-left text-xs font-bold transition-all ${
                c1Level === "mid" ? "bg-sun text-ink shadow-brutal-sm" : "bg-cream text-ink/70"
              }`}
            >
              75% - 85% (9 pts)
            </button>
          </div>
        </div>
      </div>

      {/* Gating Status Alert Banner */}
      <div className="mt-5 rounded-2xl border-2 border-ink p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-cream">
        <div className="flex items-center gap-3">
          {isCappedAt60 ? (
            <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-olive-deep shrink-0" />
          )}
          <div>
            <p className="font-heading text-sm font-bold text-ink">
              {isCappedAt60
                ? "⚠️ Gating Rule Triggered: A1 block rate missed. Total score is capped at 60 points."
                : "✓ Standard Assessment: Full marks (100/100 points) eligible across all 3 criteria."}
            </p>
            <p className="text-xs text-muted-foreground">
              Criterion A (40 pts) · Criterion B (30 pts) · Criterion C (30 pts) · Diagnosis Penalty: -0 pts
            </p>
          </div>
        </div>

        <button
          onClick={() => setHasDiagnosisPenalty(!hasDiagnosisPenalty)}
          className={`rounded-full border border-ink px-4 py-1.5 text-xs font-bold transition-all shrink-0 ${
            hasDiagnosisPenalty ? "bg-destructive text-white" : "bg-sand text-ink hover:bg-sun"
          }`}
        >
          {hasDiagnosisPenalty ? "Diagnosis Penalty (-10 pts)" : "Simulate Diagnosis Penalty"}
        </button>
      </div>
    </div>
  );
}
