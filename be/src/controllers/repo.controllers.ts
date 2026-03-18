import type { Response } from "express";
import type { AuthRequest } from "../utils/jwt.js";
import { User } from "../models/User.js";
import { Deployment } from "../models/Deployment.js";
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

type HeatmapSeries = { label: string; values: number[] };
const HEATMAP_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildMonthBuckets(months: number) {
  const now = new Date();
  const buckets = [] as { label: string; start: Date }[];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    const label = date.toLocaleString("en", { month: "short" });
    buckets.push({
      label,
      start: date,
    });
  }

  return buckets;
}

function getMonthIndex(date: Date, buckets: { label: string; start: Date }[]) {
  if (!buckets.length) return -1;

  for (let i = 0; i < buckets.length; i++) {
    const bucket = buckets[i];
    if (!bucket) continue;
    const next = new Date(
      Date.UTC(
        bucket.start.getUTCFullYear(),
        bucket.start.getUTCMonth() + 1,
        1,
      ),
    );
    if (date >= bucket.start && date < next) return i;
  }
  return -1;
}

/**
 * Build a weekday x month heatmap of user activities (deployments & redeploys)
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

    const MONTHS = 12;
    const buckets = buildMonthBuckets(MONTHS);
    const series: HeatmapSeries[] = HEATMAP_WEEKDAYS.map((label) => ({
      label,
      values: Array(MONTHS).fill(0),
    }));

    const deployments = await Deployment.find({ userId: req.user.userId })
      .select("createdAt updatedAt lastDeployedAt")
      .lean();

    const seen = new Set<string>();

    for (const deployment of deployments) {
      const candidates = [
        deployment.createdAt,
        deployment.updatedAt,
        deployment.lastDeployedAt,
      ].filter(Boolean) as Date[];

      for (const ts of candidates) {
        const isoDayKey = ts.toISOString().slice(0, 10);
        const deploymentId =
          typeof deployment._id?.toString === "function"
            ? deployment._id.toString()
            : "na";
        const dedupeKey = `${isoDayKey}-${deploymentId}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const monthIndex = getMonthIndex(ts, buckets);
        if (monthIndex === -1) continue;

        const weekdayIndex = (ts.getUTCDay() + 6) % 7; // Monday=0
        const row = series[weekdayIndex];
        if (!row || !row.values?.[monthIndex]) {
          if (!row?.values) continue;
          row.values[monthIndex] = (row.values[monthIndex] ?? 0) + 1;
          continue;
        }
        row.values[monthIndex] += 1;
      }
    }

    return res.status(200).json({
      success: true,
      data: series,
      monthLabels: buckets.map((b) => b.label),
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
