import { Types } from "mongoose";
import { Heatmap } from "../models/Heatmap.js";

function toUtcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export async function incrementUserHeatmap(
  userId: string | Types.ObjectId,
  date: Date = new Date(),
): Promise<void> {
  const day = toUtcDayStart(date);

  await Heatmap.updateOne(
    { userId, date: day },
    {
      $setOnInsert: { userId, date: day },
      $inc: { count: 1 },
    },
    { upsert: true },
  );
}
