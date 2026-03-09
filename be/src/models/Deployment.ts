import mongoose, { Document, Schema, Types } from "mongoose";

// Deployment document interface
export interface IDeployment extends Document {
  userId: Types.ObjectId;
  subdomain: string;
  repoUrl: string;
  repoName: string;
  repoOwner: string;
  branch: string;
  folderName: string;
  webhookToken: string;
  webhookId?: number; // GitHub webhook ID
  status: "active" | "inactive" | "failed";
  deploymentUrl: string;
  createdAt: Date;
  updatedAt: Date;
  lastDeployedAt: Date;
}

// Deployment schema
const DeploymentSchema = new Schema<IDeployment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subdomain: {
      type: String,
      required: true,
      unique: true,
    },
    repoUrl: {
      type: String,
      required: true,
    },
    repoName: {
      type: String,
      required: true,
    },
    repoOwner: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      default: "main",
    },
    folderName: {
      type: String,
      required: true,
    },
    webhookToken: {
      type: String,
      required: true,
      unique: true,
    },
    webhookId: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "failed"],
      default: "active",
    },
    deploymentUrl: {
      type: String,
      required: true,
    },
    lastDeployedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
DeploymentSchema.index({ userId: 1, createdAt: -1 });
DeploymentSchema.index({ repoUrl: 1 });

export const Deployment = mongoose.model<IDeployment>(
  "Deployment",
  DeploymentSchema,
);
