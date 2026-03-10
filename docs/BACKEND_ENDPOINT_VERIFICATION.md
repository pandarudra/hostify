# Backend API Endpoint Verification Report

## Summary

Backend endpoints have been verified against the frontend API configuration. Several mismatches were found and need to be resolved.

## Endpoint Analysis

### ✅ Authentication Endpoints (All Implemented)

| Frontend Endpoint               | Backend Route                        | Status         |
| ------------------------------- | ------------------------------------ | -------------- |
| `GET /api/auth/github`          | `authRouter.get("/github")`          | ✅ Implemented |
| `GET /api/auth/github/callback` | `authRouter.get("/github/callback")` | ✅ Implemented |
| `GET /api/auth/me`              | `authRouter.get("/me")`              | ✅ Implemented |
| `POST /api/auth/logout`         | `authRouter.post("/logout")`         | ✅ Implemented |

**Controller**: `auth.controllers.ts`

- `githubLogin`
- `githubCallback`
- `getCurrentUser`
- `logout`

---

### ❌ Repository Endpoints (Mismatches Found)

| Frontend Endpoint     | Backend Route           | Status          |
| --------------------- | ----------------------- | --------------- |
| `GET /api/repo`       | `GET /api/repositories` | ❌ **Mismatch** |
| `POST /api/repo/sync` | **Not implemented**     | ❌ **Missing**  |

**Controller**: `repo.controllers.ts`

- `listRepositories` (mapped to `/api/repositories`)

**Issues**:

1. Frontend expects `/api/repo` but backend uses `/api/repositories`
2. Sync endpoint (`/api/repo/sync`) is not implemented in backend

---

### ❌ Deployment Endpoints (Mismatches Found)

| Frontend Endpoint        | Backend Route                 | Status          |
| ------------------------ | ----------------------------- | --------------- |
| `GET /api/deploy`        | `GET /api/deployments`        | ❌ **Mismatch** |
| `POST /api/deploy`       | `POST /api/v1/deploy`         | ❌ **Mismatch** |
| `GET /api/deploy/:id`    | `GET /api/deployments/:id`    | ❌ **Mismatch** |
| `DELETE /api/deploy/:id` | `DELETE /api/deployments/:id` | ❌ **Mismatch** |

**Controllers**:

- `deploy.controllers.ts`: `deployWithAuth`, `deployLegacy`
- `repo.controllers.ts`: `listDeployments`, `getDeployment`, `deleteDeployment`

**Issues**:

1. Create deployment: Frontend expects `/api/deploy` but backend uses `/api/v1/deploy`
2. List deployments: Frontend expects `/api/deploy` but backend uses `/api/deployments`
3. Get deployment: Frontend expects `/api/deploy/:id` but backend uses `/api/deployments/:id`
4. Delete deployment: Frontend expects `/api/deploy/:id` but backend uses `/api/deployments/:id`

---

### ❌ Git Webhook Endpoint (Mismatch Found)

| Frontend Endpoint       | Backend Route                  | Status          |
| ----------------------- | ------------------------------ | --------------- |
| `POST /api/git/webhook` | `POST /api/git/webhook/:token` | ❌ **Mismatch** |

**Controller**: `git.controllers.ts`

- `githubWebhook`

**Issues**:

1. Frontend expects `/api/git/webhook` but backend requires `/api/git/webhook/:token`
2. Backend uses token-based webhook URLs (each project gets unique URL)

---

## Router Mounting Configuration

```typescript
// server.ts
app.use("/api/git", router.gitRouter); // Git webhook routes
app.use("/api/auth", router.authRouter); // Authentication routes
app.use("/api/v1/deploy", router.deployRouter); // Deployment routes
app.use("/api", router.repoRouter); // Repository routes
```

---

## Recommendations

### Option 1: Update Frontend to Match Backend (Recommended)

Update `fe/src/lib/constants/api.ts` to match backend routes:

```typescript
export const API_ENDPOINTS = {
  auth: {
    github: `${API_URL}/api/auth/github`,
    githubCallback: `${API_URL}/api/auth/github/callback`,
    me: `${API_URL}/api/auth/me`,
    logout: `${API_URL}/api/auth/logout`,
  },
  repo: {
    list: `${API_URL}/api/repositories`, // Changed from /api/repo
    // sync: Not implemented in backend yet
  },
  deploy: {
    list: `${API_URL}/api/deployments`, // Changed from /api/deploy
    create: `${API_URL}/api/v1/deploy`, // Changed from /api/deploy
    details: (id: string) => `${API_URL}/api/deployments/${id}`, // Changed
    delete: (id: string) => `${API_URL}/api/deployments/${id}`, // Changed
  },
  git: {
    webhook: (token: string) => `${API_URL}/api/git/webhook/${token}`, // Added token param
  },
};
```

### Option 2: Update Backend to Match Frontend

Alternatively, update backend routes to match frontend expectations (requires more backend changes).

---

## Missing Implementations

### 1. Repository Sync Endpoint

**Frontend expects**: `POST /api/repo/sync`

**Action needed**: Implement sync endpoint in backend

- Add `syncRepositories` controller in `repo.controllers.ts`
- Add route in `repo.router.ts`
- Sync user's repositories from GitHub

---

## Security Notes

- All `/api/v1/deploy` endpoints require authentication (Bearer token)
- All `/api/repositories` and `/api/deployments` endpoints require authentication
- Webhook endpoints use token-based authentication via URL parameter
- Auth endpoints use JWT tokens stored in cookies (configured for security)

---

## Next Steps

1. ✅ Update frontend API endpoints to match backend
2. ⚠️ Consider implementing missing `/sync` endpoint
3. ⚠️ Document webhook token usage pattern
4. ✅ Test all endpoints after updates
