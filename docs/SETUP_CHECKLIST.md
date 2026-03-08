# Auto-Redeploy Setup Checklist

Use this checklist to set up and verify your auto-redeploy feature.

## ☐ Prerequisites

- [ ] Node.js v18+ installed
- [ ] Backend is running and accessible
- [ ] Cloudflare KV is configured
- [ ] Azure Storage is configured
- [ ] GitHub repository ready

## ☐ Configuration

### 1. Generate Webhook Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] Copy the generated secret
- [ ] Add to `.env` as `GITHUB_WEBHOOK_SECRET=your_secret_here`
- [ ] Restart your backend if it's running

### 2. Verify Environment Variables

Check your `.env` file has:

- [ ] `GITHUB_WEBHOOK_SECRET` - Your webhook secret
- [ ] `CF_ACCOUNT_ID` - Cloudflare account ID
- [ ] `CF_KV_NAMESPACE_ID` - Cloudflare KV namespace ID
- [ ] `CF_API_TOKEN` - Cloudflare API token
- [ ] `AZURE_STORAGE_ACCOUNT_NAME` - Azure storage account
- [ ] `AZURE_STORAGE_CONTAINER_NAME` - Usually `$web`
- [ ] `AZURE_STORAGE_SAS_TOKEN` - Azure SAS token

## ☐ Initial Deployment

### 3. Deploy Your First Project

```bash
# Production
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/YOUR_USERNAME/YOUR_REPO",
    "subdomain": "my-app"
  }'

# Or local development
curl -X POST http://localhost:3000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/YOUR_USERNAME/YOUR_REPO",
    "subdomain": "my-app"
  }'
```

**Replace**: `YOUR_USERNAME` and `YOUR_REPO` with your actual values

- [ ] Request sent successfully
- [ ] Response includes `success: true`
- [ ] Note the subdomain and URL from response

## ☐ GitHub Webhook Setup

### 4. Get Your Webhook URL

**For Local Development:**

```bash
# Option A: Using ngrok
ngrok http 3000
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

**For Production:**

- Your webhook URL: `https://YOUR_DOMAIN.com/int/api/v1/webhook/gh`

- [ ] Webhook URL ready

### 5. Configure GitHub Webhook

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/hooks/new`

- [ ] **Payload URL**: `https://YOUR_DOMAIN/int/api/v1/webhook/gh`
- [ ] **Content type**: `application/json`
- [ ] **Secret**: Your `GITHUB_WEBHOOK_SECRET` value
- [ ] **SSL verification**: Enable SSL verification ✅
- [ ] **Which events**: "Just the push event"
- [ ] **Active**: ✅ Checked
- [ ] Click "Add webhook"
- [ ] Webhook shows green checkmark (means successful ping)

## ☐ Testing

### 6. Test with Test Script (Optional)

```bash
cd be
node test-webhook.js http://localhost:3000 https://github.com/YOUR_USERNAME/YOUR_REPO.git YOUR_WEBHOOK_SECRET
```

- [ ] Test script runs without errors
- [ ] Shows "✅ Webhook test successful!"
- [ ] Shows deployment results

### 7. Test with Real Push

```bash
cd YOUR_REPO
echo "Test auto-redeploy" >> README.md
git add README.md
git commit -m "test: auto-redeploy feature"
git push
```

**Check Backend Logs:**

- [ ] See: `📥 GitHub webhook received: push`
- [ ] See: `🔔 Push detected:`
- [ ] See: `🚀 Triggering redeployment for X project(s)...`
- [ ] See: `✅ Successfully redeployed: https://my-app.rudrax.me`
- [ ] See: `✅ Redeployment complete:`

**Check GitHub:**

- [ ] Go to repo → Settings → Webhooks → Recent Deliveries
- [ ] Latest delivery shows green checkmark
- [ ] Response shows `"success": true`

### 8. Verify Deployment

- [ ] Visit your site: `https://my-app.rudrax.me` (or your subdomain)
- [ ] Changes from your push are visible
- [ ] Site loads correctly

## ☐ Multiple Deployments (Optional)

### 9. Deploy Same Repo Multiple Times

```bash
# Staging environment
curl -X POST http://localhost:3000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/YOUR_USERNAME/YOUR_REPO",
    "subdomain": "my-app-staging"
  }'

# Development environment
curl -X POST http://localhost:3000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/YOUR_USERNAME/YOUR_REPO",
    "subdomain": "my-app-dev"
  }'
```

- [ ] Multiple environments deployed
- [ ] Push to GitHub triggers all deployments

## ☐ Troubleshooting

If something doesn't work:

### Webhook Not Triggering

- [ ] Check GitHub webhook "Recent Deliveries" for errors
- [ ] Verify webhook URL is accessible: `curl -X POST YOUR_WEBHOOK_URL`
- [ ] Check backend is running and logs are visible

### Signature Verification Failing

- [ ] `GITHUB_WEBHOOK_SECRET` matches in `.env` and GitHub settings
- [ ] Backend was restarted after adding the secret
- [ ] No extra spaces or quotes in the secret

### No Projects Found

- [ ] Project was deployed first (Step 3)
- [ ] Check Cloudflare KV has key: `repo:https://github.com/USERNAME/REPO.git`
- [ ] Cloudflare credentials are correct in `.env`

### Deployment Fails

- [ ] Azure Storage credentials are valid
- [ ] SAS token hasn't expired
- [ ] Repository is public or credentials are provided
- [ ] Enough disk space for cloning

## ☐ Documentation

- [ ] Read [AUTO_REDEPLOY_SETUP.md](./AUTO_REDEPLOY_SETUP.md)
- [ ] Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- [ ] Keep `.env.example` as reference

---

## 🎉 Success!

Once all items are checked, your auto-redeploy feature is fully functional!

Every push to GitHub will automatically:

1. ✅ Trigger a webhook to your backend
2. ✅ Verify the signature for security
3. ✅ Look up all projects using that repo
4. ✅ Redeploy each project automatically
5. ✅ Update timestamps in Cloudflare KV
6. ✅ Send detailed response back to GitHub

**Next Push = Automatic Deployment! 🚀**
