import React from "react";
import { AlertOctagon, ShieldAlert } from "lucide-react";
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
    <div className="w-full my-4 rounded-[1.5rem] border-2 border-ink bg-destructive/10 p-5 shadow-brutal">
      <div className="flex items-start gap-3.5">
        <div className="rounded-xl border-2 border-ink bg-destructive p-2.5 text-white shadow-brutal-sm shrink-0">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-destructive text-white border border-ink shadow-xs">
              <ShieldAlert className="h-3.5 w-3.5" />
              Prescription Controlled {entity?.schedule ? `(${entity.schedule})` : "(Schedule H)"}
            </span>
            <span className="text-[11px] font-mono font-bold text-destructive">
              Fail-Closed Safety Guardrail
            </span>
          </div>

          {/* Mandated String Output Verbatim */}
          <div className="p-4 rounded-xl bg-cream border-2 border-ink shadow-brutal-sm">
            <p className="text-base sm:text-lg font-heading font-black text-destructive tracking-tight leading-snug">
              {promptText}
            </p>
          </div>

          <p className="text-xs text-ink/80 font-medium leading-relaxed">
            This medication is classified under Indian Schedule H / CDSCO pharmaceutical regulations. Dispensation without a valid prescription from a registered medical practitioner is strictly prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
