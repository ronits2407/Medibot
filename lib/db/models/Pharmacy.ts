import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPharmacyHub {
  pincode: string;
  lat: number;
  lng: number;
}

export interface IPharmacySLA {
  standardHrs: number;
  expressHrs: number;
  cutoffTime: string; // e.g. "18:00"
}

export interface IPharmacy extends Document {
  name: string; // "1mg" | "PharmEasy" | "Apollo 24|7" | "Netmeds" | "Jan Aushadhi"
  baseUrl: string;
  certified: boolean;
  serviceablePincodePrefixes: string[];
  sla: IPharmacySLA;
  hubs: IPharmacyHub[];
}

const PharmacySchema = new Schema<IPharmacy>(
  {
    name: { type: String, required: true, unique: true },
    baseUrl: { type: String, required: true },
    certified: { type: Boolean, default: true },
    serviceablePincodePrefixes: { type: [String], default: [] },
    sla: {
      standardHrs: { type: Number, default: 24 },
      expressHrs: { type: Number, default: 4 },
      cutoffTime: { type: String, default: "18:00" },
    },
    hubs: [
      {
        pincode: String,
        lat: Number,
        lng: Number,
      },
    ],
  },
  { timestamps: true }
);

export const Pharmacy: Model<IPharmacy> =
  mongoose.models.Pharmacy || mongoose.model<IPharmacy>("Pharmacy", PharmacySchema);

export interface IPharmacyPrice extends Document {
  medicineId: mongoose.Types.ObjectId;
  pharmacyId: mongoose.Types.ObjectId;
  price: number;
  mrp: number;
  inStock: boolean;
  stockQty?: number;
  source: "live" | "seeded";
  fetchedAt: Date;
}

const PharmacyPriceSchema = new Schema<IPharmacyPrice>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true, index: true },
    pharmacyId: { type: Schema.Types.ObjectId, ref: "Pharmacy", required: true, index: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    inStock: { type: Boolean, default: true },
    stockQty: { type: Number },
    source: { type: String, enum: ["live", "seeded"], default: "seeded" },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PharmacyPriceSchema.index({ medicineId: 1, pharmacyId: 1 }, { unique: true });

export const PharmacyPrice: Model<IPharmacyPrice> =
  mongoose.models.PharmacyPrice ||
  mongoose.model<IPharmacyPrice>("PharmacyPrice", PharmacyPriceSchema);
