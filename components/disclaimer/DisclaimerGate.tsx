"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MANDATORY_DISCLAIMER, DISCLAIMER_VERSION } from "@/lib/constants";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Navigation,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface DisclaimerGateProps {
  onAcknowledged?: () => void;
}

export function DisclaimerGate({ onAcknowledged }: DisclaimerGateProps) {
  const pathname = usePathname();
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
    // If inside presentation deck or preview routes, do not block view
    if (pathname?.startsWith("/deck")) {
      setCheckedInitial(true);
      return;
    }

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
  }, [pathname]);

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

  if (!checkedInitial || !isOpen || pathname?.startsWith("/deck")) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/65 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* STEP 1: Medical Disclaimer */}
      {step === "disclaimer" ? (
        <div className="w-full max-w-lg rounded-[2.5rem] border-[3px] border-ink bg-[#fbf8ef] p-6 sm:p-8 shadow-[10px_10px_0_0_#17140f] text-ink animate-in zoom-in-95 duration-200 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl border-2 border-ink bg-sun flex items-center justify-center text-ink shrink-0 shadow-[3px_3px_0_0_#17140f]">
              <ShieldAlert className="h-7 w-7 text-ink" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-black tracking-tight text-ink leading-tight">
                Important Medical Disclaimer
              </h2>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink/60 mt-0.5">
                CDSCO Compliance · Version {DISCLAIMER_VERSION}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-ink bg-sand/70 p-4 sm:p-5 text-xs text-ink leading-relaxed space-y-3 shadow-inner">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-sun-deep shrink-0" />
              Mandatory Notice:
            </p>
            <div className="rounded-xl border-2 border-ink bg-white p-3.5 italic text-sm text-ink leading-relaxed shadow-[2px_2px_0_0_#17140f]">
              &ldquo;{MANDATORY_DISCLAIMER}&rdquo;
            </div>
            <ul className="space-y-1.5 text-xs text-ink/80 list-disc list-inside font-medium pt-1">
              <li>Deterministic price comparison across licensed Indian pharmacies.</li>
              <li>Zero diagnostic or prescribing capability.</li>
              <li>Prescription drugs (Schedule H/H1/X) mandate a licensed doctor&apos;s prescription.</li>
            </ul>
          </div>

          <div className="flex items-start gap-3 pt-1">
            <div className="relative flex items-center mt-0.5">
              <input
                type="checkbox"
                id="acknowledge-checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="h-5 w-5 rounded-md border-2 border-ink bg-white text-ink accent-ink cursor-pointer focus:ring-2 focus:ring-ink"
              />
            </div>
            <label
              htmlFor="acknowledge-checkbox"
              className="text-xs sm:text-sm font-medium text-ink select-none cursor-pointer leading-snug"
            >
              I acknowledge that MediBot is strictly an educational price comparison tool, not a substitute for professional medical consultation.
            </label>
          </div>

          <button
            onClick={handleAcceptDisclaimer}
            disabled={!isChecked || loading}
            className={`w-full py-4 px-6 rounded-full border-[3px] border-ink font-heading font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              isChecked && !loading
                ? "bg-ink text-cream hover:bg-black shadow-[4px_4px_0_0_#17140f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                : "bg-sand text-ink/40 border-ink/40 cursor-not-allowed shadow-none"
            }`}
          >
            <span>{loading ? "Recording..." : "I Understand & Continue"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* STEP 2: Delivery PIN Code Selection */
        <div className="w-full max-w-md rounded-[2.5rem] border-[3px] border-ink bg-[#fbf8ef] p-6 sm:p-8 shadow-[10px_10px_0_0_#17140f] text-ink animate-in zoom-in-95 duration-150 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl border-2 border-ink bg-sky flex items-center justify-center text-ink shrink-0 shadow-[3px_3px_0_0_#17140f]">
              <MapPin className="h-6 w-6 text-ink" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-black text-ink leading-tight">
                Select Delivery PIN Code
              </h3>
              <p className="font-mono text-xs font-bold text-ink/60 mt-0.5">
                For local pharmacy stock & live delivery ETAs
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative flex items-center">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => handleValidatePincode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Enter 6-digit PIN"
                className="w-full px-5 py-3.5 pr-28 rounded-2xl border-2 border-ink bg-white text-ink font-mono text-base font-bold tracking-widest focus:outline-hidden focus:ring-2 focus:ring-sun shadow-[3px_3px_0_0_#17140f]"
              />
              <button
                type="button"
                onClick={handleRequestLocationPermission}
                disabled={detectingGps}
                className="absolute right-2 px-3 py-2 rounded-xl border-2 border-ink bg-sun hover:bg-sun-deep text-ink text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-brutal-sm cursor-pointer"
                title="Auto-detect current location"
              >
                {detectingGps ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-ink" />
                ) : (
                  <Navigation className="h-3.5 w-3.5 text-ink" />
                )}
                <span>{detectingGps ? "Detecting" : "GPS"}</span>
              </button>
            </div>

            {locationArea && (
              <p className="text-xs font-bold text-olive-deep flex items-center gap-1.5 px-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>{locationArea}</span>
              </p>
            )}

            {gpsError && (
              <p className="text-xs font-bold text-destructive px-1">
                {gpsError}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveLocation}
            disabled={loading || !/^[1-9][0-9]{5}$/.test(pincode)}
            className="w-full py-4 px-6 rounded-full border-[3px] border-ink font-heading font-extrabold text-sm uppercase tracking-wider bg-sun hover:bg-sun-deep text-ink shadow-[4px_4px_0_0_#17140f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Set Delivery PIN"}
          </button>
        </div>
      )}
    </div>
  );
}
