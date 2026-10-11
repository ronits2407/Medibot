"use client";

import React, { useState } from "react";
import { FileCheck, ShieldCheck, Check, Trash2, ArrowRight, Sparkles } from "lucide-react";

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
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/60 p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Prescription Extracted Review
            </h3>
            <p className="text-xs text-slate-500">
              Review and confirm identified medications before querying pricing & safety guards.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
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
              className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                isChecked
                  ? "bg-slate-50 dark:bg-slate-850 border-teal-300 dark:border-teal-800"
                  : "bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleSelect(idx)}
                className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editableNames[idx] ?? item.drugName}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-hidden focus:border-teal-500 py-0.5 px-1 w-full max-w-xs"
                  />
                  {item.strength && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      {item.strength}
                    </span>
                  )}
                  {item.form && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {item.form}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400">
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
      <p className="text-[11px] text-slate-400 italic">
        * Prescription image is processed strictly in memory and discarded immediately. No diagnosis or dispensing will occur.
      </p>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/30 transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Confirm & Compare Selected</span>
        </button>
      </div>
    </div>
  );
}
