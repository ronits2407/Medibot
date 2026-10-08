import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  googleId?: string;
  email: string;
  name: string;
  image?: string;
  language: string;
  pincode?: string;
  disclaimerAckAt?: Date;
  disclaimerVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, sparse: true, index: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    image: { type: String },
    language: { type: String, default: "en" },
    pincode: { type: String },
    disclaimerAckAt: { type: Date },
    disclaimerVersion: { type: String },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
