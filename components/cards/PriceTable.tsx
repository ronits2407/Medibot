import React, { useState } from "react";
import { Store, Clock, ExternalLink, Zap, TrendingDown } from "lucide-react";

interface PharmacyPriceItem {
  pharmacyName: string;
  baseUrl: string;
  certified: boolean;
  price: number;
  mrp: number;
  savingsPct: number;
  inStock: boolean;
  etaHours: number | null;
  etaText: string;
  source: string;
  fetchedAt: string;
}

interface PriceTableProps {
  data: {
    medicineName: string;
    mrp: number;
    pincode?: string;
    prices: PharmacyPriceItem[];
    cheapestPharmacy?: PharmacyPriceItem | null;
    disclaimer?: string;
  };
}

export function PriceTable({ data }: PriceTableProps) {
  const [filterMode, setFilterMode] = useState<"cheapest" | "fastest">("cheapest");

  if (!data || !data.prices || data.prices.length === 0) return null;

  const sortedPrices = [...data.prices].sort((a, b) => {
    if (filterMode === "fastest") {
      const aEta = a.etaHours ?? 999;
      const bEta = b.etaHours ?? 999;
      return aEta - bEta;
    }
    return a.price - b.price;
  });

  return (
    <div className="w-full my-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Header with Cheapest / Fastest Toggle */}
      <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Store className="h-4 w-4 text-teal-600" />
            Certified Pharmacy Price Comparison
          </h4>
          <p className="text-[11px] text-slate-500">
            Delivery to: <span className="font-semibold text-slate-700 dark:text-slate-300">{data.pincode || "National"}</span>
          </p>
        </div>

        <div className="flex items-center rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 text-xs">
          <button
            onClick={() => setFilterMode("cheapest")}
            className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
              filterMode === "cheapest"
                ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            Cheapest
          </button>
          <button
            onClick={() => setFilterMode("fastest")}
            className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
              filterMode === "fastest"
                ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Fastest
          </button>
        </div>
      </div>

      {/* Pharmacy Price Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {sortedPrices.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {item.pharmacyName}
                </span>
                {idx === 0 && filterMode === "cheapest" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                    Best Price
                  </span>
                )}
                {idx === 0 && filterMode === "fastest" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    Fastest SLA
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {item.etaText}
                </span>
                <span className={item.inStock ? "text-emerald-600 font-medium" : "text-red-500"}>
                  {item.inStock ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  ₹{item.price.toFixed(2)}
                </span>
                {item.savingsPct > 0 && (
                  <span className="text-xs text-slate-400 line-through">
                    ₹{item.mrp.toFixed(2)}
                  </span>
                )}
              </div>
              {item.savingsPct > 0 && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                  {item.savingsPct}% OFF
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Badge */}
      <div className="p-2.5 bg-slate-50/50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Verified partner pharmacies</span>
        <span>Demo data, updated recently</span>
      </div>
    </div>
  );
}
