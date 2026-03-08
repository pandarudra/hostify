# Auto-Redeploy Feature - Implementation Summary

## What Was Implemented

I've successfully implemented an auto-redeploy feature for your Hostify platform, similar to Vercel and Netlify. Here's what was added:

### 1. Enhanced Cloudflare KV Storage

**File**: `be/src/utils/cloudflare.ts`

Added three new functions:

- `saveProjectMetadata()` - Stores complete project info (subdomain, folder, repo URL, timestamps)
- `getProjectMetadata()` - Retrieves project info by subdomain
- `getSubdomainsByRepo()` - Gets all subdomains for a given repository

Now stores three types of data in Cloudflare KV:

- `subdomain` → `folderName` (e.g., "my-app" → "repo-abc123")
- `metadata:subdomain` → Full project metadata JSON
- `repo:repoUrl` → Array of subdomains using that repo

### 2. Updated Deploy Flow

**File**: `be/src/helpers/upload.ts`

Modified `uploadtoServer()` to:

- Save complete project metadata on every deployment
- Store repository URL for webhook lookups
- Track creation and deployment timestamps

### 3. Secure Webhook Handler

**File**: `be/src/controllers/git.controllers.ts`

Completely rewrote the `githubWebhook()` function with:

- ✅ GitHub signature verification (HMAC SHA-256)
- ✅ Event filtering (only process "push" events)
- ✅ Repository lookup via Cloudflare KV
- ✅ Multi-project redeployment
- ✅ Detailed logging and error handling
- ✅ Comprehensive response with deployment status

### 4. Environment Configuration

**File**: `be/src/constants/e.ts`

Added:

- `GITHUB_WEBHOOK_SECRET` for signature verification

### 5. Documentation

Created three comprehensive documents:

- **AUTO_REDEPLOY_SETUP.md** - Complete setup guide with troubleshooting
- **.env.example** - Example environment configuration
- **Updated README.md** - Added auto-redeploy feature and quick start guide

### 6. Testing Tool

**File**: `be/test/test-webhook.js`

Created a test script to simulate GitHub webhooks:

```bash
# Test production
node test/test-webhook.js https://hostify-be.onrender.com https://github.com/username/repo.git your-secret

# Or test locally
node test/test-webhook.js http://localhost:3000 https://github.com/username/repo.git your-secret
```

## How to Use It

### Step 1: Update Environment Variables

Add to your `.env`:

```env
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
```

Generate the secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Deploy a Project

```bash
# Production
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/repo",
    "subdomain": "my-app"
  }'

# Or local development
curl -X POST http://localhost:3000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/repo",
    "subdomain": "my-app"
  }'
```

This stores the project metadata in Cloudflare KV.

### Step 3: Set Up GitHub Webhook

1. Go to your GitHub repo → Settings → Webhooks → Add webhook
2. Configure:
   - **Payload URL**: `https://hostify-be.onrender.com/int/api/v1/webhook/gh`
   - **Content type**: `application/json`
   - **Secret**: Your `GITHUB_WEBHOOK_SECRET`
   - **Events**: "Just the push event"
   - **Active**: ✅ Checked

### Step 4: Push to GitHub

```bash
git add .
git commit -m "test auto-redeploy"
git push
```

Your project will automatically redeploy! 🎉

## What Happens When You Push

```
GitHub Push
    ↓
Webhook sent to your backend
    ↓
Signature verified ✅
    ↓
Lookup projects using this repo (Cloudflare KV)
    ↓
For each project:
    ├── Clone repository
    ├── Upload to Azure Storage
    ├── Update Cloudflare KV metadata
    └── Log deployment status
    ↓
Return detailed response to GitHub
```

## Features

✅ **Secure** - HMAC SHA-256 signature verification  
✅ **Multi-project** - Same repo can have multiple deployments  
✅ **Detailed logging** - See exactly what's happening  
✅ **Error handling** - Continues even if one deployment fails  
✅ **Metadata tracking** - Stores creation and deployment timestamps  
✅ **Backward compatible** - Existing deployments still work

## Example Response

When webhook is triggered:

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
```

## Testing

### Test Locally

```bash
# Start your backend
npm run dev

# In another terminal, test the webhook
cd be
# Test production
node test-webhook.js https://hostify-be.onrender.com https://github.com/username/repo.git your-secret

# Or test locally
node test-webhook.js http://localhost:3000 https://github.com/username/repo.git your-secret
```

### Test with ngrok (for GitHub webhooks in development)

```bash
# Start your backend
npm run dev

# In another terminal
ngrok http 3000

# Use the ngrok URL in GitHub webhook settings
# Example: https://abc123.ngrok.io/int/api/v1/webhook/gh
```

## Files Changed

1. ✏️ `be/src/utils/cloudflare.ts` - Enhanced with metadata storage
2. ✏️ `be/src/helpers/upload.ts` - Updated to save metadata
3. ✏️ `be/src/controllers/git.controllers.ts` - Secure webhook handler
4. ✏️ `be/src/constants/e.ts` - Added webhook secret
5. ✏️ `README.md` - Added auto-redeploy documentation
6. ✨ `AUTO_REDEPLOY_SETUP.md` - Complete setup guide
7. ✨ `be/.env.example` - Example environment file
8. ✨ `be/test/test-webhook.js` - Webhook testing tool
9. ✨ `be/scripts/test-todolist.sh` - Automated testing script
10. ✨ `be/test/README.md` - Testing scripts documentation
11. ✨ `be/scripts/README.md` - Utility scripts documentation

## Next Steps (Optional Enhancements)

Consider implementing:

- [ ] Branch-specific deployments (only deploy from main/production branches)
- [ ] Deployment rollback functionality
- [ ] Email/Slack notifications on deployment success/failure
- [ ] Deployment history and logs dashboard
- [ ] Preview deployments for pull requests
- [ ] Build cache for faster deployments
- [ ] Custom build commands per project
- [ ] Environment variables per deployment

## Need Help?

Check these resources:

- **Full Setup Guide**: [AUTO_REDEPLOY_SETUP.md](./AUTO_REDEPLOY_SETUP.md)
- **Environment Example**: [be/.env.example](./be/.env.example)
- **Test Script**: [be/test/test-webhook.js](./be/test/test-webhook.js)
- **Automated Testing**: [be/scripts/test-todolist.sh](./be/scripts/test-todolist.sh)

---

**🎉 Your auto-redeploy feature is ready to use!**

Simply set up your environment variables, configure the GitHub webhook, and enjoy automatic deployments on every push! 🚀
