"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageItem, ChatMessage } from "@/components/chat/MessageItem";
import { Composer } from "@/components/chat/Composer";
import { Pill, ShieldCheck, Sparkles, AlertCircle, ArrowDown } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [pincode, setPincode] = useState("110001");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-950">
      {/* Scrollable Message History Area */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="my-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center max-w-2xl mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="h-16 w-16 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center shadow-inner">
                <Pill className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  Welcome to MediBot
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your certified pharmacy price comparison and verified generic alternative companion with fail-closed safety.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                    Save on Generics
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Find identical composition Jan Aushadhi alternatives with up to 70% savings.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Prescription Guard
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Deterministic blocking of Schedule H / controlled drugs without guessing.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    No Diagnosing
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Strict code invariants against self-diagnosis or non-prescribed treatments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs py-2 animate-pulse">
              <div className="h-7 w-7 rounded-lg bg-teal-600/20 text-teal-600 flex items-center justify-center">
                <Pill className="h-4 w-4" />
              </div>
              <span>Checking safety guard and pharmacy databases...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-8 z-20 p-2.5 rounded-full bg-teal-600 text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 transition-all hover:scale-105"
          title="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      {/* Message Composer Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <Composer
          onSend={handleSendMessage}
          isLoading={isLoading}
          pincode={pincode}
          onPincodeChange={(pin) => setPincode(pin)}
        />
      </footer>
    </div>
  );
}
