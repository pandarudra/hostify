# 🎉 GitHub OAuth Authentication - Complete Implementation

## What's New?

Your Hostify platform now has **full GitHub OAuth authentication**! Users can:

✅ **Login with GitHub** - One-click OAuth authentication  
✅ **Auto-token storage** - GitHub tokens stored securely in MongoDB  
✅ **Browse repositories** - See all their repos in one place  
✅ **One-click deploy** - No manual token/URL entry needed  
✅ **Auto-webhook creation** - Webhooks created automatically  
✅ **Manage deployments** - View, track, and delete deployments

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd be
chmod +x ../scripts/setup-oauth.sh
../scripts/setup-oauth.sh
```

Or manually:

```bash
npm install mongoose jsonwebtoken
npm install --save-dev @types/mongoose @types/jsonwebtoken
```

### 2. Set Up MongoDB

**Option A: MongoDB Atlas (Easiest, Free)**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Whitelist your IP

**Option B: Local MongoDB**

```bash
brew install mongodb-community  # macOS
brew services start mongodb-community
```

### 3. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Name**: Hostify Platform
   - **Homepage**: http://localhost:8000
   - **Callback**: http://localhost:8000/api/auth/github/callback
4. Save **Client ID** and generate **Client Secret**

### 4. Configure Environment

Add to `.env`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hostify
# Or local: mongodb://localhost:27017/hostify

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/github/callback

# JWT
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_EXPIRES_IN=30d

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 5. Start the Server

```bash
npm run dev
```

## 📋 New API Endpoints

### Authentication

| Endpoint                    | Method | Auth | Description      |
| --------------------------- | ------ | ---- | ---------------- |
| `/api/auth/github`          | GET    | No   | Start OAuth flow |
| `/api/auth/github/callback` | GET    | No   | OAuth callback   |
| `/api/auth/me`              | GET    | Yes  | Get current user |
| `/api/auth/logout`          | POST   | Yes  | Logout           |

### Repositories

| Endpoint            | Method | Auth | Description       |
| ------------------- | ------ | ---- | ----------------- |
| `/api/repositories` | GET    | Yes  | List user's repos |

### Deployments

| Endpoint               | Method | Auth | Description       |
| ---------------------- | ------ | ---- | ----------------- |
| `/api/v1/deploy`       | POST   | Yes  | Deploy repository |
| `/api/deployments`     | GET    | Yes  | List deployments  |
| `/api/deployments/:id` | GET    | Yes  | Get deployment    |
| `/api/deployments/:id` | DELETE | Yes  | Delete deployment |

### Legacy (Backward Compatible)

| Endpoint                | Method | Auth | Description       |
| ----------------------- | ------ | ---- | ----------------- |
| `/api/v1/deploy/legacy` | POST   | No   | Old deploy method |

## 🧪 Testing

### 1. Test OAuth Flow

```bash
# Open in browser
open http://localhost:8000/api/auth/github
```

1. Authorize app on GitHub
2. Get redirected with JWT token
3. Copy token from URL

   token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWFlZTY0MTFjNDQwZjY4ODRmZjk4YWYiLCJnaXRodWJJZCI6IjEwNTY4NjE5MyIsInVzZXJuYW1lIjoicGFuZGFydWRyYSIsImlhdCI6MTc3MzA2OTg4OSwiZXhwIjoxNzc1NjYxODg5fQ.l-2cfvU80XNHh8j7b8HXswLhC7e8FVnSs2Ii9ipQOeI

### 2. Test with cURL

```bash
# Set your token
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWFlZTY0MTFjNDQwZjY4ODRmZjk4YWYiLCJnaXRodWJJZCI6IjEwNTY4NjE5MyIsInVzZXJuYW1lIjoicGFuZGFydWRyYSIsImlhdCI6MTc3MzA2OTg4OSwiZXhwIjoxNzc1NjYxODg5fQ.l-2cfvU80XNHh8j7b8HXswLhC7e8FVnSs2Ii9ipQOeI"

# Get current user
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# List repositories
curl http://localhost:8000/api/repositories \
  -H "Authorization: Bearer $TOKEN"

# Deploy a repository
curl -X POST http://localhost:8000/api/v1/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/pandarudra/amazonlogin.io.git",
    "subdomain": "amazon"
  }'
```

## 📦 File Structure

```
be/src/
├── models/
│   ├── User.ts              # User schema with GitHub data
│   └── Deployment.ts        # Deployment tracking
├── controllers/
│   ├── auth.controllers.ts  # OAuth login/logout
│   ├── repo.controllers.ts  # Repos & deployments
│   └── deploy.controllers.ts # Deploy endpoints
├── router/
│   ├── auth.router.ts       # Auth routes
│   ├── repo.router.ts       # Repo routes
│   └── deploy.router.ts     # Deploy routes (updated)
├── config/
│   └── database.ts          # MongoDB connection
└── utils/
    └── jwt.ts               # JWT token management
```

## 🎨 Frontend Integration Example

```typescript
// 1. Login
function loginWithGitHub() {
  window.location.href = "http://localhost:8000/api/auth/github";
}

// 2. Handle callback
// User lands on: http://localhost:5173/auth/success?token=JWT_TOKEN
const token = new URLSearchParams(window.location.search).get("token");
localStorage.setItem("authToken", token);

// 3. Fetch repositories
async function getRepos() {
  const res = await fetch("http://localhost:8000/api/repositories", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}

// 4. Deploy
async function deploy(repoUrl: string, subdomain: string) {
  const res = await fetch("http://localhost:8000/api/v1/deploy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repoUrl, subdomain }),
  });
  return await res.json();
}
```

## 🔒 Security Features

- ✅ **JWT tokens** for session management
- ✅ **Encrypted storage** of GitHub tokens in MongoDB
- ✅ **Per-user isolation** - users only see their own data
- ✅ **OAuth scopes** - only requested permissions
- ✅ **Token expiration** - automatic after 30 days
- ✅ **Secure webhook URLs** - unique per deployment

## 📚 Documentation

- **[OAUTH_SETUP.md](./docs/OAUTH_SETUP.md)** - Full OAuth setup guide
- **[AUTO_REDEPLOY_SETUP.md](./docs/AUTO_REDEPLOY_SETUP.md)** - Webhook setup (manual)
- **[AUTOMATED_WEBHOOK_SETUP.md](./docs/AUTOMATED_WEBHOOK_SETUP.md)** - Automatic webhooks
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture

## 🎯 User Flow

```
1. User visits frontend
   ↓
2. Click "Login with GitHub"
   ↓
3. Redirected to GitHub OAuth
   ↓
4. Approve permissions
   ↓
5. Redirected back with JWT token
   ↓
6. Frontend stores token
   ↓
7. Fetch repositories from /api/repositories
   ↓
8. User selects repo, clicks "Deploy"
   ↓
9. POST to /api/v1/deploy with JWT
   ↓
10. Backend:
    - Gets user's GitHub token from DB
    - Clones repo
    - Uploads to Azure
    - Creates webhook automatically
    - Saves deployment to DB
   ↓
11. Returns deployment URL
   ↓
12. User's site is live! 🎉
```

## 🔄 Migration from Old System

The new system is **100% backward compatible**:

- Old endpoint `/api/v1/deploy` → now authenticated
- New endpoint `/api/v1/deploy/legacy` → old behavior
- Webhooks still work with token-based auth
- Existing deployments continue functioning

## ⚡ Benefits

**For Users:**

- No manual token/URL copying
- One-click deployments
- Visual repo browser
- Deployment dashboard

**For You:**

- User tracking and analytics
- Better security per user
- Scalable multi-tenant architecture
- Professional OAuth integration

## 🐛 Troubleshooting

See [OAUTH_SETUP.md](./docs/OAUTH_SETUP.md) for detailed troubleshooting.

**Common Issues:**

1. **MongoDB connection failed** → Check `MONGODB_URI`
2. **OAuth redirect failed** → Verify GitHub app settings
3. **Token invalid** → Re-login to get new token
4. **Webhook not created** → Check user's GitHub token permissions

## 🚀 Next Steps

1. **Build Frontend** - Create React/Vue dashboard
2. **Add Features**:
   - Environment variables per deployment
   - Custom domains
   - Deployment logs
   - Build status tracking
3. **Production Deploy**:
   - Update OAuth callback URLs
   - Enable MongoDB authentication
   - Use HTTPS everywhere

## 💡 Example Frontend (React)

A complete example is in [OAUTH_SETUP.md](./docs/OAUTH_SETUP.md#frontend-integration).

---

**Need help?** Check the documentation or open an issue!

**Ready to go?** Run `./scripts/setup-oauth.sh` to get started! 🚀
