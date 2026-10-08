import React from "react";
import { Pill, Building2, Layers, CheckCircle2 } from "lucide-react";

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
  };
}

export function MedicineCard({ data }: MedicineCardProps) {
  if (!data) return null;

  return (
    <div className="w-full my-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {data.name}
            </h3>
            {data.isGenericJanAushadhi && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Jan Aushadhi Generic
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
              {data.form || "Medicine"}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            {data.manufacturer}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block">MRP</span>
          <span className="text-xl font-extrabold text-teal-600 dark:text-teal-400">
            ₹{data.mrp.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block">{data.packSize}</span>
        </div>
      </div>

      {data.composition && data.composition.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
            <Layers className="h-3.5 w-3.5 text-teal-600" />
            Active Pharmaceutical Composition
          </span>
          <div className="flex flex-wrap gap-1.5">
            {data.composition.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {c.salt} {c.strength ? `(${c.strength}${c.unit || ""})` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
