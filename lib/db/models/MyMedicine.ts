import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMyMedicine extends Document {
  userId: string;
  medicineId?: mongoose.Types.ObjectId;
  medicineName: string;
  dosage?: string;
  activeIngredients?: { saltName: string; strength?: string }[];
  compositionHash?: string;
  frequency: string; // e.g. "Once daily", "Twice daily after meals"
  refillEveryDays: number; // e.g. 30
  lastRefill: Date;
  reminderChannel: "email" | "in_app" | "none";
  createdAt: Date;
  updatedAt: Date;
}

const MyMedicineSchema = new Schema<IMyMedicine>(
  {
    userId: { type: String, required: true, index: true },
    medicineId: { type: Schema.Types.ObjectId, ref: "Medicine" },
    medicineName: { type: String, required: true },
    dosage: { type: String, default: "" },
    activeIngredients: [
      {
        saltName: { type: String },
        strength: { type: String },
      },
    ],
    compositionHash: { type: String },
    frequency: { type: String, default: "Once daily" },
    refillEveryDays: { type: Number, default: 30 },
    lastRefill: { type: Date, default: Date.now },
    reminderChannel: { type: String, enum: ["email", "in_app", "none"], default: "in_app" },
  },
  { timestamps: true }
);

export const MyMedicine: Model<IMyMedicine> =
  mongoose.models.MyMedicine || mongoose.model<IMyMedicine>("MyMedicine", MyMedicineSchema);

