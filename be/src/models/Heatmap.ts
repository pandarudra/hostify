import mongoose, { Document, Schema, Types } from "mongoose";

export interface IHeatmap extends Document {
  userId: Types.ObjectId;
  date: Date;
  count: number;
}

const HeatmapSchema = new Schema<IHeatmap>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// One row per user per UTC day to keep upserts deterministic.
HeatmapSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Heatmap = mongoose.model<IHeatmap>("Heatmap", HeatmapSchema);
