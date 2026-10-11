"use client";

import { usePathname } from "next/navigation";
import { MANDATORY_DISCLAIMER } from "@/lib/constants";
import { Info } from "lucide-react";

export function DisclaimerFooter({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  // On chat page or presentation deck, suppress the bottom footer bar to keep chat area spacious
  if (pathname === "/chat" || pathname?.startsWith("/deck")) {
    return null;
  }

  return (
    <footer className="w-full border-t border-ink/15 bg-[#fbf8ef]/90 py-1.5 px-4 text-[11px] text-ink/65 shrink-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 text-center">
        <Info className="h-3 w-3 text-ink/60 shrink-0" />
        <p className="truncate font-medium">
          <span className="font-bold text-ink">Notice:</span> {MANDATORY_DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}
