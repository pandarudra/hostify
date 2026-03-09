# Automated Webhook Setup Guide

This guide explains how to automatically create GitHub webhooks during deployment, eliminating manual configuration.

## Overview

Instead of manually adding webhook URLs to GitHub, you can provide a **GitHub Personal Access Token (PAT)** during deployment. The system will automatically:

1. ✅ Create the webhook in your GitHub repository
2. ✅ Configure it to trigger on push events
3. ✅ Set the correct webhook URL with your unique token
4. ✅ Handle errors gracefully with clear messages

## Quick Start

### Step 1: Generate GitHub Personal Access Token

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Give it a descriptive name: `Hostify Webhook Automation`
4. Set expiration (recommended: 90 days or custom)
5. Select scopes:
   - ✅ **`admin:repo_hook`** (for webhook management)
   - ✅ **`repo`** (full repo access) - OR just **`public_repo`** for public repos
6. Click **Generate token**
7. **Copy the token immediately** (you won't see it again!)

### Step 2: Deploy with Automatic Webhook

Include the `githubToken` in your deployment request:

```bash
curl -X POST https://your-domain.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/my-repo",
    "subdomain": "my-app",
    "githubToken": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }'
```

### Step 3: Check Response

**Success response:**

```json
{
  "success": true,
  "message": "Deployment successful",
  "data": {
    "subdomain": "my-app",
    "url": "https://my-app.rudrax.me",
    "webhookUrl": "https://your-domain.com/api/git/webhook/abc123...",
    "webhookAutoCreated": true
  },
  "webhookInfo": {
    "autoCreated": true,
    "url": "https://your-domain.com/api/git/webhook/abc123...",
    "instruction": "✅ Webhook automatically created in your GitHub repository"
  }
}
```

That's it! Your webhook is now active. Push to your repo to test auto-redeployment.

## Deployment Options

### Option 1: Automatic (Recommended)

**With GitHub token** - Webhook is created automatically:

```bash
curl -X POST https://your-domain.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/repo",
    "subdomain": "my-app",
    "githubToken": "ghp_your_token_here"
  }'
```

✅ **Pros:**

- Zero manual configuration
- Instant setup
- No GitHub UI needed

⚠️ **Considerations:**

- Requires GitHub PAT
- Token needs proper permissions
- Must be sent securely (HTTPS only)

### Option 2: Manual

**Without GitHub token** - You add the webhook yourself:

```bash
curl -X POST https://your-domain.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/repo",
    "subdomain": "my-app"
  }'
```

Response includes webhook URL to add manually:

```json
{
  "webhookInfo": {
    "autoCreated": false,
    "url": "https://your-domain.com/api/git/webhook/abc123...",
    "instruction": "ℹ️ Add 'githubToken' to your request to automatically create the webhook"
  }
}
```

Then follow instructions in [AUTO_REDEPLOY_SETUP.md](./AUTO_REDEPLOY_SETUP.md) to add it manually.

## Security Best Practices

### Token Storage

**DO NOT:**

- ❌ Commit tokens to version control
- ❌ Share tokens publicly
- ❌ Store tokens in client-side code
- ❌ Use tokens with more permissions than needed

**DO:**

- ✅ Use environment variables
- ✅ Send tokens over HTTPS only
- ✅ Rotate tokens regularly
- ✅ Use minimal required scopes
- ✅ Revoke tokens when not needed

### API Request Security

```javascript
// ✅ Good: Token in environment variable
const response = await fetch("https://your-domain.com/api/v1/deploy", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ghlink: "https://github.com/username/repo",
    subdomain: "my-app",
    githubToken: process.env.GITHUB_TOKEN, // From environment
  }),
});

// ❌ Bad: Token hardcoded
const BAD_TOKEN = "ghp_xxxxx"; // Never do this!
```

### Token Scopes

Minimum required permissions:

- **Public repositories**: `public_repo` + `admin:repo_hook`
- **Private repositories**: `repo` (includes webhook access)

## Troubleshooting

### Error: "Invalid GitHub token or insufficient permissions"

**Problem**: Token is invalid or lacks required permissions.

**Solution**:

1. Verify token hasn't expired
2. Check token has `admin:repo_hook` or `repo` scope
3. Generate a new token if needed

### Error: "Repository not found or no access"

**Problem**: Token doesn't have access to the repository.

**Solution**:

1. Verify repository URL is correct
2. Check token has access to the repo
3. For organization repos, ensure token has org permissions

### Error: "Webhook already exists"

**Status**: ✅ Not actually an error!

**Explanation**: A webhook with this URL already exists in the repository. The system skips creation but deployment continues successfully.

**What to do**: Nothing! Your webhook is already configured.

### Webhook created but not triggering

**Checklist**:

1. ✅ Push to the correct branch (default: any branch)
2. ✅ Check GitHub webhook delivery logs:
   - Go to repo → Settings → Webhooks
   - Click on the webhook
   - Check "Recent Deliveries"
3. ✅ Verify your backend is accessible from internet
4. ✅ Check backend logs for webhook processing

## Advanced Usage

### Using with CI/CD

Store GitHub token in CI/CD secrets:

**GitHub Actions:**

```yaml
- name: Deploy to Hostify
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    curl -X POST https://your-domain.com/api/v1/deploy \
      -H "Content-Type: application/json" \
      -d "{
        \"ghlink\": \"${{ github.repositoryUrl }}\",
        \"subdomain\": \"my-app\",
        \"githubToken\": \"$GITHUB_TOKEN\"
      }"
```

### Programmatic Deployment

```typescript
import fetch from "node-fetch";

async function deployWithAutoWebhook(
  repoUrl: string,
  subdomain: string,
  githubToken: string,
) {
  const response = await fetch("https://your-domain.com/api/v1/deploy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ghlink: repoUrl,
      subdomain: subdomain,
      githubToken: githubToken,
    }),
  });

  const result = await response.json();

  if (result.webhookInfo.autoCreated) {
    console.log("✅ Webhook created automatically!");
  } else if (result.webhookInfo.error) {
    console.log("⚠️ Manual webhook setup required");
    console.log("Add this URL:", result.webhookInfo.url);
  }

  return result;
}

// Usage
await deployWithAutoWebhook(
  "https://github.com/username/repo",
  "my-app",
  process.env.GITHUB_TOKEN!,
);
```

### Multiple Environments

Deploy to staging and production with separate webhooks:

```bash
# Staging
curl -X POST https://your-domain.com/api/v1/deploy \
  -d '{"ghlink": "...", "subdomain": "my-app-staging", "githubToken": "..."}'

# Production
curl -X POST https://your-domain.com/api/v1/deploy \
  -d '{"ghlink": "...", "subdomain": "my-app", "githubToken": "..."}'
```

Each gets its own webhook. Both trigger on push, deploying to their respective environments.

## Comparison: Auto vs Manual

| Feature                     | Automatic         | Manual          |
| --------------------------- | ----------------- | --------------- |
| **Setup Time**              | Instant           | ~2 minutes      |
| **Requires GitHub PAT**     | Yes               | No              |
| **User-friendly**           | Very              | Moderate        |
| **Security considerations** | Token handling    | None            |
| **Best for**                | CI/CD, automation | One-time setups |
| **Error prone**             | Low               | Medium          |

## FAQ

**Q: Is my GitHub token stored?**  
A: No, the token is only used during deployment to create the webhook, then discarded.

**Q: Can I use fine-grained tokens?**  
A: Yes! Fine-grained tokens work if they have webhook permissions for the repository.

**Q: What if I don't want to provide a token?**  
A: No problem! Simply omit `githubToken` from the request and add the webhook manually using the returned URL.

**Q: Can I update an existing webhook?**  
A: Currently, if a webhook exists, creation is skipped. Delete the old webhook in GitHub first if you need to recreate it.

**Q: Does this work with GitHub Enterprise?**  
A: Yes, as long as the GitHub API endpoint is accessible from your Hostify backend.

## Next Steps

- See [AUTO_REDEPLOY_SETUP.md](./AUTO_REDEPLOY_SETUP.md) for manual webhook setup
- Check [TESTING_GUIDE.md](./TESTING_GUIDE.md) for testing webhooks
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system architecture
