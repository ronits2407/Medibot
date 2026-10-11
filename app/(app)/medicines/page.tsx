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
  X,
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
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:py-8 bg-background text-foreground">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section (CivicPulse Neo-Brutalist Theme) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border-2 border-ink bg-sun text-ink flex items-center justify-center shadow-[2px_2px_0_0_#17140f] shrink-0">
                <HeartPulse className="h-5 w-5 text-ink" />
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-black text-ink tracking-tight">
                My Medicines & Refill Schedules
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm font-medium text-ink/70">
              Track prescription cycles, configure refill alerts, and screen for adverse cross-medication interactions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCheckInteractions}
              disabled={medicines.length < 2 || checkingInteractions}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-sun hover:bg-sun-deep text-ink border-2 border-ink shadow-brutal-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>{checkingInteractions ? "Analyzing..." : "Check Interactions"}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-ink hover:bg-black text-cream border-2 border-ink shadow-brutal-sm transition-all cursor-pointer"
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
              <div className="p-5 rounded-3xl border-2 border-ink bg-sun/30 space-y-3 shadow-brutal-sm">
                <div className="flex items-center gap-2 text-ink font-heading font-black text-base">
                  <AlertTriangle className="h-5 w-5 text-sun-deep" />
                  <span>Cross-Medication Interaction Warning ({interactions.length} detected)</span>
                </div>
                <div className="space-y-3 pt-1">
                  {interactions.map((alert, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border-2 border-ink bg-white shadow-brutal-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-destructive flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blush border border-ink text-ink">
                            {alert.severity} SEVERITY
                          </span>
                          {alert.title}
                        </span>
                        <span className="font-mono text-xs font-bold text-ink/60">
                          {alert.medicinesInvolved.join(" ⇄ ")}
                        </span>
                      </div>
                      <p className="text-xs text-ink/80 leading-relaxed font-medium">
                        {alert.description}
                      </p>
                      <p className="text-xs font-medium text-ink bg-sand/60 p-2.5 rounded-xl border border-ink/20">
                        💡 <strong>Medical Guidance:</strong> {alert.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border-2 border-ink bg-olive/30 flex items-center gap-3 text-ink text-xs font-bold shadow-brutal-sm">
                <CheckCircle2 className="h-5 w-5 text-olive-deep shrink-0" />
                <span>No adverse cross-drug contraindications detected among your active saved medications.</span>
              </div>
            )}
          </div>
        )}

        {/* Medicines List */}
        {loading ? (
          <div className="text-center py-12 text-ink/60 font-mono text-xs font-bold">
            Loading medicines...
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-3xl border-2 border-ink p-8 shadow-brutal space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl border-2 border-ink bg-sand flex items-center justify-center text-ink shadow-brutal-sm">
              <Pill className="h-8 w-8 text-ink" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-black text-xl text-ink">
                No active medicines tracked yet
              </h3>
              <p className="text-xs sm:text-sm text-ink/70 max-w-md mx-auto">
                Add your regular prescriptions to automatically monitor stock levels, compute refill timelines, and scan safety contraindications.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 rounded-full bg-ink text-cream text-xs font-bold hover:bg-black border-2 border-ink shadow-brutal-sm transition-all cursor-pointer"
              >
                Add Your First Medicine
              </button>
              <button
                onClick={handleLoadSampleRegimen}
                className="px-5 py-2.5 rounded-full bg-cream text-ink text-xs font-bold hover:bg-sun border-2 border-ink shadow-brutal-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-sun-deep" />
                Load Sample Regimen (4 Meds)
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {medicines.map((med) => {
              const daysRemaining = calculateDaysRemaining(med.lastRefill, med.refillEveryDays);
              const isUrgent = daysRemaining <= 3;
              const isWarning = daysRemaining <= 7 && !isUrgent;

              return (
                <div
                  key={med._id}
                  className="rounded-3xl bg-white border-2 border-ink p-5 shadow-brutal flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-transform"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-heading font-black text-lg text-ink leading-tight">
                          {med.medicineName}
                        </h4>
                        {med.dosage && (
                          <span className="font-mono text-xs font-bold text-ink/70">
                            {med.dosage}
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border border-ink uppercase ${
                          isUrgent
                            ? "bg-blush text-ink"
                            : isWarning
                            ? "bg-sun text-ink"
                            : "bg-olive/40 text-ink"
                        }`}
                      >
                        {isUrgent ? "Refill Urgent" : isWarning ? "Refill Soon" : "In Stock"}
                      </span>
                    </div>

                    <div className="text-xs text-ink/75 space-y-1.5 font-medium">
                      <p>
                        <strong className="text-ink">Dosing:</strong> {med.frequency}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-ink/60 shrink-0" />
                        <span>Supply: {med.refillEveryDays} days cycle</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-ink/60 shrink-0" />
                        <span>Alert: {med.reminderChannel === "email" ? "Email (Resend)" : "In-App"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-ink/15 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-ink/60 uppercase font-bold tracking-wider block">
                        Days Remaining
                      </span>
                      <span
                        className={`font-heading text-xl font-black ${
                          isUrgent
                            ? "text-destructive"
                            : isWarning
                            ? "text-sun-deep"
                            : "text-ink"
                        }`}
                      >
                        {daysRemaining > 0 ? `${daysRemaining} days` : "Due today"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMarkRefilled(med)}
                        title="Mark as Refilled"
                        className="h-8 w-8 rounded-full border border-ink bg-cream hover:bg-sun text-ink flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(med._id)}
                        title="Delete Medicine"
                        className="h-8 w-8 rounded-full border border-ink bg-cream hover:bg-blush text-ink flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Medicine Modal (CivicPulse Neo-Brutalist Popover) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-ink/65 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#fbf8ef] rounded-[2.5rem] max-w-md w-full p-6 sm:p-7 shadow-[10px_10px_0_0_#17140f] border-[3px] border-ink text-ink space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b-2 border-ink/15 pb-3">
                <h3 className="font-heading font-black text-xl text-ink">
                  Add Tracked Medicine
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="h-8 w-8 rounded-full border border-ink bg-cream hover:bg-sand flex items-center justify-center text-ink cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddMedicine} className="space-y-4">
                <div>
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-ink/70 block mb-1">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="e.g. Augmentin 625 Duo or Dolo 650"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-ink bg-white text-xs font-bold text-ink shadow-[2px_2px_0_0_#17140f] focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-xs font-bold uppercase tracking-wider text-ink/70 block mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      placeholder="e.g. 625 mg"
                      className="w-full px-3 py-2 rounded-xl border-2 border-ink bg-white text-xs font-bold text-ink shadow-[2px_2px_0_0_#17140f] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-xs font-bold uppercase tracking-wider text-ink/70 block mb-1">
                      Cycle (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={newMedDays}
                      onChange={(e) => setNewMedDays(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-ink bg-white font-mono text-xs font-bold text-ink shadow-[2px_2px_0_0_#17140f] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-ink/70 block mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={newMedFrequency}
                    onChange={(e) => setNewMedFrequency(e.target.value)}
                    placeholder="e.g. Twice daily after meals"
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink bg-white text-xs font-bold text-ink shadow-[2px_2px_0_0_#17140f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-ink/70 block mb-1">
                    Refill Notification Alert
                  </label>
                  <select
                    value={newMedChannel}
                    onChange={(e) => setNewMedChannel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink bg-white text-xs font-bold text-ink shadow-[2px_2px_0_0_#17140f] focus:outline-none"
                  >
                    <option value="email">Email Notification (via Resend)</option>
                    <option value="in_app">In-App Notification Banner</option>
                    <option value="none">Disabled (No Reminders)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 px-4 rounded-full border-2 border-ink bg-sand hover:bg-cream font-heading font-bold text-xs uppercase tracking-wider text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newMedName.trim()}
                    className="flex-1 py-3 px-4 rounded-full border-2 border-ink bg-ink text-cream hover:bg-black font-heading font-extrabold text-xs uppercase tracking-wider shadow-brutal-sm cursor-pointer disabled:opacity-40"
                  >
                    {isSubmitting ? "Saving..." : "Add to Cabinet"}
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
