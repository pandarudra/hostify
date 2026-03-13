import mongoose, { Document, Schema, Types } from "mongoose";

export type TwoFactorPurpose = "enable" | "login";

export interface ITwoFactorChallenge extends Document {
  userId: Types.ObjectId;
  purpose: TwoFactorPurpose;
  destination: string;
  codeHash: string;
  expiresAt: Date;
  consumed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TwoFactorChallengeSchema = new Schema<ITwoFactorChallenge>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    purpose: { type: String, enum: ["enable", "login"], required: true },
    destination: { type: String, required: true, trim: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

TwoFactorChallengeSchema.index({ userId: 1, purpose: 1, expiresAt: 1 });
TwoFactorChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TwoFactorChallenge = mongoose.model<ITwoFactorChallenge>(
  "TwoFactorChallenge",
  TwoFactorChallengeSchema,
);
