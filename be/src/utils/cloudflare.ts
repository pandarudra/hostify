import {
  CF_ACCOUNT_ID,
  CF_API_TOKEN,
  CF_KV_NAMESPACE_ID,
  isProd,
} from "../constants/e.js";

// Check if Cloudflare credentials are configured
export function isCloudflareConfigured(): boolean {
  return !!(CF_ACCOUNT_ID && CF_API_TOKEN && CF_KV_NAMESPACE_ID);
}

export async function saveSubdomain(
  subdomain: string,
  folder: string,
): Promise<boolean> {
  // Skip if credentials not configured
  if (!isCloudflareConfigured()) {
    if (isProd) {
      throw new Error(
        "Cloudflare credentials not configured. Required for production.",
      );
    }
    console.warn(
      "⚠️  Cloudflare KV credentials not configured. Skipping subdomain storage.",
    );
    return false;
  }

  const accountId = CF_ACCOUNT_ID;
  const namespaceId = CF_KV_NAMESPACE_ID;
  const token = CF_API_TOKEN;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${subdomain}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "text/plain",
        },
        body: folder,
      },
    );

    if (!response.ok) {
      const error = await response.text();
      const errorMessage = `Failed to save subdomain to Cloudflare KV: ${error}`;

      if (isProd) {
        throw new Error(errorMessage);
      } else {
        console.warn(`⚠️  ${errorMessage}`);
        return false;
      }
    }

    console.log(
      `✓ Subdomain '${subdomain}' saved to Cloudflare KV, mapped to folder '${folder}'`,
    );
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (isProd) {
      throw error;
    } else {
      console.warn(`⚠️  Cloudflare KV error (non-blocking): ${errorMessage}`);
      return false;
    }
  }
}

export async function getSubdomain(subdomain: string): Promise<string | null> {
  // Skip if credentials not configured
  if (!isCloudflareConfigured()) {
    console.warn(
      "⚠️  Cloudflare KV credentials not configured. Cannot retrieve subdomain.",
    );
    return null;
  }

  const accountId = CF_ACCOUNT_ID;
  const namespaceId = CF_KV_NAMESPACE_ID;
  const token = CF_API_TOKEN;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${subdomain}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to retrieve subdomain from Cloudflare KV: ${error}`,
      );
    }

    return await response.text();
  } catch (error) {
    console.error("Error retrieving subdomain from Cloudflare KV:", error);
    return null;
  }
}

// Interface for project metadata stored in KV
export interface ProjectMetadata {
  subdomain: string;
  folderName: string;
  repoUrl: string;
  branch?: string;
  createdAt: string;
  lastDeployedAt: string;
  webhookToken?: string; // Unique token for webhook authentication
}

/**
 * Save complete project metadata to Cloudflare KV
 * Stores both subdomain -> folderName and metadata -> ProjectMetadata
 */
export async function saveProjectMetadata(
  metadata: ProjectMetadata,
): Promise<boolean> {
  if (!isCloudflareConfigured()) {
    if (isProd) {
      throw new Error(
        "Cloudflare credentials not configured. Required for production.",
      );
    }
    console.warn(
      "⚠️  Cloudflare KV credentials not configured. Skipping metadata storage.",
    );
    return false;
  }

  const accountId = CF_ACCOUNT_ID;
  const namespaceId = CF_KV_NAMESPACE_ID;
  const token = CF_API_TOKEN;

  try {
    // Store subdomain -> folderName mapping (for backward compatibility)
    await saveSubdomain(metadata.subdomain, metadata.folderName);

    // Store metadata with key: metadata:{subdomain}
    const metadataKey = `metadata:${metadata.subdomain}`;
    const metadataResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${metadataKey}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      },
    );

    if (!metadataResponse.ok) {
      const error = await metadataResponse.text();
      throw new Error(`Failed to save project metadata: ${error}`);
    }

    // Store repo URL -> subdomain mapping for webhook lookups
    // Key: repo:{repoUrl} Value: array of subdomains
    const repoKey = `repo:${encodeURIComponent(metadata.repoUrl)}`;
    const existingRepoData = await getKVValue(repoKey);
    let subdomains: string[] = [];

    if (existingRepoData) {
      try {
        subdomains = JSON.parse(existingRepoData);
      } catch {
        subdomains = [];
      }
    }

    if (!subdomains.includes(metadata.subdomain)) {
      subdomains.push(metadata.subdomain);

      const repoResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${repoKey}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subdomains),
        },
      );

      if (!repoResponse.ok) {
        console.warn("⚠️  Failed to save repo mapping, but continuing...");
      }
    }

    console.log(
      `✓ Project metadata saved for subdomain '${metadata.subdomain}'`,
    );
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (isProd) {
      throw error;
    } else {
      console.warn(`⚠️  Cloudflare KV error (non-blocking): ${errorMessage}`);
      return false;
    }
  }
}

/**
 * Get project metadata by subdomain
 */
export async function getProjectMetadata(
  subdomain: string,
): Promise<ProjectMetadata | null> {
  if (!isCloudflareConfigured()) {
    console.warn("⚠️  Cloudflare KV credentials not configured.");
    return null;
  }

  const metadataKey = `metadata:${subdomain}`;
  const data = await getKVValue(metadataKey);

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data) as ProjectMetadata;
  } catch (error) {
    console.error("Error parsing project metadata:", error);
    return null;
  }
}

/**
 * Get all subdomains associated with a repository URL
 */
export async function getSubdomainsByRepo(repoUrl: string): Promise<string[]> {
  if (!isCloudflareConfigured()) {
    console.warn("⚠️  Cloudflare KV credentials not configured.");
    return [];
  }

  const repoKey = `repo:${encodeURIComponent(repoUrl)}`;
  const data = await getKVValue(repoKey);

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data) as string[];
  } catch (error) {
    console.error("Error parsing repo subdomains:", error);
    return [];
  }
}

/**
 * Get project metadata by webhook token
 */
export async function getProjectByWebhookToken(
  token: string,
): Promise<ProjectMetadata | null> {
  if (!isCloudflareConfigured()) {
    console.warn("⚠️  Cloudflare KV credentials not configured.");
    return null;
  }

  const tokenKey = `webhook-token:${token}`;
  const data = await getKVValue(tokenKey);

  if (!data) {
    return null;
  }

  try {
    // The token key stores the subdomain, fetch full metadata
    const subdomain = data;
    return await getProjectMetadata(subdomain);
  } catch (error) {
    console.error("Error retrieving project by webhook token:", error);
    return null;
  }
}

/**
 * Save webhook token mapping to KV
 * Stores token -> subdomain for quick lookup
 */
export async function saveWebhookToken(
  token: string,
  subdomain: string,
): Promise<boolean> {
  if (!isCloudflareConfigured()) {
    if (isProd) {
      throw new Error(
        "Cloudflare credentials not configured. Required for production.",
      );
    }
    console.warn(
      "⚠️  Cloudflare KV credentials not configured. Skipping webhook token storage.",
    );
    return false;
  }

  const accountId = CF_ACCOUNT_ID;
  const namespaceId = CF_KV_NAMESPACE_ID;
  const apiToken = CF_API_TOKEN;

  try {
    const tokenKey = `webhook-token:${token}`;
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${tokenKey}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "text/plain",
        },
        body: subdomain,
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save webhook token: ${error}`);
    }

    console.log(`✓ Webhook token saved for subdomain '${subdomain}'`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (isProd) {
      throw error;
    } else {
      console.warn(`⚠️  Cloudflare KV error (non-blocking): ${errorMessage}`);
      return false;
    }
  }
}

/**
 * Helper function to get a value from Cloudflare KV
 */
async function getKVValue(key: string): Promise<string | null> {
  const accountId = CF_ACCOUNT_ID;
  const namespaceId = CF_KV_NAMESPACE_ID;
  const token = CF_API_TOKEN;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`Error retrieving KV value for key '${key}':`, error);
    return null;
  }
}
