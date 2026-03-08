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
