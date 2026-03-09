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
