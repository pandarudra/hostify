import mongoose, { Document, Schema } from "mongoose";

// User document interface
export interface IUser extends Document {
  githubId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  accessToken: string; // Encrypted GitHub token
  refreshToken?: string;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  twoFactorEnabled?: boolean;
  twoFactorEmail?: string;
  twoFactorEnabledAt?: Date;
}

// User schema
const UserSchema = new Schema<IUser>(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      sparse: true, // Allow null/undefined but unique if present
    },
    avatarUrl: {
      type: String,
    },
    accessToken: {
      type: String,
      required: true,
      select: false, // Don't return in queries by default (security)
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenExpiresAt: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorEmail: {
      type: String,
      trim: true,
    },
    twoFactorEnabledAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Auto-manage createdAt and updatedAt
  },
);

// Index for faster lookups
UserSchema.index({ username: 1 });

// Method to get user with token (explicit)
UserSchema.methods.getWithToken = function () {
  return this.model("User")
    .findById(this._id)
    .select("+accessToken +refreshToken");
};

export const User = mongoose.model<IUser>("User", UserSchema);
