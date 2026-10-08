import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CardRenderer } from "../cards/CardRegistry";
import { Bot, User, ThumbsUp, ThumbsDown } from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: Array<{
    type: string;
    data: any;
  }>;
}

export function MessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3.5 my-4 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${
          isUser
            ? "bg-slate-800 dark:bg-slate-700"
            : "bg-teal-600 shadow-teal-600/20"
        }`}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      {/* Message Bubble & Cards */}
      <div
        className={`max-w-2xl space-y-2.5 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser
              ? "bg-teal-600 text-white rounded-tr-xs"
              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs"
          }`}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Dynamic Cards */}
        {message.cards && message.cards.length > 0 && (
          <div className="w-full space-y-2">
            {message.cards.map((card, idx) => (
              <CardRenderer key={idx} card={card} />
            ))}
          </div>
        )}

        {/* Feedback thumbs for assistant messages */}
        {!isUser && (
          <div className="flex items-center gap-2 pt-1 pl-1">
            <button
              title="Helpful"
              className="p-1 rounded-md text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              title="Not helpful"
              className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
