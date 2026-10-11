"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Navigation, CheckCircle2, Loader2 } from "lucide-react";

export function LoginPincodePrompt() {
  const [pincode, setPincode] = useState("110001");
  const [area, setArea] = useState<string | null>("New Delhi");
  const [detecting, setDetecting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("medibot_delivery_pincode");
      if (stored) {
        setPincode(stored);
        fetch(`/api/location?pincode=${stored}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.district) setArea(`${d.district}${d.state ? `, ${d.state}` : ""}`);
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setDetecting(true);
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
              setArea(`${data.district || ""}${data.state ? `, ${data.state}` : ""}`);
              localStorage.setItem("medibot_delivery_pincode", data.pincode);
              localStorage.setItem("medibot_pincode_permitted", "true");
            }
          }
        } catch {
          setPincode("110001");
          localStorage.setItem("medibot_delivery_pincode", "110001");
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        setIsEditing(true);
      },
      { timeout: 8000 }
    );
  };

  const handleManualSave = (val: string) => {
    const clean = val.replace(/[^0-9]/g, "");
    setPincode(clean);
    if (clean.length === 6) {
      localStorage.setItem("medibot_delivery_pincode", clean);
      localStorage.setItem("medibot_pincode_permitted", "true");
      fetch(`/api/location?pincode=${clean}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.district) setArea(`${d.district}${d.state ? `, ${d.state}` : ""}`);
        })
        .catch(() => {});
      setIsEditing(false);
    }
  };

  return (
    <div className="mt-5 p-3.5 rounded-2xl bg-teal-50/60 dark:bg-slate-800/60 border border-teal-200/80 dark:border-slate-700/80 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-teal-600" />
          Delivery Location Permission
        </span>
        <button
          type="button"
          onClick={handleDetect}
          disabled={detecting}
          className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          {detecting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Navigation className="h-3 w-3" />
          )}
          <span>{detecting ? "Detecting..." : "Auto-Detect"}</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        {isEditing ? (
          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => handleManualSave(e.target.value)}
              placeholder="Enter 6-digit PIN"
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 font-mono"
            />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2 py-1 bg-teal-600 text-white rounded-lg text-[11px] font-semibold"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
              📍 PIN: <strong>{pincode}</strong> {area && `(${area})`}
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-[11px] font-semibold text-slate-500 hover:text-teal-600 underline cursor-pointer shrink-0"
            >
              Change
            </button>
          </>
        )}
      </div>

      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        Required to compute local pharmacy delivery SLAs and instant inventory availability.
      </p>
    </div>
  );
}
