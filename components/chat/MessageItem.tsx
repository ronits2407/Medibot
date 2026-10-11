import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CardRenderer } from "../cards/CardRegistry";
import { ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: Array<{
    type: string;
    data: any;
  }>;
}

function DisclaimerAcceptPrompt() {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/disclaimer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: "v1" }),
      });
      if (res.ok) {
        localStorage.setItem("medibot_disclaimer_ack_v1", "true");
        setAccepted(true);
        window.dispatchEvent(new CustomEvent("medibot:disclaimer_accepted"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (accepted) {
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-olive border-2 border-ink text-xs text-ink font-bold flex items-center gap-2 shadow-brutal-sm">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Medical disclaimer acknowledged. You can query any medication safely!</span>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-xl bg-sun border-2 border-ink text-xs space-y-2 shadow-brutal-sm">
      <div className="flex items-center gap-2 font-black text-ink">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>Mandatory Regulatory Disclaimer</span>
      </div>
      <p className="text-[11px] text-ink font-semibold leading-relaxed">
        MediBot provides verified informational price comparisons only and does not diagnose illnesses or prescribe individual medications. Consult a licensed doctor before taking medications.
      </p>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full py-2 px-3 rounded-full bg-ink text-cream hover:bg-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-brutal-sm transition-all cursor-pointer disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        <span>{loading ? "Recording..." : "Acknowledge & Continue"}</span>
      </button>
    </div>
  );
}

export function MessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isDisclaimerWarning =
    !isUser && message.content.toLowerCase().includes("legal disclaimer must be acknowledged");

  return (
    <div
      className={`flex my-3 w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-2xl w-full sm:w-auto space-y-3 ${
          isUser ? "flex flex-col items-end" : "flex flex-col items-start"
        }`}
      >
        <div
          className={`rounded-3xl px-5 py-3.5 text-sm leading-relaxed border-2 border-ink shadow-brutal-sm ${
            isUser
              ? "bg-ink text-cream rounded-tr-xs"
              : "bg-cream text-ink rounded-tl-xs"
          }`}
        >
          <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-sand prose-pre:border prose-pre:border-ink">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          {isDisclaimerWarning && <DisclaimerAcceptPrompt />}
        </div>

        {/* Dynamic Cards */}
        {message.cards && message.cards.length > 0 && (
          <div className="w-full space-y-2">
            {message.cards.map((card, idx) => (
              <CardRenderer key={idx} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
