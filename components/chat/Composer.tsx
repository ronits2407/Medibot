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

  // Focus textarea ONLY when running standalone, never inside an iframe
  useEffect(() => {
    if (typeof window !== "undefined" && window.self === window.top) {
      textareaRef.current?.focus();
    }
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
        const friendlyName = [data.district, data.state].filter(Boolean).join(", ");
        setLocationName(friendlyName);
        setLocationDetails({
          district: data.district,
          state: data.state,
        });
      }
    } catch {
      // Graceful fallback
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
                window.dispatchEvent(
                  new CustomEvent("medibot_pincode_updated", { detail: data.pincode })
                );
              }
              setShowPinInput(false);
            }
          }
        } catch (err) {
          console.error("GPS Reverse Geocode Error:", err);
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        setDetectingGps(false);
        alert(`Location Error: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Voice speech-to-text
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  // Prescription OCR upload
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
    <div className="w-full max-w-4xl mx-auto px-3 py-2 space-y-2">
      {/* Quick Suggestion Chips (Compact single line) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
        <span className="flex items-center gap-1 text-ink font-black uppercase text-[10px] whitespace-nowrap pl-0.5 text-ink/60">
          <Sparkles className="h-3 w-3 text-sun-deep" />
          Presets:
        </span>
        {QUICK_CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => onSend(chip)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-cream hover:bg-sun text-ink font-bold text-[11px] whitespace-nowrap transition-all border border-ink shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form Box with Neo-brutalist styling */}
      <div className="rounded-2xl bg-cream border-2 border-ink p-1.5 sm:p-2 shadow-brutal-sm transition-all">
        <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2">
          {/* Location Name & Pincode Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPinInput(!showPinInput)}
              className="px-2.5 py-1.5 rounded-xl bg-sand hover:bg-sun border border-ink text-ink transition-all flex items-center gap-1 text-xs font-bold cursor-pointer shadow-xs group"
              title="Change Delivery Location & View Nearby Pharmacies"
            >
              <MapPin className="h-3.5 w-3.5 text-ink group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate max-w-[110px] sm:max-w-[150px] text-left leading-tight font-medium text-[11px]">
                {locationName || (pin ? `PIN ${pin}` : "Set PIN")}
              </span>
              <span className="hidden sm:inline-block text-[10px] text-ink/60 font-mono">
                {pin}
              </span>
            </button>

            {/* Location Selector Popover (CivicPulse Neo-Brutalist Theme) */}
            {showPinInput && (
              <div className="absolute bottom-11 left-0 z-30 bg-[#fbf8ef] p-4 rounded-3xl shadow-[8px_8px_0_0_#17140f] border-2 border-ink w-80 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-left text-ink">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/60">
                    Active Delivery Location
                  </span>
                  <h4 className="font-heading font-black text-sm text-ink leading-tight mt-0.5">
                    {locationName || "Set Location"}
                  </h4>
                  <p className="font-mono text-[11px] text-ink/70 font-semibold mt-0.5">
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
                    className="flex-1 px-3 py-2 text-xs rounded-xl border-2 border-ink bg-white font-mono font-bold text-ink shadow-[2px_2px_0_0_#17140f] focus:outline-none focus:ring-1 focus:ring-ink"
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
                    className="px-4 py-2 bg-ink hover:bg-black text-cream rounded-xl text-xs font-bold transition-all border-2 border-ink shadow-brutal-sm cursor-pointer"
                  >
                    Save
                  </button>
                </div>

                {/* GPS Auto-Detect Button */}
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={detectingGps}
                  className="w-full py-2 px-3 rounded-xl bg-sun hover:bg-sun-deep text-ink text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-2 border-ink shadow-brutal-sm cursor-pointer"
                >
                  {detectingGps ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-ink" />
                  ) : (
                    <Navigation className="h-3.5 w-3.5 text-ink" />
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
                  className="w-full py-2 px-3 rounded-xl bg-sky hover:bg-sky-deep text-ink text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-2 border-ink shadow-brutal-sm cursor-pointer"
                >
                  <Store className="h-3.5 w-3.5 text-ink" />
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
            className="p-2 rounded-xl text-ink/70 hover:text-ink hover:bg-sand transition-colors cursor-pointer"
            title="Upload Prescription Photo / PDF"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-ink" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>

          {/* Textarea / Input (no autofocus to avoid page scrolling) */}
          <textarea
            ref={textareaRef}
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
            className="flex-1 max-h-32 resize-none bg-transparent py-1.5 px-2 text-xs sm:text-sm text-ink placeholder:text-ink/40 border-none outline-none focus:outline-none focus:ring-0 ring-0"
          />

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2 rounded-xl transition-all ${
              isRecording
                ? "bg-destructive text-white animate-pulse"
                : "text-ink/70 hover:text-ink hover:bg-sand"
            }`}
            title="Speech to Text"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-ink" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-ink hover:bg-black text-cream border border-ink shadow-brutal-sm disabled:opacity-40 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
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
