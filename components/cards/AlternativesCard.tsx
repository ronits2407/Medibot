import React from "react";
import { Sparkles, Check, ArrowRight, ShieldCheck, TrendingDown } from "lucide-react";
import { SUBSTITUTION_ADVISORY } from "@/lib/constants";

interface AlternativeItem {
  id: string;
  name: string;
  manufacturer: string;
  mrp: number;
  packSize: string;
  form: string;
  compositionHash: string;
  savingsPct: number;
  isGenericJanAushadhi: boolean;
}

interface AlternativesCardProps {
  data: {
    sourceMedicine: {
      name: string;
      mrp: number;
    };
    alternatives: AlternativeItem[];
    advisory?: string;
  };
}

export function AlternativesCard({ data }: AlternativesCardProps) {
  if (!data || !data.alternatives || data.alternatives.length === 0) return null;

  return (
    <div className="w-full my-3 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-gradient-to-b from-teal-50/40 via-white to-white dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Verified Generic Equivalents
            </h4>
            <p className="text-[11px] text-teal-700 dark:text-teal-400 font-medium flex items-center gap-1">
              <Check className="h-3 w-3" />
              100% Identical Active Salt Composition
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Source MRP: <strong className="text-slate-800 dark:text-slate-200">₹{data.sourceMedicine.mrp.toFixed(2)}</strong>
        </span>
      </div>

      <div className="space-y-2.5">
        {data.alternatives.map((alt) => (
          <div
            key={alt.id}
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between gap-3 shadow-xs hover:border-teal-300 dark:hover:border-teal-800 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {alt.name}
                </span>
                {alt.isGenericJanAushadhi && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Jan Aushadhi
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
                  {alt.form}
                </span>
              </div>
              <p className="text-xs text-slate-500">{alt.manufacturer}</p>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-base font-extrabold text-teal-700 dark:text-teal-400">
                  ₹{alt.mrp.toFixed(2)}
                </span>
                {alt.savingsPct > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    Save {alt.savingsPct}%
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block">{alt.packSize}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Mandatory Substitution Advisory */}
      <div className="mt-4 pt-3 border-t border-teal-100 dark:border-teal-900/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {data.advisory || SUBSTITUTION_ADVISORY}
        </p>
      </div>
    </div>
  );
}
