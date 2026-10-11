"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  MapPin,
  Sparkles,
  Paperclip,
  Loader2,
  Navigation,
  Store,
  CheckCircle2,
} from "lucide-react";
import { PrescriptionItem } from "@/components/cards/PrescriptionReview";
import { NearbyPharmaciesModal } from "@/components/location/NearbyPharmaciesModal";

interface ComposerProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  pincode?: string;
  onPincodeChange?: (pin: string) => void;
  onPrescriptionExtracted?: (items: PrescriptionItem[]) => void;
}

const QUICK_CHIPS = [
  "What is the price of Dolo 650?",
  "Cheapest alternative for Calpol 650",
  "Can I buy Augmentin 625 Duo?",
  "Cetirizine 10mg in Jan Aushadhi",
  "Electral ORS usage instructions",
];

export function Composer({
  onSend,
  isLoading,
  pincode = "110001",
  onPincodeChange,
  onPrescriptionExtracted,
}: ComposerProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState(pincode);
  const [locationName, setLocationName] = useState<string>("");
  const [locationDetails, setLocationDetails] = useState<{
    area?: string;
    district?: string;
    state?: string;
  }>({});
  const [detectingGps, setDetectingGps] = useState(false);
  const [showNearbyModal, setShowNearbyModal] = useState(false);

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on page load
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Sync PIN and resolve friendly locality name
  useEffect(() => {
    setPin(pincode);
    resolveLocationName(pincode);
  }, [pincode]);

  const resolveLocationName = async (targetPin: string) => {
    if (!targetPin || targetPin.length !== 6) return;
    try {
      const res = await fetch(`/api/location?pincode=${targetPin}`);
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          const formatted = data.area
            ? `${data.area}, ${data.district || data.state}`
            : data.district
            ? `${data.district}, ${data.state}`
            : data.state || targetPin;
          setLocationName(formatted);
          setLocationDetails({
            area: data.area,
            district: data.district,
            state: data.state,
          });
        }
      }
    } catch (e) {
      console.warn("Failed to resolve location name:", e);
    }
  };

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
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
              setPin(data.pincode);
              onPincodeChange?.(data.pincode);
              resolveLocationName(data.pincode);
              if (typeof window !== "undefined") {
                localStorage.setItem("medibot_delivery_pincode", data.pincode);
              }
            }
          }
        } catch (e) {
          console.error("GPS resolution failed:", e);
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        setDetectingGps(false);
        alert(`Location permission denied or unavailable: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = false;
        reco.interimResults = false;
        reco.lang = "en-IN";

        reco.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };

        reco.onerror = () => setIsRecording(false);
        reco.onend = () => setIsRecording(false);
        recognitionRef.current = reco;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to parse prescription file");
      }

      const data = await res.json();
      if (data.items && data.items.length > 0) {
        onPrescriptionExtracted?.(data.items);
      } else {
        alert("No clear medications could be extracted from this document.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(err.message || "Failed to process prescription");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-3">
      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="flex items-center gap-1 text-ink font-black uppercase text-[10px] whitespace-nowrap pl-1">
          <Sparkles className="h-3.5 w-3.5 text-sun-deep" />
          Presets:
        </span>
        {QUICK_CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => onSend(chip)}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-full bg-cream hover:bg-sun text-ink font-bold whitespace-nowrap transition-all border border-ink shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form Box with Neo-brutalist styling */}
      <div className="rounded-2xl bg-cream border-2 border-ink p-2 shadow-brutal-sm transition-all">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* Location Name & Pincode Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPinInput(!showPinInput)}
              className="px-3 py-2 rounded-xl bg-sand hover:bg-sun border border-ink text-ink transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs group"
              title="Change Delivery Location & View Nearby Pharmacies"
            >
              <MapPin className="h-3.5 w-3.5 text-teal-600 group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[170px] text-left leading-tight font-medium">
                {locationName || (pin ? `PIN ${pin}` : "Set Location")}
              </span>
              <span className="hidden md:inline-block text-[10px] text-slate-400 font-mono">
                {pin}
              </span>
            </button>

            {/* Location Selector Popover */}
            {showPinInput && (
              <div className="absolute bottom-12 left-0 z-30 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-80 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-left">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Active Delivery Location
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                    {locationName || "Location"}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    PIN {pin} {locationDetails.state ? `• ${locationDetails.state}` : ""}
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="6-digit PIN"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const validPin = pin.trim() || "110001";
                      onPincodeChange?.(validPin);
                      resolveLocationName(validPin);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("medibot_delivery_pincode", validPin);
                        window.dispatchEvent(
                          new CustomEvent("medibot_pincode_updated", { detail: validPin })
                        );
                      }
                      fetch("/api/user/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ pincode: validPin }),
                      }).catch(() => {});
                      setShowPinInput(false);
                    }}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Save
                  </button>
                </div>

                {/* GPS Auto-Detect Button */}
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={detectingGps}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {detectingGps ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                  ) : (
                    <Navigation className="h-3.5 w-3.5 text-teal-600" />
                  )}
                  <span>{detectingGps ? "Detecting GPS..." : "Auto-Detect via GPS"}</span>
                </button>

                {/* View Nearest Pharmacies Map Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowPinInput(false);
                    setShowNearbyModal(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Store className="h-3.5 w-3.5 text-teal-600" />
                  <span>View Nearest Pharmacies</span>
                </button>
              </div>
            )}
          </div>

          {/* Hidden File Input for Prescription Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf"
            className="hidden"
          />

          {/* Upload Prescription Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isLoading}
            className="p-2.5 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Upload Prescription Photo / PDF"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>

          {/* Textarea / Input with no block border and active on load */}
          <textarea
            ref={textareaRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask about a medicine, compare prices, or find generics..."
            rows={1}
            className="flex-1 max-h-32 resize-none bg-transparent py-2 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ring-0 focus-visible:ring-0"
          />

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2.5 rounded-xl transition-all ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title="Speech to Text"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-ink hover:bg-black text-cream border border-ink shadow-brutal-sm disabled:opacity-40 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Nearest Pharmacies Map Modal */}
      <NearbyPharmaciesModal
        isOpen={showNearbyModal}
        onClose={() => setShowNearbyModal(false)}
        pincode={pin}
        locationName={locationName}
      />
    </div>
  );
}
