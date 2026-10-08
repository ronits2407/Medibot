import { MANDATORY_DISCLAIMER } from "@/lib/constants";
import { Info } from "lucide-react";

export function DisclaimerFooter({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] text-slate-500 dark:text-slate-400 text-center select-none">
        <Info className="h-3 w-3 flex-shrink-0 text-slate-400" />
        <span>MediBot is an informational tool only. Not medical advice. Always consult a licensed doctor.</span>
      </div>
    );
  }

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-4xl mx-auto flex items-start gap-2.5">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <p className="leading-relaxed">
          <strong className="text-slate-700 dark:text-slate-300">Mandatory Medical Disclaimer:</strong>{" "}
          {MANDATORY_DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}
