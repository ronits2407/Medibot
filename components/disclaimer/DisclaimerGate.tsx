"use client";

import { useState, useEffect } from "react";
import { MANDATORY_DISCLAIMER, DISCLAIMER_VERSION } from "@/lib/constants";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Navigation,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface DisclaimerGateProps {
  onAcknowledged?: () => void;
}

export function DisclaimerGate({ onAcknowledged }: DisclaimerGateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"disclaimer" | "location">("disclaimer");
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkedInitial, setCheckedInitial] = useState(false);

  // Location / Pincode permission state
  const [pincode, setPincode] = useState("110001");
  const [locationArea, setLocationArea] = useState<string | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/disclaimer");
        if (res.ok) {
          const data = await res.json();
          if (!data.acknowledged) {
            localStorage.removeItem(`medibot_disclaimer_ack_${DISCLAIMER_VERSION}`);
            setStep("disclaimer");
            setIsOpen(true);
            setCheckedInitial(true);
            return;
          } else {
            localStorage.setItem(`medibot_disclaimer_ack_${DISCLAIMER_VERSION}`, "true");
          }
        }

        const pincodePermitted =
          localStorage.getItem("medibot_pincode_permitted") === "true";
        if (!pincodePermitted) {
          setStep("location");
          setIsOpen(true);
        }
      } catch (e) {
        console.error("Could not fetch status:", e);
      } finally {
        setCheckedInitial(true);
      }
    }
    checkStatus();

    const handleOpen = () => {
      setStep("disclaimer");
      setIsOpen(true);
    };
    const handleAccepted = () => {
      setIsOpen(false);
    };
    window.addEventListener("medibot:open-disclaimer", handleOpen);
    window.addEventListener("medibot:disclaimer_accepted", handleAccepted);
    return () => {
      window.removeEventListener("medibot:open-disclaimer", handleOpen);
      window.removeEventListener("medibot:disclaimer_accepted", handleAccepted);
    };
  }, []);

  const handleAcceptDisclaimer = async () => {
    if (!isChecked || loading) return;
    setLoading(true);
    try {
      await fetch("/api/disclaimer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: DISCLAIMER_VERSION }),
      });
      localStorage.setItem(`medibot_disclaimer_ack_${DISCLAIMER_VERSION}`, "true");
      // Advance to step 2: Delivery location & Pincode permission
      setStep("location");
    } catch (e) {
      console.error("Failed to submit acknowledgement:", e);
      localStorage.setItem(`medibot_disclaimer_ack_${DISCLAIMER_VERSION}`, "true");
      setStep("location");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLocationPermission = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.pincode) {
              setPincode(data.pincode);
              setLocationArea(`${data.district || ""}${data.state ? `, ${data.state}` : ""}`);
            }
          }
        } catch (err: any) {
          console.warn("Location reverse geocode error:", err);
          setPincode("110001");
          setLocationArea("New Delhi, Delhi");
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        setDetectingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError("Location permission denied. Please enter your 6-digit PIN code manually below.");
        } else {
          setGpsError("Could not retrieve precise location. Please enter your PIN code manually.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleValidatePincode = async (code: string) => {
    setPincode(code);
    if (/^[1-9][0-9]{5}$/.test(code)) {
      try {
        const res = await fetch(`/api/location?pincode=${code}`);
        if (res.ok) {
          const data = await res.json();
          setLocationArea(`${data.district || ""}${data.state ? `, ${data.state}` : ""}`);
        }
      } catch {
        setLocationArea(null);
      }
    } else {
      setLocationArea(null);
    }
  };

  const handleSaveLocation = async () => {
    const validPin = /^[1-9][0-9]{5}$/.test(pincode) ? pincode : "110001";
    setLoading(true);

    try {
      localStorage.setItem("medibot_delivery_pincode", validPin);
      localStorage.setItem("medibot_pincode_permitted", "true");

      await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: validPin }),
      });

      // Dispatch event to notify Chat, Composer, and Layout
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("medibot_pincode_updated", { detail: validPin })
        );
      }

      setIsOpen(false);
      onAcknowledged?.();
    } catch (e) {
      console.error("Failed to save location:", e);
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
      {/* STEP 1: Medical Disclaimer (Only if unacknowledged) */}
      {step === "disclaimer" ? (
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 space-y-5">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500">
            <div className="rounded-2xl bg-amber-100 dark:bg-amber-950/60 p-2.5">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Important Medical Disclaimer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                CDSCO Compliance Version {DISCLAIMER_VERSION}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200 leading-relaxed space-y-2">
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Mandatory Notice:
            </p>
            <p className="italic bg-white dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              &ldquo;{MANDATORY_DISCLAIMER}&rdquo;
            </p>
            <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside pt-1">
              <li>Deterministic price comparison across licensed Indian pharmacies.</li>
              <li>Zero diagnostic or prescribing capability.</li>
              <li>Prescription drugs (Schedule H/H1/X) mandate a licensed doctor&apos;s prescription.</li>
            </ul>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="acknowledge-checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label
              htmlFor="acknowledge-checkbox"
              className="text-xs text-slate-600 dark:text-slate-300 select-none cursor-pointer leading-normal"
            >
              I acknowledge that MediBot is strictly an educational price comparison tool, not a substitute for professional medical consultation.
            </label>
          </div>

          <button
            onClick={handleAcceptDisclaimer}
            disabled={!isChecked || loading}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              isChecked && !loading
                ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20 active:scale-[0.99]"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>{loading ? "Recording..." : "I Understand & Continue"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* STEP 2: Minimal Delivery PIN Code Selection */
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Select Delivery PIN Code
              </h3>
              <p className="text-xs text-slate-500">
                For local pharmacy stock & delivery speeds
              </p>
            </div>
          </div>

          {/* 6-digit input with Auto-Detect GPS button inside */}
          <div className="space-y-2">
            <div className="relative flex items-center">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => handleValidatePincode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Enter 6-digit PIN"
                className="w-full px-4 py-3 pr-24 rounded-2xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm tracking-widest focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleRequestLocationPermission}
                disabled={detectingGps}
                className="absolute right-2 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Auto-detect current location"
              >
                {detectingGps ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                ) : (
                  <Navigation className="h-3.5 w-3.5 text-teal-600" />
                )}
                <span className="text-[11px]">{detectingGps ? "Detecting" : "GPS"}</span>
              </button>
            </div>

            {locationArea && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>{locationArea}</span>
              </p>
            )}

            {gpsError && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 px-1">
                {gpsError}
              </p>
            )}
          </div>

          {/* Single clean confirm button */}
          <button
            type="button"
            onClick={handleSaveLocation}
            disabled={loading || !/^[1-9][0-9]{5}$/.test(pincode)}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Set Delivery PIN"}
          </button>
        </div>
      )}
    </div>
  );
}
