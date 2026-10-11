"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Download,
  Trash2,
  Save,
  Globe,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  FileText,
} from "lucide-react";
import { MANDATORY_DISCLAIMER } from "@/lib/constants";

export default function SettingsPage() {
  const [pincode, setPincode] = useState("110001");
  const [language, setLanguage] = useState("en");
  const [ackAt, setAckAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.pincode) setPincode(data.pincode);
          if (data.language) setLanguage(data.language);
          if (data.disclaimerAckAt) setAckAt(data.disclaimerAckAt);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode, language }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    window.open("/api/user/export", "_blank");
  };

  const handleDeleteData = async () => {
    try {
      setDeleting(true);
      const res = await fetch("/api/user/delete", { method: "POST" });
      if (res.ok) {
        alert("All your personal data, medicines, and chats have been permanently deleted.");
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Failed to delete user data:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Settings className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Settings & Privacy
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Configure delivery preferences, language, review compliance audits, and manage your DPDP data privacy rights.
          </p>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Preferences successfully updated!</span>
          </div>
        )}

        {/* General Preferences Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Delivery & Language Preferences
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  Default Delivery Pincode
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. 110001"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used for calculating certified pharmacy delivery speeds & stock availability.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-teal-600" />
                  Preferred Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Responses will be translated while keeping all active drug and salt names in Latin English.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md shadow-teal-600/30 transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Preferences"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* CDSCO Regulatory Compliance Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Regulatory Compliance & Disclaimer
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              CDSCO Rule 0 Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-700">
            <strong>Mandatory Legal Notice:</strong> {MANDATORY_DISCLAIMER}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Disclaimer Status:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                Acknowledged (Version v1)
              </strong>
            </span>
            {ackAt && (
              <span>
                Timestamp: {new Date(ackAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Data Privacy & DPDP Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Data Privacy & DPDP Rights
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            You hold total sovereignty over your health queries and saved medications. MediBot operates on a zero-tracking, fail-closed policy.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Export Your Complete Record
              </h4>
              <p className="text-[11px] text-slate-400">
                Download a portable JSON archive of your chats, medicines, and consent acks.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export Data (JSON)</span>
            </button>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div>
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Cascade Delete My Data (Right to be Forgotten)
              </h4>
              <p className="text-[11px] text-slate-400">
                Permanently expunges all conversations, saved medicines, reminder schedules, and account traces.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete My Data</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900/60 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="h-12 w-12 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <AlertOctagon className="h-7 w-7" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Permanently Delete All Data?
                </h3>
                <p className="text-xs text-slate-500">
                  This action is irreversible. All your chats, messages, saved medicines, and compliance logs will be permanently deleted from the database.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteData}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
                >
                  {deleting ? "Deleting..." : "Yes, Purge Everything"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
