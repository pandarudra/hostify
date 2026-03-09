# 🧪 Production Testing Guide

**Production URL:** https://hostify-be.onrender.com/

This guide provides step-by-step instructions for testing all features in the production environment.

---

## 📋 Prerequisites

Before testing, ensure you have:

- ✅ GitHub account
- ✅ `curl` or Postman installed
- ✅ A GitHub repository to test deployments
- ✅ Production OAuth app configured correctly

---

## 🔐 Step 1: Test OAuth Authentication

### 1.1 Start OAuth Flow

Open this URL in your browser:

```
https://hostify-be.onrender.com/api/auth/github
```

**Expected Result:**

- Redirected to GitHub authorization page
- Shows requested permissions
- After approval, redirected to frontend with token

### 1.2 Extract Your Token

After authorization, you'll be redirected to:

```
http://localhost:5173/auth/success?token=YOUR_JWT_TOKEN
```

**Copy the token** from the URL. Set it as environment variable:

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWFlZTY0MTFjNDQwZjY4ODRmZjk4YWYiLCJnaXRodWJJZCI6IjEwNTY4NjE5MyIsInVzZXJuYW1lIjoicGFuZGFydWRyYSIsImlhdCI6MTc3MzA4NDYwNywiZXhwIjoxNzc1Njc2NjA3fQ.hgunRx_J7h4sPua0IDj3stV97bzaAmaCWckD6c6jD7M"
```

### 1.3 Verify Authentication

Test if your token is valid:

```bash
curl https://hostify-be.onrender.com/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "user": {
    "id": "69aee6411c440f6884ff98af",
    "username": "pandarudra",
    "githubId": "105686193",
    "email": "user@example.com",
    "avatarUrl": "https://avatars.githubusercontent.com/u/...",
    "createdAt": "2026-03-09T15:20:00.000Z"
  }
}
```

---

## 📚 Step 2: Test Repository Listing

List all your GitHub repositories:

```bash
curl https://hostify-be.onrender.com/api/repositories \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "repositories": [
    {
      "name": "hostify",
      "full_name": "pandarudra/hostify",
      "html_url": "https://github.com/pandarudra/hostify",
      "description": "Deploy static sites instantly",
      "private": false,
      "default_branch": "main",
      "language": "TypeScript",
      "updated_at": "2026-03-09T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

## 🚀 Step 3: Test Deployment

### 3.1 Deploy a Repository

Deploy with a custom subdomain:

```bash
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/pandarudra/zomatoclone.io.git",
    "subdomain": "zmto-prod"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Deployment successful",
  "deployment": {
    "id": "69aeeaac32ed2eb8e786d142",
    "subdomain": "zmto-prod",
    "repoName": "zomatoclone",
    "repoOwner": "pandarudra",
    "url": "https://zmto-prod.rudrax.me",
    "webhookUrl": "https://hostify-be.onrender.com/api/git/webhook/abc123...",
    "webhookAutoCreated": true,
    "createdAt": "2026-03-09T15:43:40.818Z"
  },
  "webhookInfo": {
    "autoCreated": true,
    "message": "Webhook created successfully"
  }
}
```

### 3.2 Deploy Without Subdomain (Auto-generate)

```bash
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/pandarudra/amazonlogin.io.git"
  }'
```

**Expected:** Subdomain auto-generated from repo name (`amazonlogin`)

---

## 📊 Step 4: Test Deployment Management

### 4.1 List All Your Deployments

```bash
curl https://hostify-be.onrender.com/api/deployments \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "deployments": [
    {
      "id": "69aeeaac32ed2eb8e786d142",
      "subdomain": "zmto-prod",
      "repoUrl": "https://github.com/pandarudra/zomatoclone.io.git",
      "repoName": "zomatoclone",
      "repoOwner": "pandarudra",
      "branch": "main",
      "status": "active",
      "deploymentUrl": "https://zmto-prod.rudrax.me",
      "webhookId": 123456,
      "createdAt": "2026-03-09T15:43:40.818Z",
      "lastDeployedAt": "2026-03-09T15:43:40.818Z"
    }
  ],
  "count": 1
}
```

### 4.2 Get Specific Deployment

```bash
# Replace with your deployment ID
curl https://hostify-be.onrender.com/api/deployments/69aeeaac32ed2eb8e786d142 \
  -H "Authorization: Bearer $TOKEN"
```

### 4.3 Delete a Deployment

```bash
# Replace with your deployment ID
curl -X DELETE https://hostify-be.onrender.com/api/deployments/69aeeaac32ed2eb8e786d142 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Deployment deleted successfully",
  "deployment": {
    "id": "69aeeaac32ed2eb8e786d142",
    "subdomain": "zmto-prod",
    "webhookDeleted": true
  }
}
```

---

## 🔄 Step 5: Test Auto-Redeploy (Webhook)

### 5.1 Verify Webhook Created

After deploying, check your GitHub repository:

1. Go to repo → **Settings** → **Webhooks**
2. You should see a webhook with your deployment URL
3. Check recent deliveries

### 5.2 Test Auto-Redeploy

Make a change to your repository:

```bash
# In your local repo
git clone https://github.com/pandarudra/zomatoclone.io.git
cd zomatoclone.io

# Make a change
echo "<!-- Test change -->" >> index.html

# Commit and push
git add .
git commit -m "Test auto-redeploy"
git push origin main
```

**Expected:**

- GitHub triggers webhook
- Your site automatically redeploys
- Changes appear on live site within 1-2 minutes

### 5.3 Check Webhook Delivery

In GitHub:

1. Go to repo → **Settings** → **Webhooks**
2. Click on the webhook
3. Check **Recent Deliveries**
4. Should show `200 OK` response

---

## 🧪 Step 6: Test Legacy Endpoint (Backward Compatibility)

The old deployment method still works:

```bash
curl -X POST https://hostify-be.onrender.com/api/v1/deploy/legacy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/pandarudra/test-site.git",
    "subdomain": "test-legacy"
  }'
```

**Note:** This doesn't require authentication but won't create webhooks automatically.

---

## 🔒 Step 7: Test Error Handling

### 7.1 Test Unauthorized Access

```bash
curl https://hostify-be.onrender.com/api/repositories
```

**Expected:**

```json
{
  "success": false,
  "message": "No token provided"
}
```

### 7.2 Test Invalid Token

```bash
curl https://hostify-be.onrender.com/api/auth/me \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected:**

```json
{
  "success": false,
  "message": "Invalid token"
}
```

### 7.3 Test Duplicate Subdomain

Deploy with same subdomain twice:

```bash
# First deploy
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/pandarudra/test.git",
    "subdomain": "duplicate-test"
  }'

# Try again with same subdomain
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/pandarudra/test2.git",
    "subdomain": "duplicate-test"
  }'
```

**Expected:**

```json
{
  "success": false,
  "message": "Subdomain already exists. Please choose a different one."
}
```

### 7.4 Test Invalid Repository URL

```bash
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/invalid/nonexistent.git",
    "subdomain": "test-invalid"
  }'
```

**Expected:** Error message about repository not found or access denied.

---

## 📝 Test Checklist

### ✅ Authentication

- [ ] OAuth login redirects to GitHub
- [ ] Token generated after authorization
- [ ] `/api/auth/me` returns user info
- [ ] Invalid token returns error

### ✅ Repositories

- [ ] `/api/repositories` lists user's repos
- [ ] Returns correct repo metadata
- [ ] Only shows authenticated user's repos

### ✅ Deployments

- [ ] Can deploy with custom subdomain
- [ ] Can deploy with auto-generated subdomain
- [ ] Deployment URL accessible
- [ ] Duplicate subdomains rejected
- [ ] `/api/deployments` lists user's deployments
- [ ] Can get specific deployment by ID
- [ ] Can delete deployment

### ✅ Webhooks

- [ ] Webhook auto-created on deploy
- [ ] Webhook appears in GitHub repo settings
- [ ] Push to repo triggers auto-redeploy
- [ ] Webhook deletion on deployment delete

### ✅ Error Handling

- [ ] Unauthorized requests rejected
- [ ] Invalid tokens rejected
- [ ] Invalid repo URLs handled
- [ ] Duplicate subdomains prevented

---

## 🔍 Debugging Tips

### Check Logs

If something fails, check production logs on Render:

1. Go to Render dashboard
2. Select your service
3. Click **Logs** tab
4. Look for errors

### Common Issues

**1. Webhook not created**

- Check GitHub token has `admin:repo_hook` or `repo` scope
- Verify production URL is publicly accessible
- Check webhook URL format is correct

**2. Deployment fails**

- Check if repo is private (needs correct token)
- Verify repo URL is correct
- Check Azure Storage credentials

**3. OAuth fails**

- Verify GitHub OAuth app callback URL matches production
- Check `FRONTEND_URL` in production `.env`
- Ensure GitHub app is not suspended

---

## 🌐 Testing with Postman

### Import Collection

Create a Postman collection with these requests:

1. **OAuth Login** - Manual browser step
2. **Get User** - `GET /api/auth/me`
3. **List Repos** - `GET /api/repositories`
4. **Deploy** - `POST /api/v1/deploy`
5. **List Deployments** - `GET /api/deployments`
6. **Delete Deployment** - `DELETE /api/deployments/:id`

### Environment Variables

Set these in Postman:

- `BASE_URL`: `https://hostify-be.onrender.com`
- `TOKEN`: Your JWT token
- `TEST_REPO`: `https://github.com/your-username/test-repo.git`

---

## 📊 Performance Testing

### Test Response Times

```bash
# Time the deployment
time curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/pandarudra/test.git"
  }'
```

**Expected:**

- Small repos: 5-15 seconds
- Large repos: 15-60 seconds

### Concurrent Deployments

Test multiple simultaneous deployments:

```bash
# Run multiple deploys in parallel
for i in {1..3}; do
  curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"repoUrl\": \"https://github.com/pandarudra/test-$i.git\"}" &
done
wait
```

---

## 🎯 Production Verification

### Final Checklist

Before marking production as "ready":

- [ ] ✅ OAuth flow works end-to-end
- [ ] ✅ Deployments create live sites
- [ ] ✅ Webhooks auto-create and work
- [ ] ✅ Auto-redeploy works on git push
- [ ] ✅ User isolation (can't see other users' data)
- [ ] ✅ Error messages are user-friendly
- [ ] ✅ Response times acceptable
- [ ] ✅ MongoDB connection stable
- [ ] ✅ Azure Storage working
- [ ] ✅ Cloudflare KV working

---

## 🚨 What to Monitor

Keep an eye on:

1. **Error rates** in production logs
2. **Deployment success rate**
3. **Webhook delivery success**
4. **Database connection drops**
5. **API response times**
6. **Memory/CPU usage on Render**

---

## 📚 Related Documentation

- [OAUTH_IMPLEMENTATION.md](./OAUTH_IMPLEMENTATION.md) - OAuth feature overview
- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - Detailed setup instructions
- [AUTOMATED_WEBHOOK_SETUP.md](./AUTOMATED_WEBHOOK_SETUP.md) - Webhook details
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Local testing guide

---

**Ready to test?** Start with Step 1 and work through each section! 🚀

**Need help?** Check the logs or refer to troubleshooting sections.
