import mongoose, { Document, Schema, Types } from "mongoose";

export interface NotificationPreferences {
  deployEmails: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
  previewComments: boolean;
}

export interface INotificationSettings extends Document {
  userId: Types.ObjectId;
  notificationEmail?: string;
  preferences: NotificationPreferences;
  theme?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PreferenceSchema = new Schema<NotificationPreferences>(
  {
    deployEmails: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false },
    previewComments: { type: Boolean, default: true },
  },
  { _id: false },
);

const NotificationSettingsSchema = new Schema<INotificationSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    notificationEmail: {
      type: String,
      trim: true,
    },
    preferences: {
      type: PreferenceSchema,
      default: {},
    },
    theme: {
      type: String,
      enum: ["light", "dark", "sunset"],
      default: "light",
    },
  },
  {
    timestamps: true,
  },
);

export const NotificationSettings = mongoose.model<INotificationSettings>(
  "NotificationSettings",
  NotificationSettingsSchema,
);
