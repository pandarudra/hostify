# Auto-Redeploy Setup Guide

This guide covers **manual webhook setup**. If you want automatic webhook creation (recommended), see **[AUTOMATED_WEBHOOK_SETUP.md](./AUTOMATED_WEBHOOK_SETUP.md)** instead.

---

## Overview

When you push code to GitHub, a webhook triggers automatic redeployment of your project. The system uses **token-based authentication** where each deployed project gets a unique webhook URL:

1. ✅ Each project gets a unique webhook token during deployment
2. ✅ Token is verified for security (no shared secrets needed)
3. ✅ Webhook redeploys only the specific project
4. ✅ Updates deployment timestamps
5. ✅ Returns detailed deployment status

## Two Setup Options

### 🚀 Option 1: Automatic (Recommended)

Provide a GitHub Personal Access Token during deployment, and the webhook is created automatically.

**See**: [AUTOMATED_WEBHOOK_SETUP.md](./AUTOMATED_WEBHOOK_SETUP.md)

### 📝 Option 2: Manual (This Guide)

Add the webhook URL to GitHub yourself. Useful if you prefer not to provide a GitHub token.

**Continue reading below** ↓

---

## Prerequisites

- GitHub repository with your code
- Cloudflare KV namespace set up
- Your Hostify backend running and accessible from the internet

## Step 1: Configure Environment Variables

Add the following to your `.env` file:

```env
# Existing variables
PORT=8000
ENV=production # or development
UPLOAD_DIR=local

# Azure Storage (for production)
AZURE_STORAGE_ACCOUNT_NAME=your_account_name
AZURE_STORAGE_CONTAINER_NAME=your_container_name
AZURE_STORAGE_SAS_TOKEN=your_sas_token

# Cloudflare KV (required)
CF_ACCOUNT_ID=your_cloudflare_account_id
CF_KV_NAMESPACE_ID=your_kv_namespace_id
CF_API_TOKEN=your_cloudflare_api_token
```

**Note**: `GITHUB_WEBHOOK_SECRET` is no longer needed! Each project now has its own unique webhook token.

## Step 2: Expose Your Backend to the Internet

For webhooks to work, GitHub needs to reach your backend. Options:

### Option A: Production Deployment

Deploy your backend to a cloud provider (Azure, AWS, etc.) with a public URL.

### Option B: Development with ngrok

1. Install ngrok: `npm install -g ngrok`
2. Start your backend: `npm start`
3. In another terminal: `ngrok http 8000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Option C: Development with VS Code Tunnels

1. Install VS Code Remote Tunnels extension
2. Forward port 8000
3. Use the generated public URL

## Step 3: Configure GitHub Webhook

### Get Your Webhook URL

When you deploy a project, you'll receive a unique webhook URL in the response:

```json
{
  "success": true,
  "message": "Deployment successful",
  "blobPath": {
    "folderName": "repo-abc123",
    "subdomain": "my-app",
    "url": "https://my-app.rudrax.me",
    "webhookToken": "a1b2c3d4e5f6...",
    "webhookUrl": "https://your-domain.com/api/git/webhook/a1b2c3d4e5f6..."
  }
}
```

### Add Webhook to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure the webhook:
   - **Payload URL**: Use the `webhookUrl` from your deployment response
     - Example: `https://your-domain.com/api/git/webhook/a1b2c3d4e5f6...`
   - **Content type**: `application/json`
   - **Secret**: Leave this blank (not needed with token-based auth)
   - **Which events**: Select "Just the push event"
   - **Active**: ✅ Check this box
4. Click **Add webhook**

### Security Benefits

- ✅ **Unique per project**: Each project has its own token
- ✅ **No shared secrets**: Can't accidentally trigger other projects
- ✅ **Easy revocation**: Delete project to revoke webhook access
- ✅ **URL-based auth**: Token is in the URL, no signature computation needed

## Step 4: Test the Setup

### Initial Deployment

First, deploy a project the normal way:

```bash
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/repo",
    "subdomain": "my-app"
  }'
```

This creates the subdomain mapping in Cloudflare KV.

### Test Auto-Redeploy

1. Make a change to your GitHub repository
2. Commit and push:
   ```bash
   git add .
   git commit -m "test auto-redeploy"
   git push
   ```
3. Check your backend logs - you should see:

   ```
   📥 GitHub webhook received: push
   ✅ Authenticated webhook for project: my-app
   🔔 Push detected:
      Repository: https://github.com/username/repo.git
      Branch: main
      Pusher: your-username
      Commits: 1
   🚀 Triggering redeployment for project: my-app
      ✅ Successfully redeployed: https://my-app.rudrax.me
   ```

### Verify Webhook Delivery in GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Webhooks**
3. Click on your webhook
4. Scroll to **Recent Deliveries**
5. You should see successful deliveries (green checkmark)
6. Click on a delivery to see the request and response

## How It Works

### Data Storage in Cloudflare KV

When you deploy a project, four keys are stored:

1. **`subdomain`** → `folderName` (e.g., `my-app` → `repo-abc123`)
2. **`metadata:subdomain`** → Full project metadata JSON:
   ```json
   {
     "subdomain": "my-app",
     "folderName": "repo-abc123",
     "repoUrl": "https://github.com/username/repo.git",
     "createdAt": "2026-03-08T10:00:00.000Z",
     "lastDeployedAt": "2026-03-08T10:00:00.000Z",
     "webhookToken": "a1b2c3d4e5f6..."
   }
   ```
3. **`repo:{repoUrl}`** → Array of subdomains using this repo:
   ```json
   ["my-app", "my-app-staging", "my-app-dev"]
   ```
4. **`webhook-token:{token}`** → Subdomain for fast lookup:
   ```
   "my-app"
   ```

### Webhook Flow

```
GitHub Push
    ↓
Webhook triggered with unique URL
    ↓
Extract token from URL
    ↓
Lookup project by token (from Cloudflare KV)
    ↓
Verify repository matches
    ↓
Redeploy project:
    ├── Clone repository
    ├── Upload to Azure Storage
    ├── Update Cloudflare KV metadata
    └── Return deployment status
    ↓
Send response to GitHub
```

### Security

- **Token-Based Auth**: Each project has a unique 64-character hex token
- **URL Isolation**: Tokens are cryptographically random (256-bit entropy)
- **No Shared Secrets**: Can't accidentally trigger other users' deployments
- **Repository Verification**: Webhook must match the project's configured repo
- **HTTPS Required**: Webhooks only work over HTTPS in production

## Multiple Projects from Same Repo

You can deploy the same repository multiple times with different subdomains. **Each deployment gets its own unique webhook URL**:

```bash
# Production
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/repo",
    "subdomain": "my-app"
  }'
# Returns: webhookUrl: https://your-domain.com/api/git/webhook/token1...

# Staging
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/repo",
    "subdomain": "my-app-staging"
  }'
# Returns: webhookUrl: https://your-domain.com/api/git/webhook/token2...
```

### Setting Up Multiple Webhooks

You can add multiple webhooks to the same GitHub repository, each triggering a different deployment:

1. Add webhook for production (use token1 URL)
2. Add webhook for staging (use token2 URL)
3. Both webhooks trigger on push, but deploy to different subdomains

**Tip**: Use GitHub's webhook filtering to trigger different environments based on branch:

- Production webhook: Only trigger on `main` branch
- Staging webhook: Only trigger on `develop` branch
  curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
   -H "Content-Type: application/json" \
   -d '{
  "ghlink": "https://github.com/username/repo",
  "subdomain": "my-app-staging"
  }'

# Development

curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
 -H "Content-Type: application/json" \
 -d '{
"ghlink": "https://github.com/username/repo",
"subdomain": "my-app-dev"
}'

````

When you push to GitHub, **all three projects will redeploy automatically**.

## Webhook Response Format

```json
{
  "success": true,
  "message": "Auto-redeploy triggered",
  "repoUrl": "https://github.com/username/repo.git",
  "branch": "main",
  "pusher": "your-username",
  "commits": 3,
  "results": [
    {
      "subdomain": "my-app",
      "success": true,
      "url": "https://my-app.rudrax.me",
      "folderName": "repo-abc123"
    },
    {
      "subdomain": "my-app-staging",
      "success": true,
      "url": "https://my-app-staging.rudrax.me",
      "folderName": "repo-def456"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
````

## Troubleshooting

### Webhook Not Triggering

1. **Check GitHub webhook status**:
   - Go to repo **Settings** → **Webhooks**
   - Check "Recent Deliveries" for errors

2. **Verify your endpoint is accessible**:

   ```bash
   curl https://your-domain.com/int/api/v1/webhook/gh
   ```

3. **Check backend logs** for any errors

### Signature Verification Failing

1. Ensure `GITHUB_WEBHOOK_SECRET` matches in:
   - Your `.env` file
   - GitHub webhook settings

2. Restart your backend after changing the secret

### No Projects Found for Repository

1. Verify the project was deployed first using the deploy endpoint
2. Check Cloudflare KV for the repo mapping:
   ```bash
   # Key should be: repo:https://github.com/username/repo.git
   ```

### Deployment Fails But Webhook Succeeds

- Check Azure Storage credentials
- Verify Cloudflare KV permissions
- Check disk space for cloning repositories

## API Endpoints

### Deploy New Project

```
POST /api/v1/deploy
Content-Type: application/json

{
  "ghlink": "https://github.com/username/repo",
  "subdomain": "my-app"  // optional
}
```

### GitHub Webhook (Internal)

```
POST /int/api/v1/webhook/gh
X-GitHub-Event: push
X-Hub-Signature-256: sha256=...
Content-Type: application/json

{
  "repository": { "clone_url": "..." },
  "ref": "refs/heads/main",
  "pusher": { "name": "..." },
  "commits": [...]
}
```

## Best Practices

1. **Use webhook secrets** in production for security
2. **Monitor deployment logs** to catch failures early
3. **Set up branch filters** if you only want to deploy specific branches
4. **Use different subdomains** for different environments
5. **Test webhooks** in development with ngrok before going to production

## Next Steps

- Add branch-specific deployments
- Implement deployment rollback
- Add notification system (email, Slack, Discord)
- Create deployment history dashboard
- Add preview deployments for pull requests

---

Need help? Check the logs or open an issue on GitHub!
