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
    <div className="flex-1 overflow-y-auto px-4 py-8 bg-[#f5f0e1] text-ink">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="pb-4 border-b-2 border-ink">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-sun border-2 border-ink text-ink flex items-center justify-center shadow-brutal-sm">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-ink tracking-tight">
                Settings & Privacy
              </h1>
              <p className="mt-0.5 text-xs text-ink/70 font-semibold font-mono">
                Configure delivery preferences, language, review compliance audits, and manage your DPDP data privacy rights.
              </p>
            </div>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-olive/30 border-2 border-ink shadow-brutal-sm flex items-center gap-2 text-ink text-xs font-bold animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 text-ink" />
            <span>Preferences successfully updated!</span>
          </div>
        )}

        {/* General Preferences Card */}
        <div className="bg-[#fbf8ef] rounded-3xl p-6 border-2 border-ink shadow-brutal-sm space-y-5 text-ink">
          <h2 className="text-base font-heading font-black text-ink">
            Delivery & Language Preferences
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-heading font-black text-ink mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-ink" />
                  Default Delivery Pincode
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink bg-white font-mono font-bold text-ink text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ink"
                  placeholder="e.g. 110001"
                />
                <span className="text-[11px] text-ink/60 font-mono mt-1 block">
                  Used for calculating certified pharmacy delivery speeds & stock availability.
                </span>
              </div>

              <div>
                <label className="block text-xs font-heading font-black text-ink mb-1.5 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-ink" />
                  Preferred Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink bg-white font-mono font-bold text-ink text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ink"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
                <span className="text-[11px] text-ink/60 font-mono mt-1 block">
                  Responses will be translated while keeping all active drug and salt names in Latin English.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sun hover:bg-sun-deep text-ink text-xs font-heading font-black border-2 border-ink shadow-brutal-sm transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Preferences"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* CDSCO Regulatory Compliance Card */}
        <div className="bg-[#fbf8ef] rounded-3xl p-6 border-2 border-ink shadow-brutal-sm space-y-4 text-ink">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-ink" />
              <h2 className="text-base font-heading font-black text-ink">
                Regulatory Compliance & Disclaimer
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-olive text-ink border border-ink shadow-xs">
              CDSCO Rule 0 Active
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-sand/60 text-xs text-ink leading-relaxed border border-ink font-mono">
            <strong>Mandatory Legal Notice:</strong> {MANDATORY_DISCLAIMER}
          </div>

          <div className="flex items-center justify-between text-xs text-ink/70 font-mono pt-1">
            <span>
              Disclaimer Status:{" "}
              <strong className="text-ink font-bold">
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
        <div className="bg-[#fbf8ef] rounded-3xl p-6 border-2 border-ink shadow-brutal-sm space-y-5 text-ink">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-ink" />
            <h2 className="text-base font-heading font-black text-ink">
              Data Privacy & DPDP Rights
            </h2>
          </div>
          <p className="text-xs text-ink/70 font-medium">
            You hold total sovereignty over your health queries and saved medications. MediBot operates on a zero-tracking, fail-closed policy.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t-2 border-ink/10 pt-4">
            <div>
              <h4 className="text-xs font-heading font-black text-ink">
                Export Your Complete Record
              </h4>
              <p className="text-[11px] text-ink/60 font-mono">
                Download a portable JSON archive of your chats, medicines, and consent acks.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-sand hover:bg-cream text-ink text-xs font-bold border-2 border-ink shadow-brutal-xs transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export Data (JSON)</span>
            </button>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t-2 border-ink/10 pt-4">
            <div>
              <h4 className="text-xs font-heading font-black text-[#c2362d]">
                Cascade Delete My Data (Right to be Forgotten)
              </h4>
              <p className="text-[11px] text-ink/60 font-mono">
                Permanently expunges all conversations, saved medicines, reminder schedules, and account traces.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#c2362d] hover:bg-[#a82a22] text-white text-xs font-heading font-black border-2 border-ink shadow-brutal-xs transition-all cursor-pointer"
            >
              <Trash2 className="h-4 w-4 text-white" />
              <span>Delete My Data</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#fbf8ef] rounded-3xl max-w-md w-full p-6 shadow-[8px_8px_0_0_#17140f] border-3 border-ink space-y-4 text-ink animate-in fade-in zoom-in-95 duration-150">
              <div className="h-12 w-12 rounded-2xl bg-[#c2362d]/20 border-2 border-ink text-[#c2362d] flex items-center justify-center mx-auto shadow-xs">
                <AlertOctagon className="h-7 w-7 text-[#c2362d]" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-heading font-black text-lg text-ink">
                  Permanently Delete All Data?
                </h3>
                <p className="text-xs text-ink/70 font-medium">
                  This action is irreversible. All your chats, messages, saved medicines, and compliance logs will be permanently deleted from the database.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-sand hover:bg-cream text-ink text-xs font-bold border border-ink shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteData}
                  className="px-4 py-2 rounded-xl bg-[#c2362d] hover:bg-[#a82a22] text-white text-xs font-heading font-black border-2 border-ink shadow-brutal-sm cursor-pointer"
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
