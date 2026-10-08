import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICard {
  type: string;
  id?: string;
  data: Record<string, unknown>;
}

export interface ISource {
  n: number;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  fetchedAt?: Date;
}

export interface IGuardResultSummary {
  verdict: "RESTRICTED" | "OTC" | "NEEDS_CLARIFICATION" | "NO_DRUG";
  triggeredBy?: string;
  entities?: Array<{
    mention: string;
    medicineId?: string;
    name?: string;
    schedule?: string;
    score?: number;
  }>;
}

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  role: "user" | "assistant" | "system";
  content: string;
  language?: string;
  originalContent?: string;
  structured?: Record<string, unknown>;
  cards: ICard[];
  sources: ISource[];
  guard?: IGuardResultSummary;
  toolCalls?: Array<Record<string, unknown>>;
  feedback?: {
    thumb?: "up" | "down";
    csat?: number;
    comment?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    language: { type: String, default: "en" },
    originalContent: { type: String },
    structured: { type: Schema.Types.Mixed },
    cards: [Schema.Types.Mixed],
    sources: [Schema.Types.Mixed],
    guard: { type: Schema.Types.Mixed },
    toolCalls: [Schema.Types.Mixed],
    feedback: {
      thumb: { type: String, enum: ["up", "down"] },
      csat: { type: Number, min: 1, max: 5 },
      comment: { type: String },
    },
  },
  { timestamps: true }
);

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
