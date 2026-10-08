import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompositionItem {
  salt: string;
  saltNormalized: string;
  strength: number | null;
  unit: string | null;
}

export type MedicineForm =
  | "tablet"
  | "capsule"
  | "syrup"
  | "injection"
  | "cream"
  | "drops"
  | "other";

export type MedicineSchedule = "H" | "H1" | "X" | "NDPS" | "OTC" | "UNKNOWN";

export interface IMedicine extends Document {
  name: string;
  nameNormalized: string;
  manufacturer: string;
  mrp: number;
  packSize: string;
  form: MedicineForm;
  composition: ICompositionItem[];
  compositionHash: string;
  saltsKey: string;
  therapeuticClass?: string;
  schedule: MedicineSchedule;
  uses?: string;
  sideEffects?: string;
  interactions?: string;
  howToUse?: string;
  source: "1mg" | "mid" | "jan_aushadhi";
  sourceId: string;
  isGenericJanAushadhi: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompositionItemSchema = new Schema<ICompositionItem>(
  {
    salt: { type: String, required: true },
    saltNormalized: { type: String, required: true },
    strength: { type: Number, default: null },
    unit: { type: String, default: null },
  },
  { _id: false }
);

const MedicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true, index: true },
    nameNormalized: { type: String, required: true, index: true },
    manufacturer: { type: String, required: true },
    mrp: { type: Number, required: true },
    packSize: { type: String, default: "1 Strip" },
    form: {
      type: String,
      enum: ["tablet", "capsule", "syrup", "injection", "cream", "drops", "other"],
      default: "other",
    },
    composition: { type: [CompositionItemSchema], required: true },
    compositionHash: { type: String, required: true, index: true },
    saltsKey: { type: String, required: true, index: true },
    therapeuticClass: { type: String },
    schedule: {
      type: String,
      enum: ["H", "H1", "X", "NDPS", "OTC", "UNKNOWN"],
      default: "UNKNOWN",
      index: true,
    },
    uses: { type: String },
    sideEffects: { type: String },
    interactions: { type: String },
    howToUse: { type: String },
    source: {
      type: String,
      enum: ["1mg", "mid", "jan_aushadhi"],
      required: true,
    },
    sourceId: { type: String, required: true },
    isGenericJanAushadhi: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes defined in DESIGN.md §5.1
MedicineSchema.index({ source: 1, sourceId: 1 }, { unique: true });
MedicineSchema.index({ nameNormalized: "text", manufacturer: "text" });

export const Medicine: Model<IMedicine> =
  mongoose.models.Medicine || mongoose.model<IMedicine>("Medicine", MedicineSchema);
