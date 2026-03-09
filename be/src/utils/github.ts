/**
 * GitHub API utilities for webhook automation
 */

interface CreateWebhookParams {
  repoUrl: string;
  webhookUrl: string;
  githubToken: string;
}

interface GitHubWebhookResponse {
  success: boolean;
  webhookId?: number;
  message?: string;
  error?: string;
}

/**
 * Extracts owner and repo name from GitHub URL
 * Supports: https://github.com/owner/repo or https://github.com/owner/repo.git
 */
function parseGitHubUrl(repoUrl: string): {
  owner: string;
  repo: string;
} | null {
  try {
    // Remove .git suffix if present
    const cleanUrl = repoUrl.replace(/\.git$/, "");

    // Match github.com URLs
    const match = cleanUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+)/);

    if (!match || !match[1] || !match[2]) {
      console.error("Invalid GitHub URL format:", repoUrl);
      return null;
    }

    const owner = match[1];
    const repo = match[2];

    return { owner, repo };
  } catch (error) {
    console.error("Error parsing GitHub URL:", error);
    return null;
  }
}

/**
 * Creates a GitHub webhook automatically using the GitHub API
 * Requires a GitHub Personal Access Token with 'admin:repo_hook' or 'repo' permissions
 */
export async function createGitHubWebhook({
  repoUrl,
  webhookUrl,
  githubToken,
}: CreateWebhookParams): Promise<GitHubWebhookResponse> {
  try {
    // Parse GitHub URL to get owner and repo
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return {
        success: false,
        error: "Invalid GitHub repository URL",
      };
    }

    const { owner, repo } = parsed;

    console.log(`🔧 Creating webhook for ${owner}/${repo}...`);

    // GitHub API endpoint to create webhooks
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/hooks`;

    // Webhook configuration
    const webhookConfig = {
      name: "web",
      active: true,
      events: ["push"], // Only trigger on push events
      config: {
        url: webhookUrl,
        content_type: "json",
        insecure_ssl: "0", // Require SSL
      },
    };

    // Make API request to GitHub
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookConfig),
    });

    const responseData = (await response.json()) as any;

    if (!response.ok) {
      // Handle specific GitHub API errors
      if (response.status === 401) {
        return {
          success: false,
          error: "Invalid GitHub token or insufficient permissions",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          error: "Repository not found or no access",
        };
      } else if (response.status === 422) {
        // Webhook might already exist
        if (responseData?.errors?.[0]?.message?.includes("already exists")) {
          console.log(`⚠️  Webhook already exists for ${owner}/${repo}`);
          return {
            success: true,
            message: "Webhook already exists (skipped creation)",
          };
        }
        return {
          success: false,
          error: `Validation error: ${responseData?.message || "Unknown error"}`,
        };
      }

      return {
        success: false,
        error: `GitHub API error: ${responseData?.message || response.statusText}`,
      };
    }

    console.log(`✅ Webhook created successfully (ID: ${responseData?.id})`);

    return {
      success: true,
      webhookId: responseData?.id,
      message: "Webhook created successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error creating GitHub webhook:", errorMessage);
    return {
      success: false,
      error: `Failed to create webhook: ${errorMessage}`,
    };
  }
}

/**
 * Validates if a GitHub token has the required permissions
 */
export async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error validating GitHub token:", error);
    return false;
  }
}
