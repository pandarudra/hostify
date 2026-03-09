# Testing Guide for ToDoList Repository

This guide will walk you through testing the Hostify deployment system with the repository:
**https://github.com/tusharnankani/ToDoList.git**

## Prerequisites

- [ ] Backend is running (production at `https://hostify-be.onrender.com`)
- [ ] Environment variables are configured in `.env`
- [ ] `GITHUB_WEBHOOK_SECRET` is set

## Step 1: Test Initial Deployment

### Deploy the ToDoList Project

**Using Production URL:**

```bash
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/tusharnankani/ToDoList.git",
    "subdomain": "todolist-test"
  }'
```

**Using Local Development:**

```bash
curl -X POST http://localhost:8000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/tusharnankani/ToDoList.git",
    "subdomain": "todolist-test"
  }'
```

### Expected Response

You should receive a response like:

```json
{
  "success": true,
  "message": "Deployment successful",
  "blobPath": {
    "folderName": "todolist-abc123",
    "subdomain": "todolist-test",
    "path": "todolist-abc123",
    "url": "https://todolist-test.rudrax.me"
  }
}
```

### What to Check:

- ✅ Response has `"success": true`
- ✅ You get a subdomain URL
- ✅ Project metadata is stored in Cloudflare KV
- ✅ Files are uploaded to Azure Storage (in production)

---

## Step 2: Test Webhook Simulation

Since you don't own the repository, you can't set up actual GitHub webhooks. However, you can **simulate** webhook calls using the test script.

### Run the Webhook Test Script

**For Production:**

```bash
cd /home/rudra/Desktop/hostify/be
node test/test-webhook.js https://hostify-be.onrender.com https://github.com/tusharnankani/ToDoList.git your_webhook_secret
```

**For Local Development:**

```bash
cd /home/rudra/Desktop/hostify/be
node test/test-webhook.js http://localhost:8000 https://github.com/tusharnankani/ToDoList.git your_webhook_secret
```

Replace `your_webhook_secret` with your actual `GITHUB_WEBHOOK_SECRET` from `.env`

**Or use the automated test script:**

```bash
cd /home/rudra/Desktop/hostify/be
./scripts/test-todolist.sh production
# or
./scripts/test-todolist.sh local
```

### Expected Output

```
🔐 Generated signature for webhook authentication

📤 Sending test webhook to: https://hostify-be.onrender.com/int/api/v1/webhook/gh
📦 Payload:
{
  "ref": "refs/heads/main",
  "repository": {
    "name": "ToDoList",
    "full_name": "tusharnankani/ToDoList",
    "clone_url": "https://github.com/tusharnankani/ToDoList.git",
    "html_url": "https://github.com/tusharnankani/ToDoList"
  },
  "pusher": {
    "name": "test-user",
    "email": "test@example.com"
  },
  "commits": [
    {
      "id": "1234567890abcdef",
      "message": "Test commit for auto-redeploy",
      "timestamp": "2026-03-08T...",
      "author": {
        "name": "Test User",
        "email": "test@example.com"
      }
    }
  ]
}

🚀 Triggering webhook...

📨 Response status: 200 OK

📋 Response body:
{
  "success": true,
  "message": "Auto-redeploy triggered",
  "repoUrl": "https://github.com/tusharnankani/ToDoList.git",
  "branch": "main",
  "pusher": "test-user",
  "commits": 1,
  "results": [
    {
      "subdomain": "todolist-test",
      "success": true,
      "url": "https://todolist-test.rudrax.me",
      "folderName": "todolist-abc123"
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0
  }
}

✅ Webhook test successful!

🎯 Deployment Results:
  1. ✅ todolist-test
     URL: https://todolist-test.rudrax.me

📊 Summary:
   Total: 1
   Successful: 1
   Failed: 0
```

---

## Step 3: Test Multiple Deployments from Same Repo

Deploy the same repository with different subdomains to test multi-project redeployment.

### Deploy Multiple Environments

```bash
# Production environment
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/tusharnankani/ToDoList.git",
    "subdomain": "todolist-prod"
  }'

# Staging environment
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/tusharnankani/ToDoList.git",
    "subdomain": "todolist-staging"
  }'

# Development environment
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/tusharnankani/ToDoList.git",
    "subdomain": "todolist-dev"
  }'
```

### Test Webhook with Multiple Deployments

```bash
cd /home/rudra/Desktop/hostify/be
node test/test-webhook.js https://hostify-be.onrender.com https://github.com/tusharnankani/ToDoList.git your_webhook_secret
```

**Expected:** All three subdomains should redeploy:

```
🎯 Deployment Results:
  1. ✅ todolist-prod
     URL: https://todolist-prod.rudrax.me
  2. ✅ todolist-staging
     URL: https://todolist-staging.rudrax.me
  3. ✅ todolist-dev
     URL: https://todolist-dev.rudrax.me

📊 Summary:
   Total: 3
   Successful: 3
   Failed: 0
```

---

## Step 4: Check Backend Logs

Watch your backend logs while testing. You should see:

```
📥 GitHub webhook received: push
🔔 Push detected:
   Repository: https://github.com/tusharnankani/ToDoList.git
   Branch: main
   Pusher: test-user
   Commits: 1
🚀 Triggering redeployment for 1 project(s)...
   → Redeploying: todolist-test
Repository cloned to local path: /home/rudra/Desktop/hostify/be/local/todolist-abc123
✓ Subdomain 'todolist-test' saved to Cloudflare KV, mapped to folder 'todolist-abc123'
✓ Project metadata saved for subdomain 'todolist-test'
   ✅ Successfully redeployed: https://todolist-test.rudrax.me

✅ Redeployment complete: 1 succeeded, 0 failed
```

---

## Step 5: Verify Cloudflare KV Storage

After deployment, verify the data is stored correctly in Cloudflare KV:

### Keys that should exist:

1. **`todolist-test`** → `todolist-abc123` (folder name)
2. **`metadata:todolist-test`** → Full project metadata JSON
3. **`repo:https://github.com/tusharnankani/ToDoList.git`** → Array of subdomains

### Check via Cloudflare Dashboard:

1. Log in to Cloudflare
2. Go to Workers & Pages → KV
3. Find your namespace
4. View the keys and values

---

## Step 6: Test Error Scenarios

### Test with Invalid Repository

```bash
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/invalid/nonexistent.git",
    "subdomain": "test-error"
  }'
```

**Expected:** Error response with details

### Test with Missing Fields

```bash
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected:** Error about missing `ghlink`

### Test Webhook with Wrong Secret

```bash
cd /home/rudra/Desktop/hostify/be
node test/test-webhook.js https://hostify-be.onrender.com https://github.com/tusharnankani/ToDoList.git wrong_secret
```

**Expected:** 401 Unauthorized - Invalid signature

---

## Quick Reference Commands

### Deploy Project

```bash
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{"ghlink": "https://github.com/tusharnankani/ToDoList.git", "subdomain": "todolist-test"}'
```

### Test Webhook

```bash
cd /home/rudra/Desktop/hostify/be
node test/test-webhook.js https://hostify-be.onrender.com https://github.com/tusharnankani/ToDoList.git $(grep GITHUB_WEBHOOK_SECRET .env | cut -d '=' -f2)
```

### Run Automated Test Script

```bash
cd /home/rudra/Desktop/hostify/be
./scripts/test-todolist.sh production
```

### Check if Backend is Running

```bash
curl https://hostify-be.onrender.com/
```

---

## Troubleshooting

### Issue: "No deployments found for this repository"

**Solution:** Make sure you deployed the project first (Step 1)

### Issue: "Invalid signature"

**Solution:** Check that your webhook secret matches in `.env` and test script

### Issue: "Cloudflare KV error"

**Solution:** Verify your Cloudflare credentials in `.env`

### Issue: "Azure Storage error"

**Solution:** Check Azure Storage credentials and SAS token expiration

### Issue: Repository clone fails

**Solution:** Ensure the repository URL is correct and the repo is public

---

## Success Criteria

✅ Initial deployment succeeds  
✅ Webhook test script returns success  
✅ Project metadata stored in Cloudflare KV  
✅ Files uploaded to Azure Storage (production)  
✅ Multiple deployments from same repo work  
✅ Webhook triggers redeployment for all projects  
✅ Backend logs show correct flow  
✅ Error scenarios are handled gracefully

---

## Next Steps

After successful testing:

1. Set up webhooks on your own repositories
2. Test with real GitHub pushes
3. Monitor production deployments
4. Set up monitoring/alerting for failures

---

Need help? Check:

- [README.md](../README.md)
- [QUICKSTART.md](QUICKSTART.md)
- [AUTO_REDEPLOY_SETUP.md](AUTO_REDEPLOY_SETUP.md)
