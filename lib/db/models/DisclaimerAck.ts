import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDisclaimerAck extends Document {
  userId?: string;
  sessionId?: string;
  version: string;
  ackAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const DisclaimerAckSchema = new Schema<IDisclaimerAck>(
  {
    userId: { type: String, index: true },
    sessionId: { type: String, index: true },
    version: { type: String, required: true },
    ackAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const DisclaimerAck: Model<IDisclaimerAck> =
  mongoose.models.DisclaimerAck || mongoose.model<IDisclaimerAck>("DisclaimerAck", DisclaimerAckSchema);
