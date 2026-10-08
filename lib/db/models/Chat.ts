import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEntityMemory {
  currentMedicine?: { id: string; name: string };
  lastAlternatives?: Array<{ id: string; name: string }>;
  lastPriceTable?: Record<string, unknown>;
  pincode?: string;
  language: string;
  mentionedMedicines: Array<{ id: string; name: string; ordinal?: number }>;
}

export interface IChat extends Document {
  userId: string;
  title: string;
  entityMemory: IEntityMemory;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EntityMemorySchema = new Schema<IEntityMemory>(
  {
    currentMedicine: {
      id: String,
      name: String,
    },
    lastAlternatives: [
      {
        id: String,
        name: String,
      },
    ],
    lastPriceTable: { type: Schema.Types.Mixed },
    pincode: String,
    language: { type: String, default: "en" },
    mentionedMedicines: [
      {
        id: String,
        name: String,
        ordinal: Number,
      },
    ],
  },
  { _id: false }
);

const ChatSchema = new Schema<IChat>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: "New Consultation" },
    entityMemory: {
      type: EntityMemorySchema,
      default: () => ({ language: "en", mentionedMedicines: [] }),
    },
    summary: { type: String },
  },
  { timestamps: true }
);

export const Chat: Model<IChat> =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
