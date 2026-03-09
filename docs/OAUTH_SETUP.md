# GitHub OAuth Authentication Setup

## Overview

This system implements **GitHub OAuth authentication** so users can:

1. **Login with GitHub** - Authenticate once via OAuth
2. **Browse repositories** - See all their GitHub repos
3. **One-click deploy** - Deploy any repo without manual token/URL entry
4. **Auto-webhook creation** - Webhooks created automatically
5. **Manage deployments** - View, update, and delete deployments

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Flow                            │
└─────────────────────────────────────────────────────────────┘

1. User clicks "Login with GitHub"
   ↓
2. Redirected to GitHub OAuth
   ↓
3. User authorizes app
   ↓
4. GitHub redirects back with code
   ↓
5. Backend exchanges code for access token
   ↓
6. User info saved to MongoDB
   ↓
7. JWT token issued to user
   ↓
8. User browses repos, deploys with one click
```

## Prerequisites

### 1. MongoDB Database

You need a MongoDB instance. Options:

**Option A: MongoDB Atlas (Free Cloud)**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/hostify`

**Option B: Local MongoDB**

```bash
# Install MongoDB locally
brew install mongodb-community  # macOS
# or follow https://docs.mongodb.com/manual/installation/

# Start MongoDB
brew services start mongodb-community

# Connection string
mongodb://localhost:27017/hostify
```

### 2. GitHub OAuth App

Create a GitHub OAuth application:

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: `Hostify Deployment Platform`
   - **Homepage URL**: `http://localhost:8000` (dev) or your production URL
   - **Authorization callback URL**: `http://localhost:8000/api/auth/github/callback`
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** and copy it

## Installation

### 1. Install Dependencies

```bash
cd be
npm install mongoose jsonwebtoken @types/jsonwebtoken @types/mongoose
```

### 2. Environment Variables

Add to your `.env` file:

```env
# ============================================
# Existing Variables (keep these)
# ============================================
PORT=8000
ENV=production
UPLOAD_DIR=local

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=your_account
AZURE_STORAGE_CONTAINER_NAME=your_container
AZURE_STORAGE_SAS_TOKEN=your_token

# Cloudflare KV
CF_ACCOUNT_ID=your_cf_account_id
CF_KV_NAMESPACE_ID=your_kv_namespace
CF_API_TOKEN=your_cf_token

# Production URL
PROD_DEPLOYMENT_URL=https://your-domain.com

# ============================================
# NEW: MongoDB Configuration
# ============================================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hostify
# Or local: mongodb://localhost:27017/hostify

# ============================================
# NEW: GitHub OAuth Configuration
# ============================================
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/github/callback

# ============================================
# NEW: JWT Configuration
# ============================================
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=30d

# ============================================
# NEW: Frontend Configuration
# ============================================
FRONTEND_URL=http://localhost:5173
# Change to your frontend URL in production
```

### 3. Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as `JWT_SECRET`.

## API Endpoints

### Authentication

#### Login with GitHub

```
GET /api/auth/github
```

Redirects to GitHub OAuth page.

#### OAuth Callback

```
GET /api/auth/github/callback?code=xxx
```

Handled automatically by GitHub. Redirects to frontend with JWT token.

#### Get Current User

```
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

Response:

```json
{
  "success": true,
  "user": {
    "id": "...",
    "githubId": "12345",
    "username": "john_doe",
    "email": "john@example.com",
    "avatarUrl": "https://...",
    "createdAt": "2026-03-09T...",
    "lastLoginAt": "2026-03-09T..."
  }
}
```

#### Logout

```
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

### Repositories

#### List User's Repositories

```
GET /api/repositories
Authorization: Bearer <jwt_token>
```

Response:

```json
{
  "success": true,
  "count": 25,
  "repositories": [
    {
      "id": 123456,
      "name": "my-app",
      "fullName": "john_doe/my-app",
      "owner": "john_doe",
      "isPrivate": false,
      "description": "My awesome application",
      "cloneUrl": "https://github.com/john_doe/my-app.git",
      "defaultBranch": "main",
      "language": "JavaScript",
      "stars": 42,
      "isDeployed": true
    }
  ]
}
```

### Deployments

#### Deploy a Repository

```
POST /api/v1/deploy
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "repoUrl": "https://github.com/username/repo",
  "subdomain": "my-app",
  "branch": "main"
}
```

Response:

```json
{
  "success": true,
  "message": "Deployment successful",
  "deployment": {
    "id": "...",
    "subdomain": "my-app",
    "repoName": "repo",
    "repoOwner": "username",
    "url": "https://my-app.rudrax.me",
    "webhookUrl": "https://domain.com/api/git/webhook/abc123...",
    "webhookAutoCreated": true,
    "createdAt": "2026-03-09T..."
  },
  "webhookInfo": {
    "autoCreated": true,
    "message": "Webhook created successfully"
  }
}
```

#### List User's Deployments

```
GET /api/deployments
Authorization: Bearer <jwt_token>
```

#### Get Deployment Details

```
GET /api/deployments/:id
Authorization: Bearer <jwt_token>
```

#### Delete Deployment

```
DELETE /api/deployments/:id
Authorization: Bearer <jwt_token>
```

## Frontend Integration

### 1. OAuth Login Flow

```typescript
// Redirect user to backend OAuth endpoint
function loginWithGitHub() {
  window.location.href = "http://localhost:8000/api/auth/github";
}

// Handle OAuth callback (redirect from backend)
// URL will be: http://localhost:5173/auth/success?token=JWT_TOKEN
function handleAuthSuccess() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    localStorage.setItem("authToken", token);
    // Redirect to dashboard
    window.location.href = "/dashboard";
  }
}
```

### 2. Making Authenticated Requests

```typescript
async function fetchRepositories() {
  const token = localStorage.getItem("authToken");

  const response = await fetch("http://localhost:8000/api/repositories", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data.repositories;
}

async function deployRepository(repoUrl: string, subdomain: string) {
  const token = localStorage.getItem("authToken");

  const response = await fetch("http://localhost:8000/api/v1/deploy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repoUrl,
      subdomain,
      branch: "main",
    }),
  });

  return await response.json();
}
```

### 3. Example React Component

```tsx
import { useEffect, useState } from "react";

function Dashboard() {
  const [repos, setRepos] = useState([]);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    fetchRepos();
  }, []);

  async function fetchRepos() {
    const token = localStorage.getItem("authToken");
    const res = await fetch("http://localhost:8000/api/repositories", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRepos(data.repositories);
  }

  async function handleDeploy(repoUrl: string) {
    setDeploying(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:8000/api/v1/deploy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl,
          subdomain: `my-app-${Date.now()}`,
        }),
      });
      const data = await res.json();
      alert(`Deployed! URL: ${data.deployment.url}`);
      fetchRepos(); // Refresh list
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div>
      <h1>Your Repositories</h1>
      {repos.map((repo) => (
        <div key={repo.id}>
          <h3>{repo.name}</h3>
          <p>{repo.description}</p>
          {repo.isDeployed ? (
            <span>✅ Deployed</span>
          ) : (
            <button
              onClick={() => handleDeploy(repo.cloneUrl)}
              disabled={deploying}
            >
              Deploy
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Testing

### 1. Start the Backend

```bash
cd be
npm run dev
```

### 2. Test OAuth Flow

1. Open browser: `http://localhost:8000/api/auth/github`
2. Authorize the app on GitHub
3. You'll be redirected to: `http://localhost:5173/auth/success?token=...`
4. Copy the token

### 3. Test API with cURL

```bash
# Set your token
export TOKEN="your_jwt_token_here"

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
    "repoUrl": "https://github.com/username/repo",
    "subdomain": "test-app"
  }'

# List deployments
curl http://localhost:8000/api/deployments \
  -H "Authorization: Bearer $TOKEN"
```

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use HTTPS in production** - OAuth requires secure connections
3. **Rotate JWT secret** - Change periodically
4. **Set token expiration** - Default 30 days
5. **Validate on every request** - Middleware checks authentication
6. **Store tokens securely** - Use httpOnly cookies or secure storage in frontend
7. **Monitor MongoDB access** - Enable auth in production

## Troubleshooting

### MongoDB Connection Failed

**Problem**: Cannot connect to MongoDB

**Solution**:

- Check `MONGODB_URI` is correct
- Verify network access (whitelist IP in Atlas)
- Ensure MongoDB is running (local)

### GitHub OAuth Error

**Problem**: OAuth redirect fails

**Solution**:

- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Check `GITHUB_CALLBACK_URL` matches in GitHub OAuth app settings
- Ensure `FRONTEND_URL` is correct

### Token Invalid/Expired

**Problem**: API returns 401 Unauthorized

**Solution**:

- Token expired - login again
- Check `JWT_SECRET` matches between sessions
- Verify `Authorization: Bearer <token>` header format

## Migration from Old System

If you have existing deployments without authentication:

1. **Backward compatibility**: Old `/api/v1/deploy/legacy` endpoint still works
2. **Gradual migration**: Users can login and existing deployments continue working
3. **Import deployments**: Create a script to import existing deployments to MongoDB

## Next Steps

1. **Frontend**: Build React/Vue app with OAuth login
2. **Dashboard**: Create UI to browse repos and manage deployments
3. **Webhooks**: Already automated with user's GitHub token
4. **Monitoring**: Add deployment logs and status tracking

## Support

- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system architecture
- See [AUTO_REDEPLOY_SETUP.md](./AUTO_REDEPLOY_SETUP.md) for webhook details
- See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for testing procedures
