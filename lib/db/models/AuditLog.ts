import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  ts: Date;
  userId?: string;
  chatId?: string;
  messageId?: string;
  rawQueryHash?: string;
  resolvedEntities: Array<Record<string, unknown>>;
  layerVerdicts: Record<string, unknown>;
  finalVerdict: "RESTRICTED" | "OTC" | "NEEDS_CLARIFICATION" | "NO_DRUG";
  triggeredBy?: string;
  scores?: Record<string, number>;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    ts: { type: Date, default: Date.now, index: true },
    userId: { type: String, index: true },
    chatId: { type: String, index: true },
    resolvedEntities: [Schema.Types.Mixed],
    layerVerdicts: { type: Schema.Types.Mixed, default: {} },
    finalVerdict: {
      type: String,
      enum: ["RESTRICTED", "OTC", "NEEDS_CLARIFICATION", "NO_DRUG"],
      required: true,
      index: true,
    },
    triggeredBy: { type: String },
    scores: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
