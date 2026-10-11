"use client";

import React, { useState } from "react";
import { FileCheck, Sparkles, X } from "lucide-react";

export interface PrescriptionItem {
  rawText: string;
  drugName: string;
  strength?: string;
  form?: string;
  confidence: number;
}

interface PrescriptionReviewProps {
  items: PrescriptionItem[];
  onConfirm: (confirmedMeds: string[]) => void;
  onCancel: () => void;
}

export function PrescriptionReview({ items, onConfirm, onCancel }: PrescriptionReviewProps) {
  const [selectedMeds, setSelectedMeds] = useState<{ [index: number]: boolean }>(
    items.reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {})
  );
  const [editableNames, setEditableNames] = useState<{ [index: number]: string }>(
    items.reduce((acc, item, idx) => ({ ...acc, [idx]: item.drugName }), {})
  );

  const toggleSelect = (index: number) => {
    setSelectedMeds((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleNameChange = (index: number, val: string) => {
    setEditableNames((prev) => ({ ...prev, [index]: val }));
  };

  const handleConfirm = () => {
    const confirmed: string[] = [];
    items.forEach((_, idx) => {
      if (selectedMeds[idx]) {
        const name = editableNames[idx]?.trim();
        if (name) confirmed.push(name);
      }
    });
    if (confirmed.length > 0) {
      onConfirm(confirmed);
    }
  };

  return (
    <div className="rounded-3xl bg-[#fbf8ef] border-3 border-ink p-6 shadow-[8px_8px_0_0_#17140f] space-y-5 text-ink animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-sun border-2 border-ink text-ink flex items-center justify-center shadow-xs">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-heading font-black text-ink">
              Prescription Extracted Review
            </h3>
            <p className="text-xs text-ink/70 font-medium">
              Review and confirm identified medications before querying pricing & safety guards.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-sand border border-ink text-ink">
          {items.length} items found
        </span>
      </div>

      {/* List of items */}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const isChecked = !!selectedMeds[idx];
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3.5 ${
                isChecked
                  ? "bg-cream border-ink shadow-xs"
                  : "bg-sand/30 border-ink/40 opacity-60"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleSelect(idx)}
                className="h-4 w-4 rounded accent-ink border-2 border-ink cursor-pointer"
              />

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editableNames[idx] ?? item.drugName}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    className="font-heading font-black text-xs text-ink bg-transparent border-b-2 border-ink focus:outline-none py-0.5 px-1 w-full max-w-xs"
                  />
                  {item.strength && (
                    <span className="text-[11px] font-mono font-bold text-ink/80">
                      {item.strength}
                    </span>
                  )}
                  {item.form && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sand border border-ink font-mono font-bold text-ink">
                      {item.form}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-ink/60 font-mono">
                  <span>Snippet: "{item.rawText}"</span>
                  <span>•</span>
                  <span>Confidence: {Math.round(item.confidence * 100)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <p className="text-[11px] text-ink/60 font-mono italic">
        * Prescription image is processed strictly in memory and discarded immediately. No diagnosis or dispensing will occur.
      </p>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-bold text-ink bg-sand hover:bg-cream border border-ink shadow-xs transition-colors cursor-pointer"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-sun hover:bg-sun-deep text-ink border-2 border-ink shadow-brutal-sm transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Confirm & Compare Selected</span>
        </button>
      </div>
    </div>
  );
}
