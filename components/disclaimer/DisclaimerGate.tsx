"use client";

import { useState, useEffect } from "react";
import { MANDATORY_DISCLAIMER, DISCLAIMER_VERSION } from "@/lib/constants";
import { ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

interface DisclaimerGateProps {
  onAcknowledged?: () => void;
}

export function DisclaimerGate({ onAcknowledged }: DisclaimerGateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkedInitial, setCheckedInitial] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const stored = localStorage.getItem(`medibot_disclaimer_ack_${DISCLAIMER_VERSION}`);
        if (stored === "true") {
          setCheckedInitial(true);
          return;
        }

        const res = await fetch("/api/disclaimer");
        if (res.ok) {
          const data = await res.json();
          if (data.acknowledged) {
            localStorage.setItem(`medibot_disclaimer_ack_${DISCLAIMER_VERSION}`, "true");
            setCheckedInitial(true);
            return;
          }
        }
      } catch (e) {
        console.error("Could not fetch disclaimer ack status:", e);
      }
      setIsOpen(true);
      setCheckedInitial(true);
    }
    checkStatus();
  }, []);

  const handleAccept = async () => {
    if (!isChecked || loading) return;
    setLoading(true);
    try {
      await fetch("/api/disclaimer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: DISCLAIMER_VERSION }),
      });
      localStorage.setItem(`medibot_disclaimer_ack_${DISCLAIMER_VERSION}`, "true");
      setIsOpen(false);
      onAcknowledged?.();
    } catch (e) {
      console.error("Failed to submit acknowledgement:", e);
      // Still set local storage as fallback for seamless dev experience
      localStorage.setItem(`medibot_disclaimer_ack_${DISCLAIMER_VERSION}`, "true");
      setIsOpen(false);
      onAcknowledged?.();
    } finally {
      setLoading(false);
    }
  };

  if (!checkedInitial || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 mb-4">
          <div className="rounded-full bg-amber-100 dark:bg-amber-950/60 p-2.5">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Important Medical Disclaimer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compliance Standard Version {DISCLAIMER_VERSION}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700/60 text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-5">
          <p className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Please read carefully before using MediBot:
          </p>
          <p className="italic">
            &ldquo;{MANDATORY_DISCLAIMER}&rdquo;
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400 list-disc list-inside">
            <li>MediBot provides drug price comparisons and active composition references.</li>
            <li>It does <strong>not</strong> provide personalized diagnosis or prescribing.</li>
            <li>Prescription-controlled medicines require an authentic doctor&apos;s prescription.</li>
          </ul>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <input
            type="checkbox"
            id="acknowledge-checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
          />
          <label
            htmlFor="acknowledge-checkbox"
            className="text-xs text-slate-600 dark:text-slate-300 select-none cursor-pointer leading-normal"
          >
            I acknowledge that MediBot is strictly an educational and informational tool, not a substitute for professional medical diagnosis or treatment.
          </label>
        </div>

        <button
          onClick={handleAccept}
          disabled={!isChecked || loading}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
            isChecked && !loading
              ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20 active:scale-[0.99]"
              : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {loading ? "Recording Acknowledgement..." : "I Understand & Accept"}
        </button>
      </div>
    </div>
  );
}
