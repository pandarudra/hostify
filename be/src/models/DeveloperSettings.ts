import mongoose, { Document, Schema, Types } from "mongoose";

export interface AzureSettings {
  accountName?: string;
  containerName?: string;
  sasTokenEncrypted?: string;
}

export interface CloudflareSettings {
  accountId?: string;
  namespaceId?: string;
  apiTokenEncrypted?: string;
}

export interface DomainEntry {
  id: string;
  domain: string;
  target?: string;
}

export interface IDeveloperSettings extends Document {
  userId: Types.ObjectId;
  azure: AzureSettings;
  cloudflare: CloudflareSettings;
  domains: DomainEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const DomainSchema = new Schema<DomainEntry>(
  {
    id: { type: String, required: true },
    domain: { type: String, required: true, trim: true },
    target: { type: String, trim: true },
  },
  { _id: false },
);

const AzureSchema = new Schema<AzureSettings>(
  {
    accountName: { type: String, trim: true },
    containerName: { type: String, trim: true },
    sasTokenEncrypted: { type: String },
  },
  { _id: false },
);

const CloudflareSchema = new Schema<CloudflareSettings>(
  {
    accountId: { type: String, trim: true },
    namespaceId: { type: String, trim: true },
    apiTokenEncrypted: { type: String },
  },
  { _id: false },
);

const DeveloperSettingsSchema = new Schema<IDeveloperSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    azure: { type: AzureSchema, default: {} },
    cloudflare: { type: CloudflareSchema, default: {} },
    domains: { type: [DomainSchema], default: [] },
  },
  { timestamps: true },
);

export const DeveloperSettings = mongoose.model<IDeveloperSettings>(
  "DeveloperSettings",
  DeveloperSettingsSchema,
);
