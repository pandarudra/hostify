# 🚀 Quick Start: Auto-Redeploy in 5 Minutes

Get auto-redeploy working with GitHub webhooks in just a few steps!

## ⚡ Prerequisites

- ✅ Backend running
- ✅ Cloudflare KV configured
- ✅ GitHub repository ready

## 🛠️ Setup (5 steps)

### 1️⃣ Generate Webhook Secret (30 seconds)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add to your `.env`:

```env
GITHUB_WEBHOOK_SECRET=paste_your_secret_here
```

Restart your backend if it's running.

### 2️⃣ Deploy Your Project (1 minute)

```bash
# Using the production URL
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/YOUR_USERNAME/YOUR_REPO",
    "subdomain": "my-app"
  }'

# Or for local development
curl -X POST http://localhost:3000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/YOUR_USERNAME/YOUR_REPO",
    "subdomain": "my-app"
  }'
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual values.

✅ You should see: `"success": true`

### 3️⃣ Expose Your Backend (1 minute for dev)

**For Production:** Skip this - use your production URL

**For Local Development:** Use ngrok:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 4️⃣ Configure GitHub Webhook (2 minutes)

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/hooks/new`

2. Fill in:
   - **Payload URL**: `https://hostify-be.onrender.com/int/api/v1/webhook/gh`
     - For local dev: `https://abc123.ngrok.io/int/api/v1/webhook/gh` (use your ngrok URL)
   - **Content type**: `application/json`
   - **Secret**: Paste your `GITHUB_WEBHOOK_SECRET` from step 1
   - **Which events**: Select "Just the push event"
   - **Active**: ✅ Check this

3. Click **"Add webhook"**

4. ✅ You should see a green checkmark (successful ping)

### 5️⃣ Test It! (1 minute)

Make any change to your repo:

```bash
cd YOUR_REPO
echo "Testing auto-redeploy" >> README.md
git add README.md
git commit -m "test: auto-redeploy"
git push
```

**Check your backend logs** - you should see:

```
📥 GitHub webhook received: push
🔔 Push detected:
   Repository: https://github.com/YOUR_USERNAME/YOUR_REPO.git
   Branch: main
   Pusher: YOUR_USERNAME
   Commits: 1
🚀 Triggering redeployment for 1 project(s)...
   → Redeploying: my-app
   ✅ Successfully redeployed: https://my-app.rudrax.me

✅ Redeployment complete: 1 succeeded, 0 failed
```

**Check GitHub:**

- Go to: `Settings → Webhooks → Your webhook → Recent Deliveries`
- Latest delivery shows green checkmark ✅
- Response shows `"success": true`

## 🎉 Done!

Your auto-redeploy is now active! Every push to GitHub will automatically redeploy your project.

---

## 💡 Quick Tips

### Deploy Multiple Environments

```bash
# Production
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -d '{"ghlink": "https://github.com/user/repo", "subdomain": "app"}'

# Staging
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -d '{"ghlink": "https://github.com/user/repo", "subdomain": "app-staging"}'
```

One push = all environments redeploy! 🚀

### Test Webhook Locally

```bash
cd be
# Test production
node test/test-webhook.js https://hostify-be.onrender.com https://github.com/user/repo.git your-secret

# Or test locally
node test/test-webhook.js http://localhost:3000 https://github.com/user/repo.git your-secret
```

### View Webhook Logs

Check GitHub: `Repo → Settings → Webhooks → Recent Deliveries`

---

## 🐛 Troubleshooting

**Webhook not working?**

- ✅ Backend is running
- ✅ Webhook URL is correct
- ✅ Secret matches in `.env` and GitHub
- ✅ Project was deployed first (step 2)

**Still stuck?**

- 📖 See [AUTO_REDEPLOY_SETUP.md](./AUTO_REDEPLOY_SETUP.md) for detailed guide
- 📋 Use [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) to verify each step

---

## 📚 More Info

- **Detailed Setup**: [AUTO_REDEPLOY_SETUP.md](./AUTO_REDEPLOY_SETUP.md)
- **What Changed**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Step-by-Step**: [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
- **Main Docs**: [README.md](./README.md)

**Happy auto-deploying! 🎊**
