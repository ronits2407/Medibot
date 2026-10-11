import React from "react";
import { Sparkles, Check, Building2, TrendingDown, AlertTriangle } from "lucide-react";
import { SUBSTITUTION_ADVISORY } from "@/lib/constants";

interface AlternativeItem {
  id: string;
  name: string;
  brandName?: string;
  manufacturer: string;
  mrp: number;
  packSize: string;
  form: string;
  compositionHash: string;
  savingsPct: number;
  isGenericJanAushadhi: boolean;
  partnerPriceComparison?: Array<{
    platform: string;
    price_inr: number;
    delivery_eta: string;
    in_stock: boolean;
  }>;
}

interface AlternativesCardProps {
  data: {
    sourceMedicine: {
      name: string;
      mrp: number;
      schedule?: string;
    };
    alternatives: AlternativeItem[];
    advisory?: string;
  };
}

export function AlternativesCard({ data }: AlternativesCardProps) {
  if (!data || !data.alternatives || data.alternatives.length === 0) return null;

  const sourceMrp = data?.sourceMedicine?.mrp ?? (data as any)?.originalPrice ?? 0;

  return (
    <div className="w-full my-4 rounded-[1.5rem] border-2 border-ink bg-sand p-5 shadow-brutal">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2 border-b-2 border-ink pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full border-2 border-ink bg-sun flex items-center justify-center font-black text-ink shadow-brutal-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-heading text-lg font-black text-ink">
              Verified Equivalent Alternatives
            </h4>
            <p className="text-xs font-bold text-olive-deep flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> 100% Identical Active Composition
            </p>
          </div>
        </div>

        {sourceMrp > 0 && (
          <span className="text-xs font-bold text-muted-foreground bg-cream px-3 py-1 rounded-full border border-ink/30">
            Source MRP: <strong className="font-mono text-ink">₹{Number(sourceMrp).toFixed(2)}</strong>
          </span>
        )}
      </div>

      <div className="space-y-3">
        {data.alternatives.map((alt, idx) => {
          const itemMrp = alt.mrp ?? (alt as any).price ?? 0;
          return (
            <div
              key={alt.id || alt.name || idx}
              className="p-4 rounded-xl border-2 border-ink bg-cream shadow-brutal-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-ink/15 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-heading text-base font-extrabold text-ink">{alt.name}</h5>
                    {alt.isGenericJanAushadhi && (
                      <span className="rounded-full bg-olive px-2.5 py-0.5 text-[10px] font-black uppercase text-ink border border-ink">
                        Jan Aushadhi
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                    <Building2 className="h-3 w-3" /> {alt.manufacturer}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">MRP</span>
                    <span className="font-mono text-base font-black text-ink">₹{Number(itemMrp).toFixed(2)}</span>
                  </div>
                  <div className="rounded-xl border border-ink bg-sun px-3 py-1 text-center">
                    <span className="text-[10px] font-bold block uppercase text-ink">Save</span>
                    <span className="font-mono text-sm font-black text-ink">{alt.savingsPct}%</span>
                  </div>
                </div>
              </div>

            {/* Partner Quotes if available */}
            {alt.partnerPriceComparison && alt.partnerPriceComparison.length > 0 && (
              <div className="mt-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  {alt.partnerPriceComparison.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="rounded-lg border border-ink/20 bg-sand/50 p-2 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-ink">{q.platform}</span>
                      <span className="font-mono font-black text-ink">₹{q.price_inr.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )})}
      </div>

      {/* Required Advisory */}
      <div className="mt-4 rounded-xl border border-ink/20 bg-cream p-3 text-xs font-semibold text-ink/80 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-sun-deep shrink-0" />
        {data.advisory || SUBSTITUTION_ADVISORY}
      </div>
    </div>
  );
}
