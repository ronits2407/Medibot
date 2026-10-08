"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, MapPin, Sparkles } from "lucide-react";

interface ComposerProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  pincode?: string;
  onPincodeChange?: (pin: string) => void;
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
}: ComposerProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState(pincode);
  const recognitionRef = useRef<any>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-3">
      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar text-xs">
        <span className="flex items-center gap-1 text-slate-400 font-medium whitespace-nowrap pl-1">
          <Sparkles className="h-3.5 w-3.5 text-teal-500" />
          Try:
        </span>
        {QUICK_CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => onSend(chip)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap transition-colors border border-slate-200/60 dark:border-slate-700/60 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form Box */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-lg shadow-slate-200/40 dark:shadow-none focus-within:ring-2 focus-within:ring-teal-500/40 transition-all">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* Pincode Tag Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPinInput(!showPinInput)}
              className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Change Delivery Pincode"
            >
              <MapPin className="h-4 w-4 text-teal-600" />
              <span className="hidden sm:inline">{pin}</span>
            </button>

            {showPinInput && (
              <div className="absolute bottom-12 left-0 z-20 bg-white dark:bg-slate-850 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 6-digit Pincode"
                  className="w-32 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    onPincodeChange?.(pin);
                    setShowPinInput(false);
                  }}
                  className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Textarea / Input */}
          <textarea
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
            className="flex-1 max-h-32 resize-none bg-transparent py-2 px-1 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
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
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/30 disabled:opacity-40 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
