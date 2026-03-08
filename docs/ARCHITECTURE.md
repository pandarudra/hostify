# Auto-Redeploy Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                        │
│                                                                  │
│  User pushes code ──▶ GitHub triggers webhook                   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 │ POST /int/api/v1/webhook/gh
                                 │ X-Hub-Signature-256: sha256=...
                                 │ X-GitHub-Event: push
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Hostify Backend                             │
│                                                                  │
│  1. Verify Signature ✓                                          │
│     │                                                            │
│     ├─▶ HMAC SHA-256 with GITHUB_WEBHOOK_SECRET                 │
│     └─▶ Reject if invalid ❌                                    │
│                                                                  │
│  2. Parse Webhook Payload                                       │
│     │                                                            │
│     ├─▶ Extract: repo URL, branch, pusher, commits              │
│     └─▶ Filter: Only process "push" events                      │
│                                                                  │
│  3. Lookup Projects ──▶ Cloudflare KV                           │
│     │                   "repo:github.com/user/repo.git"         │
│     │                   Returns: ["app", "app-staging"]         │
│     │                                                            │
│     └─▶ For each subdomain:                                     │
│         │                                                        │
│         ├─▶ Get metadata: "metadata:app"                        │
│         │   Returns: {subdomain, folderName, repoUrl, ...}      │
│         │                                                        │
│         ├─▶ Clone repo from GitHub                              │
│         │                                                        │
│         ├─▶ Upload to Azure Storage                             │
│         │                                                        │
│         ├─▶ Update lastDeployedAt timestamp                     │
│         │                                                        │
│         └─▶ Clean up local files                                │
│                                                                  │
│  4. Return Response                                             │
│     │                                                            │
│     └─▶ {                                                        │
│           "success": true,                                       │
│           "results": [...],                                      │
│           "summary": {successful: 2, failed: 0}                  │
│         }                                                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Cloudflare KV                              │
│                                                                  │
│  Stored Data:                                                   │
│  ┌────────────────────────────────────────────────────┐        │
│  │ Key: "app"                                          │        │
│  │ Value: "repo-abc123"                                │        │
│  └────────────────────────────────────────────────────┘        │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐        │
│  │ Key: "metadata:app"                                 │        │
│  │ Value: {                                            │        │
│  │   "subdomain": "app",                               │        │
│  │   "folderName": "repo-abc123",                      │        │
│  │   "repoUrl": "https://github.com/user/repo.git",    │        │
│  │   "createdAt": "2026-03-08T10:00:00Z",              │        │
│  │   "lastDeployedAt": "2026-03-08T14:30:00Z"          │        │
│  │ }                                                   │        │
│  └────────────────────────────────────────────────────┘        │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐        │
│  │ Key: "repo:https://github.com/user/repo.git"        │        │
│  │ Value: ["app", "app-staging", "app-dev"]            │        │
│  └────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Azure Blob Storage                         │
│                                                                  │
│  Container: $web                                                │
│  ┌────────────────────────────────────────────────────┐        │
│  │ repo-abc123/                                        │        │
│  │   ├── index.html                                    │        │
│  │   ├── style.css                                     │        │
│  │   └── script.js                                     │        │
│  └────────────────────────────────────────────────────┘        │
│                                                                  │
│  Accessible at: https://app.rudrax.me                           │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Initial Deployment

```
User/Client
    │
    │ POST /api/v1/deploy
    │ {ghlink: "...", subdomain: "app"}
    ▼
Backend
    │
    ├─▶ Clone repo ──▶ local/repo-abc123/
    │
    ├─▶ Upload to Azure ──▶ $web/repo-abc123/
    │
    ├─▶ Save to Cloudflare KV:
    │   ├── "app" → "repo-abc123"
    │   ├── "metadata:app" → {subdomain, folder, repo, timestamps}
    │   └── "repo:github.com/user/repo.git" → ["app"]
    │
    └─▶ Return: {
          url: "https://app.rudrax.me",
          subdomain: "app",
          folderName: "repo-abc123"
        }
```

## Data Flow: Auto-Redeploy

```
GitHub Push Event
    │
    │ Webhook with signature
    ▼
Backend Webhook Handler
    │
    ├─▶ 1. Verify Signature
    │      ├── Calculate expected signature
    │      ├── Compare with received signature
    │      └── Continue if valid ✓
    │
    ├─▶ 2. Extract repo URL from payload
    │
    ├─▶ 3. Query Cloudflare KV
    │      Key: "repo:github.com/user/repo.git"
    │      Returns: ["app", "app-staging"]
    │
    ├─▶ 4. For each subdomain:
    │      │
    │      ├─▶ Get metadata from KV
    │      │   Key: "metadata:app"
    │      │
    │      ├─▶ Clone & Upload (same as initial deploy)
    │      │
    │      └─▶ Update lastDeployedAt
    │
    └─▶ 5. Return detailed results
```

## Security Flow

```
GitHub
    │
    │ Creates signature:
    │ HMAC-SHA256(payload, WEBHOOK_SECRET)
    │
    │ Sends: X-Hub-Signature-256: sha256=abc123...
    ▼
Backend
    │
    ├─▶ Receives payload + signature
    │
    ├─▶ Calculates expected signature:
    │   HMAC-SHA256(received_payload, GITHUB_WEBHOOK_SECRET)
    │
    ├─▶ Compares signatures (timing-safe)
    │   crypto.timingSafeEqual(sig1, sig2)
    │
    └─▶ If match: Process ✓
        If not: Reject with 401 ❌
```

## Multi-Project Example

```
Same Repository: github.com/user/myapp
    │
    ├─▶ Deployment 1: "myapp" (Production)
    │   └── https://myapp.rudrax.me
    │
    ├─▶ Deployment 2: "myapp-staging" (Staging)
    │   └── https://myapp-staging.rudrax.me
    │
    └─▶ Deployment 3: "myapp-dev" (Development)
        └── https://myapp-dev.rudrax.me

When you push to GitHub:
    │
    └─▶ Webhook triggers ──▶ All 3 deployments redeploy automatically! 🚀
```

## File Structure

```
hostify/
├── be/
│   ├── src/
│   │   ├── constants/
│   │   │   └── e.ts                    # Environment config + GITHUB_WEBHOOK_SECRET
│   │   ├── controllers/
│   │   │   ├── deploy.controllers.ts   # Initial deployment
│   │   │   └── git.controllers.ts      # ⭐ Webhook handler (NEW)
│   │   ├── helpers/
│   │   │   └── upload.ts               # Deploy logic + metadata save
│   │   ├── router/
│   │   │   ├── deploy.router.ts        # /api/v1/deploy
│   │   │   └── git.router.ts           # /int/api/v1/webhook/gh
│   │   └── utils/
│   │       ├── cloudflare.ts           # ⭐ KV storage (ENHANCED)
│   │       └── git.ts                  # Git clone operations
│   ├── test/
│   │   └── test-webhook.js         # ⭐ Testing tool (NEW)
│   ├── scripts/
│   │   └── test-todolist.sh        # ⭐ Automated test (NEW)
│   └── .env.example                # ⭐ Example config (NEW)
├── AUTO_REDEPLOY_SETUP.md             # ⭐ Complete guide (NEW)
├── IMPLEMENTATION_SUMMARY.md          # ⭐ What changed (NEW)
├── SETUP_CHECKLIST.md                 # ⭐ Setup steps (NEW)
├── QUICKSTART.md                      # ⭐ 5-minute guide (NEW)
└── README.md                          # Updated with auto-redeploy info
```

## Key Components

### 1. Webhook Handler (`git.controllers.ts`)

- ✅ Signature verification
- ✅ Event filtering (push only)
- ✅ Project lookup
- ✅ Multi-project redeployment
- ✅ Error handling
- ✅ Detailed logging

### 2. Cloudflare KV Storage (`cloudflare.ts`)

**New Functions:**

- `saveProjectMetadata()` - Store complete project info
- `getProjectMetadata()` - Retrieve project by subdomain
- `getSubdomainsByRepo()` - Find all projects for a repo

**Data Structure:**

- `subdomain` → `folderName`
- `metadata:subdomain` → Full metadata object
- `repo:repoUrl` → Array of subdomains

### 3. Deploy Flow (`upload.ts`)

- Enhanced to save metadata on every deployment
- Tracks creation and deployment timestamps
- Backward compatible with existing deployments

## Environment Variables

```env
# Required for auto-redeploy
GITHUB_WEBHOOK_SECRET=your_secret_here

# Required for storage
CF_ACCOUNT_ID=...
CF_KV_NAMESPACE_ID=...
CF_API_TOKEN=...
AZURE_STORAGE_ACCOUNT_NAME=...
AZURE_STORAGE_CONTAINER_NAME=$web
AZURE_STORAGE_SAS_TOKEN=...
```

## API Endpoints

### Deploy Project

```
POST /api/v1/deploy
Body: {ghlink, subdomain?}
Response: {success, blobPath: {url, subdomain, folderName}}
```

### GitHub Webhook

```
POST /int/api/v1/webhook/gh
Headers:
  X-Hub-Signature-256: sha256=...
  X-GitHub-Event: push
Body: GitHub webhook payload
Response: {success, results, summary}
```

---

**Visual Summary:**

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   GitHub     │────▶│   Hostify    │────▶│  Cloudflare  │
│ (Push Event) │     │  (Webhook)   │     │      KV      │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │    Azure     │
                     │   Storage    │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Your Site   │
                     │  Deployed ✓  │
                     └──────────────┘
```

🎉 **Auto-redeploy complete!**
