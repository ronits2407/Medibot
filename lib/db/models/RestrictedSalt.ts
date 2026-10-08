import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRestrictedSalt extends Document {
  salt: string;
  saltNormalized: string;
  schedule: "H" | "H1" | "X" | "NDPS";
  source: "CDSCO" | "dataset";
  notes?: string;
  synonyms: string[];
}

const RestrictedSaltSchema = new Schema<IRestrictedSalt>(
  {
    salt: { type: String, required: true },
    saltNormalized: { type: String, required: true, unique: true, index: true },
    schedule: {
      type: String,
      enum: ["H", "H1", "X", "NDPS"],
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["CDSCO", "dataset"],
      default: "CDSCO",
    },
    notes: { type: String },
    synonyms: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const RestrictedSalt: Model<IRestrictedSalt> =
  mongoose.models.RestrictedSalt ||
  mongoose.model<IRestrictedSalt>("RestrictedSalt", RestrictedSaltSchema);
