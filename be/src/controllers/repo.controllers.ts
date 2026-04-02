import type { Response } from "express";
import type { AuthRequest } from "../utils/jwt.js";
import { User } from "../models/User.js";
import { Deployment } from "../models/Deployment.js";
import { Heatmap } from "../models/Heatmap.js";
import { isDBConnected } from "../config/database.js";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  description: string | null;
  default_branch: string;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
  owner: {
    login: string;
    avatar_url: string;
  };
}

/**
 * List all repositories user has access to
 */
export const listRepositories = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }

    // Get user with access token
    const user = await User.findById(req.user.userId).select("+accessToken");

    if (!user || !user.accessToken) {
      return res.status(404).json({
        success: false,
        message: "User not found or no access token",
      });
    }

    // Fetch repositories from GitHub API
    const response = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated",
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "Failed to fetch repositories from GitHub",
      });
    }

    const repos = (await response.json()) as GitHubRepo[];

    // Get user's deployments to mark which repos are already deployed
    const deployments = await Deployment.find({
      userId: user._id,
      status: "active",
    });
    const deployedRepoUrls = new Set(deployments.map((d: any) => d.repoUrl));

    // Format response
    const formattedRepos = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      isPrivate: repo.private,
      description: repo.description,
      htmlUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      defaultBranch: repo.default_branch,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
      isDeployed: deployedRepoUrls.has(repo.clone_url),
    }));

    return res.status(200).json({
      success: true,
      count: formattedRepos.length,
      repositories: formattedRepos,
    });
  } catch (error) {
    console.error("List repositories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to list repositories",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get user's deployments
 */
export const listDeployments = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }

    const deployments = await Deployment.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: deployments.length,
      deployments: deployments.map((d: any) => ({
        id: d._id,
        subdomain: d.subdomain,
        repoName: d.repoName,
        repoOwner: d.repoOwner,
        repoUrl: d.repoUrl,
        branch: d.branch,
        status: d.status,
        deploymentUrl: d.deploymentUrl,
        webhookUrl: `${process.env.PROD_DEPLOYMENT_URL || "http://localhost:8000"}/api/git/webhook/${d.webhookToken}`,
        createdAt: d.createdAt,
        lastDeployedAt: d.lastDeployedAt,
      })),
    });
  } catch (error) {
    console.error("List deployments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to list deployments",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get single deployment details
 */
export const getDeployment = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Deployment ID is required",
      });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }

    const deployment = await Deployment.findOne({
      _id: id as string,
      userId: req.user.userId,
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: "Deployment not found",
      });
    }

    return res.status(200).json({
      success: true,
      deployment: {
        id: deployment._id,
        subdomain: deployment.subdomain,
        repoName: deployment.repoName,
        repoOwner: deployment.repoOwner,
        repoUrl: deployment.repoUrl,
        branch: deployment.branch,
        status: deployment.status,
        deploymentUrl: deployment.deploymentUrl,
        webhookUrl: `${process.env.PROD_DEPLOYMENT_URL || "http://localhost:8000"}/api/git/webhook/${deployment.webhookToken}`,
        webhookId: deployment.webhookId,
        createdAt: deployment.createdAt,
        lastDeployedAt: deployment.lastDeployedAt,
      },
    });
  } catch (error) {
    console.error("Get deployment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get deployment",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Delete a deployment
 */
export const deleteDeployment = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Deployment ID is required",
      });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }

    const deployment = await Deployment.findOneAndDelete({
      _id: id as string,
      userId: req.user.userId,
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: "Deployment not found",
      });
    }

    // TODO: Optionally delete webhook from GitHub and clean up Azure storage

    return res.status(200).json({
      success: true,
      message: "Deployment deleted successfully",
    });
  } catch (error) {
    console.error("Delete deployment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete deployment",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function getUtcWeekStartSunday(date: Date): Date {
  const dayStart = toUtcDayStart(date);
  const shift = dayStart.getUTCDay();
  return new Date(dayStart.getTime() - shift * DAY_MS);
}

/**
 * Build a weekday x week heatmap from persisted activity records
 */
export const getActivityHeatmap = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (!isDBConnected()) {
      return res
        .status(503)
        .json({ success: false, message: "Database not connected" });
    }

    const WEEKS = 53;
    const today = toUtcDayStart(new Date());
    const startRange = getUtcWeekStartSunday(
      new Date(today.getTime() - (WEEKS - 1) * 7 * DAY_MS),
    );
    const endRange = new Date(startRange.getTime() + WEEKS * 7 * DAY_MS);

    const records = await Heatmap.find({
      userId: req.user.userId,
      date: { $gte: startRange, $lt: endRange },
    })
      .select("date count")
      .lean();

    const countsByDay = new Map<string, number>();

    for (const record of records) {
      const ts =
        record.date instanceof Date ? record.date : new Date(record.date);
      if (Number.isNaN(ts.getTime())) continue;

      const day = toUtcDayStart(ts);
      const safeCount = typeof record.count === "number" ? record.count : 0;
      const isoKey = day.toISOString();
      countsByDay.set(
        isoKey,
        (countsByDay.get(isoKey) ?? 0) + Math.max(0, safeCount),
      );
    }

    const data = Array.from(countsByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get activity heatmap error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to build activity heatmap",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Backfill historical activity into Heatmap collection.
 * Idempotent: inserts only missing day buckets and does not mutate existing rows.
 */
export const backfillActivityHeatmap = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (!isDBConnected()) {
      return res
        .status(503)
        .json({ success: false, message: "Database not connected" });
    }

    const deployments = await Deployment.find({ userId: req.user.userId })
      .select("createdAt lastDeployedAt")
      .lean();

    const user = await User.findById(req.user.userId)
      .select("lastLoginAt")
      .lean();

    const countsByDay = new Map<string, number>();
    const seen = new Set<string>();

    const bump = (ts: Date, key: string) => {
      const day = toUtcDayStart(ts);
      if (Number.isNaN(day.getTime())) return;
      const dayKey = day.toISOString().slice(0, 10);
      const dedupeKey = `${dayKey}-${key}`;
      if (seen.has(dedupeKey)) return;

      seen.add(dedupeKey);
      countsByDay.set(dayKey, (countsByDay.get(dayKey) ?? 0) + 1);
    };

    for (const deployment of deployments) {
      const deploymentId = deployment._id?.toString?.() ?? "na";
      const candidates = [
        deployment.createdAt,
        deployment.lastDeployedAt,
      ].filter(Boolean) as Date[];

      for (const ts of candidates) {
        bump(ts, `deploy-${deploymentId}`);
      }
    }

    if (user?.lastLoginAt) {
      bump(user.lastLoginAt, "last-login");
    }

    if (!countsByDay.size) {
      return res.status(200).json({
        success: true,
        message: "No historical activity found to backfill",
        inserted: 0,
        skipped: 0,
      });
    }

    const dayDates = Array.from(countsByDay.keys()).map(
      (dayKey) => new Date(`${dayKey}T00:00:00.000Z`),
    );

    const existingRows = await Heatmap.find({
      userId: req.user.userId,
      date: { $in: dayDates },
    })
      .select("date")
      .lean();

    const existingDayKeys = new Set(
      existingRows
        .map((row) =>
          (row.date instanceof Date ? row.date : new Date(row.date))
            .toISOString()
            .slice(0, 10),
        )
        .filter(Boolean),
    );

    const docsToInsert: Array<{ userId: string; date: Date; count: number }> =
      [];

    for (const [dayKey, count] of countsByDay.entries()) {
      if (existingDayKeys.has(dayKey)) continue;
      docsToInsert.push({
        userId: req.user.userId,
        date: new Date(`${dayKey}T00:00:00.000Z`),
        count,
      });
    }

    if (docsToInsert.length) {
      await Heatmap.insertMany(docsToInsert, { ordered: false });
    }

    return res.status(200).json({
      success: true,
      message: "Heatmap backfill completed",
      inserted: docsToInsert.length,
      skipped: countsByDay.size - docsToInsert.length,
    });
  } catch (error) {
    console.error("Backfill activity heatmap error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to backfill activity heatmap",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
