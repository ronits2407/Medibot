"use client";

import React, { useState, useEffect } from "react";
import {
  Pill,
  HeartPulse,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Calendar,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

interface SavedMedicine {
  _id: string;
  medicineName: string;
  dosage?: string;
  frequency: string;
  refillEveryDays: number;
  lastRefill: string;
  reminderChannel: "email" | "in_app" | "none";
  activeIngredients?: { saltName: string; strength?: string }[];
}

interface InteractionAlert {
  ruleId: string;
  severity: "HIGH" | "MODERATE" | "LOW";
  title: string;
  description: string;
  recommendation: string;
  medicinesInvolved: string[];
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<SavedMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("650 mg");
  const [newMedFrequency, setNewMedFrequency] = useState("Once daily after meals");
  const [newMedDays, setNewMedDays] = useState("30");
  const [newMedChannel, setNewMedChannel] = useState<"email" | "in_app" | "none">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interaction checking state
  const [interactions, setInteractions] = useState<InteractionAlert[]>([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [hasCheckedInteractions, setHasCheckedInteractions] = useState(false);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/medicines");
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
      }
    } catch (e) {
      console.error("Failed to load medicines:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineName: newMedName.trim(),
          dosage: newMedDosage.trim(),
          frequency: newMedFrequency,
          refillEveryDays: Number(newMedDays) || 30,
          reminderChannel: newMedChannel,
        }),
      });

      if (res.ok) {
        setNewMedName("");
        setShowAddModal(false);
        await fetchMedicines();
      }
    } catch (err) {
      console.error("Failed to add medicine:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/medicines?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMedicines((prev) => prev.filter((m) => m._id !== id));
      }
    } catch (e) {
      console.error("Failed to delete medicine:", e);
    }
  };

  const handleMarkRefilled = async (med: SavedMedicine) => {
    try {
      await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineName: med.medicineName,
          dosage: med.dosage,
          frequency: med.frequency,
          refillEveryDays: med.refillEveryDays,
          reminderChannel: med.reminderChannel,
          lastRefill: new Date().toISOString(),
        }),
      });
      await handleDelete(med._id);
      await fetchMedicines();
    } catch (e) {
      console.error("Failed to update refill:", e);
    }
  };

  const handleCheckInteractions = async () => {
    try {
      setCheckingInteractions(true);
      const res = await fetch("/api/medicines/interactions", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setInteractions(data.interactions || []);
        setHasCheckedInteractions(true);
      }
    } catch (e) {
      console.error("Failed to check interactions:", e);
    } finally {
      setCheckingInteractions(false);
    }
  };

  const handleLoadSampleRegimen = async () => {
    const samples = [
      { name: "Dolo 650", dosage: "650 mg", freq: "As needed for fever", days: 15 },
      { name: "Calpol 500", dosage: "500 mg", freq: "Twice daily", days: 3 },
      { name: "Telmisartan 40", dosage: "40 mg", freq: "Once daily in the morning", days: 30 },
      { name: "Cetirizine 10", dosage: "10 mg", freq: "Once daily at bedtime", days: 20 },
    ];

    setLoading(true);
    for (const s of samples) {
      await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineName: s.name,
          dosage: s.dosage,
          frequency: s.freq,
          refillEveryDays: s.days,
          reminderChannel: "email",
        }),
      });
    }
    await fetchMedicines();
  };

  const calculateDaysRemaining = (lastRefillStr: string, refillDays: number) => {
    const last = new Date(lastRefillStr).getTime();
    const expiry = last + refillDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <HeartPulse className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                My Medicines & Refill Schedules
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Track prescription cycles, configure refill alerts, and screen for adverse cross-medication interactions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCheckInteractions}
              disabled={medicines.length < 2 || checkingInteractions}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>{checkingInteractions ? "Analyzing..." : "Check Interactions"}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/30 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Medicine</span>
            </button>
          </div>
        </div>

        {/* Cross-Drug Interaction Alerts Section */}
        {hasCheckedInteractions && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            {interactions.length > 0 ? (
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span>Cross-Medication Interaction Warning ({interactions.length} detected)</span>
                </div>
                <div className="space-y-3 pt-1">
                  {interactions.map((alert, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            {alert.severity} SEVERITY
                          </span>
                          {alert.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {alert.medicinesInvolved.join(" ⇄ ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {alert.description}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg">
                        💡 <strong>Medical Guidance:</strong> {alert.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>No adverse cross-drug contraindications detected among your active saved medications.</span>
              </div>
            )}
          </div>
        )}

        {/* Medicines List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading medicines...</div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Pill className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                No active medicines tracked yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your regular prescriptions to automatically monitor stock levels, compute refill timelines, and scan safety contraindications.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-all cursor-pointer"
              >
                Add Your First Medicine
              </button>
              <button
                onClick={handleLoadSampleRegimen}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                Load Sample Regimen (4 Meds)
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicines.map((med) => {
              const daysRemaining = calculateDaysRemaining(med.lastRefill, med.refillEveryDays);
              const isUrgent = daysRemaining <= 3;
              const isWarning = daysRemaining <= 7 && !isUrgent;

              return (
                <div
                  key={med._id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                          {med.medicineName}
                        </h4>
                        {med.dosage && (
                          <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                            {med.dosage}
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isUrgent
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : isWarning
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {isUrgent ? "Refill Urgent" : isWarning ? "Refill Soon" : "In Stock"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <p>
                        <strong>Dosing:</strong> {med.frequency}
                      </p>
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Supply: {med.refillEveryDays} days cycle</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Bell className="h-3.5 w-3.5" />
                        <span>Alert: {med.reminderChannel === "email" ? "Email (Resend)" : "In-App"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        Days Remaining
                      </span>
                      <span
                        className={`text-lg font-black ${
                          isUrgent
                            ? "text-rose-600"
                            : isWarning
                            ? "text-amber-500"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {daysRemaining > 0 ? `${daysRemaining} days` : "Due today"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleMarkRefilled(med)}
                        title="Mark as Refilled"
                        className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(med._id)}
                        title="Delete Medicine"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Medicine Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Add Tracked Medicine
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddMedicine} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Medicine / Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dolo 650, Telmisartan 40mg, Augmentin"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Dosage Strength
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 650 mg, 10 mg"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Cycle (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={newMedDays}
                      onChange={(e) => setNewMedDays(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Frequency
                  </label>
                  <select
                    value={newMedFrequency}
                    onChange={(e) => setNewMedFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Once daily after meals">Once daily after meals</option>
                    <option value="Twice daily (morning and night)">Twice daily (morning & night)</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="As needed for pain/symptoms">As needed for pain / symptoms</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Refill Reminder Channel
                  </label>
                  <select
                    value={newMedChannel}
                    onChange={(e) => setNewMedChannel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="email">Email Notification (Resend)</option>
                    <option value="in_app">In-App Notification</option>
                    <option value="none">No Alerts</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/30"
                  >
                    {isSubmitting ? "Saving..." : "Save Medicine"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
