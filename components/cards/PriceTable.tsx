"use client";

import React, { useState } from "react";
import { Store, Clock, ExternalLink, Zap } from "lucide-react";

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
    <div className="w-full my-4 rounded-[1.5rem] border-2 border-ink bg-cream p-5 shadow-brutal">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b-2 border-ink pb-3">
        <div>
          <h4 className="font-heading text-lg font-black text-ink flex items-center gap-2">
            <Store className="h-5 w-5" />
            Certified Pharmacy Price Comparison
          </h4>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Delivery to Pincode: <span className="font-mono text-ink font-bold">{data.pincode || "110001"}</span>
          </p>
        </div>

        <div className="flex items-center rounded-full border-2 border-ink bg-sand p-1 text-xs">
          <button
            onClick={() => setFilterMode("cheapest")}
            className={`px-3 py-1 rounded-full font-bold transition-all ${
              filterMode === "cheapest" ? "bg-sun text-ink shadow-brutal-sm" : "text-ink/70"
            }`}
          >
            Cheapest
          </button>
          <button
            onClick={() => setFilterMode("fastest")}
            className={`px-3 py-1 rounded-full font-bold transition-all ${
              filterMode === "fastest" ? "bg-sun text-ink shadow-brutal-sm" : "text-ink/70"
            }`}
          >
            Fastest
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {sortedPrices.map((item, idx) => {
          const isBestPrice = idx === 0 && filterMode === "cheapest";
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border-2 border-ink flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all ${
                isBestPrice ? "bg-sun/40 shadow-brutal-sm" : "bg-sand/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full border-2 border-ink bg-cream flex items-center justify-center font-bold text-xs text-ink shrink-0">
                  {item.pharmacyName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm font-black text-ink">{item.pharmacyName}</span>
                    {isBestPrice && (
                      <span className="rounded-full bg-sun px-2 py-0.5 text-[9px] font-black uppercase text-ink border border-ink">
                        Best Offer
                      </span>
                    )}
                    {item.inStock ? (
                      <span className="text-[10px] font-bold text-olive-deep">In Stock</span>
                    ) : (
                      <span className="text-[10px] font-bold text-destructive">Out of Stock</span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                    <Clock className="h-3 w-3" /> {item.etaText}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="font-mono text-base font-black text-ink">₹{item.price.toFixed(2)}</span>
                    {item.mrp > item.price && (
                      <span className="font-mono text-xs text-muted-foreground line-through">
                        ₹{item.mrp.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {item.savingsPct > 0 && (
                    <span className="text-[10px] font-bold text-olive-deep block">
                      Save {item.savingsPct}% vs MRP
                    </span>
                  )}
                </div>

                <a
                  href={item.baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-ink bg-cream px-3 py-1.5 text-xs font-bold text-ink hover:bg-ink hover:text-cream transition-colors flex items-center gap-1 shadow-xs"
                >
                  Visit <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
