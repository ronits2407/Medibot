"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageItem, ChatMessage } from "@/components/chat/MessageItem";
import { Composer } from "@/components/chat/Composer";
import { PrescriptionReview, PrescriptionItem } from "@/components/cards/PrescriptionReview";
import { ArrowDown, Loader2 } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [pincode, setPincode] = useState("110001");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [pendingPrescription, setPendingPrescription] = useState<PrescriptionItem[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("medibot_delivery_pincode");
      if (savedPin) setPincode(savedPin);

      const handler = (e: any) => {
        if (e.detail) setPincode(e.detail);
      };
      window.addEventListener("medibot_pincode_updated", handler);
      return () => window.removeEventListener("medibot_pincode_updated", handler);
    }
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: text,
          language: "en",
          pincode,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process inquiry");
      }

      const data = await res.json();
      if (data.chatId && !chatId) {
        setChatId(data.chatId);
      }

      const assistantMsg: ChatMessage = {
        id: data.messageId || `asst-${Date.now()}`,
        role: "assistant",
        content: data.markdown || "",
        cards: data.cards || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${err.message || "An error occurred while processing your request."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-transparent">
      {/* Scrollable Message History Area */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-4xl mx-auto space-y-6 min-h-full flex flex-col justify-center">
          {messages.length === 0 && (
            <div className="my-auto py-10 text-center max-w-xl mx-auto space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-sun px-3.5 py-1 text-xs font-black uppercase text-ink shadow-brutal-sm">
                🛡️ AI Assistant · Prescription Guard Active
              </span>
              <h2 className="text-3xl sm:text-5xl font-heading font-black text-ink tracking-tight">
                What medication are you looking for?
              </h2>
              <p className="text-sm text-muted-foreground font-semibold max-w-md mx-auto">
                Compare verified prices across 1mg, PharmEasy, Apollo, and Jan Aushadhi, check Schedule H safety, or find cheaper equivalents.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {[
                  "Can I get a cheaper alternative to Augmentin 625 Duo?",
                  "What is the price of Dolo 650?",
                  "Price of Alprax 0.5mg for sleep",
                  "Compare Allegra 120mg prices",
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(preset)}
                    className="rounded-full border-2 border-ink bg-cream hover:bg-sun px-3.5 py-1.5 text-xs font-bold text-ink transition-all shadow-brutal-sm cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-slate-400 text-xs py-2 animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
              <span>Checking pharmacy pricing and safety databases...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-20 right-8 z-20 p-2 rounded-full bg-ink text-cream border-2 border-ink shadow-brutal-sm hover:bg-black transition-all cursor-pointer"
          title="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      {/* Sleek, Compact Message Composer Footer */}
      <footer className="border-t-2 border-ink/20 bg-[#fbf8ef]/90 backdrop-blur-md shrink-0 z-10">
        <Composer
          onSend={handleSendMessage}
          isLoading={isLoading}
          pincode={pincode}
          onPincodeChange={(pin) => setPincode(pin)}
          onPrescriptionExtracted={(items) => setPendingPrescription(items)}
        />
      </footer>

      {/* Prescription Review Modal */}
      {pendingPrescription && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-xl w-full">
            <PrescriptionReview
              items={pendingPrescription}
              onConfirm={(confirmedMeds) => {
                setPendingPrescription(null);
                handleSendMessage(
                  `Please compare pharmacy prices and verify prescription safety for: ${confirmedMeds.join(", ")}`
                );
              }}
              onCancel={() => setPendingPrescription(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
