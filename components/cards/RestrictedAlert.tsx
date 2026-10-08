import React from "react";
import { AlertOctagon, ShieldAlert, FileText } from "lucide-react";
import { MANDATED_PRESCRIPTION_PROMPT } from "@/lib/constants";

interface RestrictedAlertProps {
  data: {
    mandatedPrompt?: string;
    triggeredBy?: string;
    entities?: Array<{
      mention?: string;
      name?: string;
      schedule?: string;
    }>;
  };
}

export function RestrictedAlert({ data }: RestrictedAlertProps) {
  const promptText = data?.mandatedPrompt || MANDATED_PRESCRIPTION_PROMPT;
  const entity = data?.entities?.[0];

  return (
    <div className="w-full my-4 rounded-2xl border-2 border-red-500/40 bg-red-50 dark:bg-red-950/40 p-5 shadow-lg shadow-red-500/10 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-start gap-3.5">
        <div className="rounded-xl bg-red-600 p-2.5 text-white shadow-md shadow-red-600/30">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
              <ShieldAlert className="h-3.5 w-3.5" />
              Prescription Controlled {entity?.schedule ? `(${entity.schedule})` : ""}
            </span>
            <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
              Fail-Closed Safety Gate
            </span>
          </div>

          {/* Mandated String Output Verbatim */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 shadow-sm">
            <p className="text-base font-extrabold text-red-700 dark:text-red-400 tracking-tight leading-snug">
              {promptText}
            </p>
          </div>

          <p className="text-xs text-red-900/80 dark:text-red-300/80 leading-relaxed">
            This medication is classified as a controlled drug under CDSCO rules. Dispensation without a doctor’s valid prescription is strictly prohibited. Price comparison and substitution recommendations are restricted for your safety.
          </p>
        </div>
      </div>
    </div>
  );
}
