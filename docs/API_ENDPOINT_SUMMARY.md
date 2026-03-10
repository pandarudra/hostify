# API Endpoint Summary

## Overview

This document provides a complete overview of all API endpoints in the Hostify backend and their frontend integration.

## ✅ Complete Endpoint Status

### Authentication Endpoints

| Method | Endpoint                    | Frontend Constant                   | Backend Controller | Status |
| ------ | --------------------------- | ----------------------------------- | ------------------ | ------ |
| GET    | `/api/auth/github`          | `API_ENDPOINTS.auth.github`         | `githubLogin`      | ✅     |
| GET    | `/api/auth/github/callback` | `API_ENDPOINTS.auth.githubCallback` | `githubCallback`   | ✅     |
| GET    | `/api/auth/me`              | `API_ENDPOINTS.auth.me`             | `getCurrentUser`   | ✅     |
| POST   | `/api/auth/logout`          | `API_ENDPOINTS.auth.logout`         | `logout`           | ✅     |

**Router**: `authRouter` mounted at `/api/auth`
**Authentication**: GitHub OAuth, JWT Bearer tokens

---

### Repository Endpoints

| Method | Endpoint            | Frontend Constant         | Backend Controller | Status |
| ------ | ------------------- | ------------------------- | ------------------ | ------ |
| GET    | `/api/repositories` | `API_ENDPOINTS.repo.list` | `listRepositories` | ✅     |

**Router**: `repoRouter` mounted at `/api`
**Authentication**: Required (Bearer token)

**Note**: Repository data is fetched directly from GitHub API. No sync endpoint needed as it's real-time.

---

### Deployment Endpoints

| Method | Endpoint               | Frontend Constant                  | Backend Controller | Status |
| ------ | ---------------------- | ---------------------------------- | ------------------ | ------ |
| POST   | `/api/v1/deploy`       | `API_ENDPOINTS.deploy.create`      | `deployWithAuth`   | ✅     |
| GET    | `/api/deployments`     | `API_ENDPOINTS.deploy.list`        | `listDeployments`  | ✅     |
| GET    | `/api/deployments/:id` | `API_ENDPOINTS.deploy.details(id)` | `getDeployment`    | ✅     |
| DELETE | `/api/deployments/:id` | `API_ENDPOINTS.deploy.delete(id)`  | `deleteDeployment` | ✅     |

**Routers**:

- `deployRouter` mounted at `/api/v1/deploy`
- `repoRouter` mounted at `/api` (for list, get, delete)

**Authentication**: Required (Bearer token)

---

### Git Webhook Endpoints

| Method | Endpoint                  | Frontend Constant                  | Backend Controller | Status |
| ------ | ------------------------- | ---------------------------------- | ------------------ | ------ |
| POST   | `/api/git/webhook/:token` | `API_ENDPOINTS.git.webhook(token)` | `githubWebhook`    | ✅     |

**Router**: `gitRouter` mounted at `/api/git`
**Authentication**: Token-based (unique URL per deployment)

---

## Frontend Integration

### Import Endpoints

```typescript
import { API_ENDPOINTS } from "$lib";
// or
import { API_ENDPOINTS } from "$lib/constants/api";
```

### Usage Examples

```typescript
// Authentication
window.location.href = API_ENDPOINTS.auth.github;

// Fetch user data
const response = await fetch(API_ENDPOINTS.auth.me, {
  headers: getAuthHeaders(),
});

// List repositories
const repos = await fetch(API_ENDPOINTS.repo.list, {
  headers: getAuthHeaders(),
});

// Create deployment
const deployment = await fetch(API_ENDPOINTS.deploy.create, {
  method: "POST",
  headers: getAuthHeaders(),
  body: JSON.stringify({
    ghlink: "https://github.com/user/repo.git",
    subdomain: "my-site",
  }),
});

// Get deployment details
const details = await fetch(API_ENDPOINTS.deploy.details("deployment-id"), {
  headers: getAuthHeaders(),
});

// Delete deployment
await fetch(API_ENDPOINTS.deploy.delete("deployment-id"), {
  method: "DELETE",
  headers: getAuthHeaders(),
});

// Webhook URL (used by GitHub)
const webhookUrl = API_ENDPOINTS.git.webhook("unique-token-here");
```

---

## Helper Functions

### Authentication Helpers

```typescript
import {
  getAuthHeaders,
  isAuthenticated,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from "$lib";

// Get headers with Bearer token
const headers = getAuthHeaders();

// Check if user is logged in
if (isAuthenticated()) {
  // User is authenticated
}

// Get token directly
const token = getAuthToken();

// Set token (login)
setAuthToken("jwt-token-here");

// Clear token (logout)
clearAuthToken();
```

---

## Request/Response Formats

### Create Deployment Request

```typescript
{
  ghlink: string;      // GitHub repository URL (HTTPS clone URL)
  subdomain?: string;  // Optional custom subdomain
}
```

### Deployment Response

```typescript
{
  success: boolean;
  message: string;
  deployment?: {
    _id: string;
    userId: string;
    subdomain: string;
    githubRepo: string;
    branch: string;
    status: 'active' | 'inactive' | 'deploying' | 'failed';
    deployedAt: string;
    lastDeployedAt?: string;
    webhookToken: string;
    containerUrl: string;
  };
}
```

### Repository List Response

```typescript
{
  success: boolean;
  repositories: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    clone_url: string;
    description: string | null;
    default_branch: string;
    updated_at: string;
    language: string | null;
    stargazers_count: number;
    owner: {
      login: string;
      avatar_url: string;
    };
  }>;
}
```

---

## Security

### Authentication Methods

1. **GitHub OAuth**: Initial authentication flow
2. **JWT Bearer Tokens**: API authentication
3. **Webhook Tokens**: Per-deployment unique tokens

### Token Storage

- Tokens stored in secure HTTP-only cookies (recommended for production)
- `SameSite=Strict` for CSRF protection
- `Secure` flag for HTTPS-only transmission
- 7-day expiration

### Protected Routes

All routes except the following require authentication:

- `/api/auth/github` (OAuth initiation)
- `/api/auth/github/callback` (OAuth callback)
- `/api/git/webhook/:token` (Uses token authentication)

---

## Environment Configuration

### Frontend (.env)

```env
PUBLIC_API_URL=http://localhost:8000
PUBLIC_PROD_API_URL=https://hostify-be.onrender.com
PUBLIC_ENV=local
```

### Backend (.env)

```env
PORT=8000
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/github/callback
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
```

---

## Documentation

- **Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`
- **Swagger JSON**: `http://localhost:8000/api/swagger.json`

---

## Testing

### Test Authentication Flow

1. Visit `/auth` on frontend
2. Click "Continue with GitHub"
3. Authorize on GitHub
4. Redirected back with token
5. Token stored in cookie
6. Access protected routes

### Test API Endpoints

```bash
# Get user info
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List repositories
curl -X GET http://localhost:8000/api/repositories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create deployment
curl -X POST http://localhost:8000/api/v1/deploy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ghlink": "https://github.com/user/repo.git", "subdomain": "my-site"}'
```

---

## Changes Made

### ✅ Updated Files

1. **`fe/src/lib/constants/api.ts`**
   - Updated all endpoints to match backend routes
   - Changed `/api/repo` → `/api/repositories`
   - Changed `/api/deploy` → `/api/v1/deploy` (create)
   - Changed `/api/deploy` → `/api/deployments` (list/get/delete)
   - Changed webhook to include token parameter
   - Removed non-existent sync endpoint

2. **`fe/src/lib/index.ts`**
   - Added export for `api.ts`
   - Added export for `helpers.ts`

3. **`docs/BACKEND_ENDPOINT_VERIFICATION.md`**
   - Created verification report documenting all mismatches

4. **`docs/API_ENDPOINT_SUMMARY.md`**
   - Created comprehensive API documentation

---

## Future Enhancements

### Potential Additions

1. **Repository Sync Endpoint** (if needed)
   - `POST /api/repositories/sync`
   - Manually trigger repository sync from GitHub

2. **Deployment Logs**
   - `GET /api/deployments/:id/logs`
   - View deployment logs and build output

3. **Deployment Rollback**
   - `POST /api/deployments/:id/rollback`
   - Rollback to previous deployment

4. **Custom Domain Management**
   - `POST /api/deployments/:id/domain`
   - `DELETE /api/deployments/:id/domain`
   - Manage custom domain associations

---

## Conclusion

All backend endpoints have been verified and the frontend API configuration has been updated to match. The application now has a consistent API contract between frontend and backend with proper authentication and security measures in place.
