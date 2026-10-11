import React from "react";
import { Building2, Layers } from "lucide-react";

interface MedicineCardProps {
  data: {
    name: string;
    manufacturer: string;
    mrp: number;
    packSize: string;
    form: string;
    composition?: Array<{
      salt: string;
      strength?: number | null;
      unit?: string | null;
    }>;
    schedule?: string;
    isGenericJanAushadhi?: boolean;
    uses?: string;
    howToUse?: string;
  };
}

export function MedicineCard({ data }: MedicineCardProps) {
  if (!data) return null;

  return (
    <div className="w-full my-4 rounded-[1.5rem] border-2 border-ink bg-cream p-5 shadow-brutal">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading text-xl font-black text-ink">
              {data.name}
            </h3>
            {data.isGenericJanAushadhi && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-olive text-ink border border-ink">
                Jan Aushadhi Generic
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sand text-ink border border-ink/40">
              {data.form || "Medicine"}
            </span>
            {data.schedule && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-ink ${
                data.schedule === "OTC" ? "bg-olive text-ink" : "bg-destructive text-white"
              }`}>
                {data.schedule}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Building2 className="h-3.5 w-3.5" />
            {data.manufacturer}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">MRP</span>
          <span className="font-mono text-2xl font-black text-ink">
            ₹{data.mrp.toFixed(2)}
          </span>
          <span className="text-[10px] text-muted-foreground block font-medium">{data.packSize}</span>
        </div>
      </div>

      {data.composition && data.composition.length > 0 && (
        <div className="mt-4 pt-3 border-t border-ink/20">
          <span className="text-xs font-bold text-ink flex items-center gap-1.5 mb-2">
            <Layers className="h-3.5 w-3.5" />
            Active Chemical Formulation:
          </span>
          <div className="flex flex-wrap gap-2">
            {data.composition.map((c, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-sand border border-ink/30 font-mono text-xs font-bold text-ink"
              >
                <span>{c.salt}</span>
                {c.strength && (
                  <span className="text-muted-foreground">
                    ({c.strength}
                    {c.unit})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.uses && (
        <div className="mt-3 text-xs text-ink/80 font-medium">
          <strong>Indications:</strong> {data.uses}
        </div>
      )}
    </div>
  );
}
