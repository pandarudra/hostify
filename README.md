# Hostify 🚀

> **Deploy static websites from GitHub to the cloud in one click** — Like Vercel/Netlify, but self-hosted with full control.

A modern full-stack deployment platform that automatically deploys static websites from GitHub repositories to Azure Blob Storage with automatic webhook-driven rebuilds, custom subdomains, and a beautiful web dashboard.

---

## 🎯 What is Hostify?

**Hostify** is a free, open-source alternative to Vercel/Netlify that lets you:

- **Deploy static websites** from any public GitHub repository
- **Auto-redeploy on push** with GitHub webhooks (like Vercel/Netlify)
- **Use custom subdomains** or auto-generated ones
- **Manage deployments** from an intuitive dashboard
- **Authenticate with GitHub OAuth** for secure, seamless login

### Tech Stack

**Backend:**

- Express.js with TypeScript
- MongoDB for user data and deployment tracking
- Azure Blob Storage for production hosting
- Cloudflare KV for subdomain routing
- GitHub Webhooks for auto-redeploy

**Frontend:**

- SvelteKit with TypeScript
- Tailwind CSS for styling
- Vite for fast development
- Playwright for E2E testing

**Infrastructure:**

- Docker & Docker Compose for local development
- GitHub OAuth 2.0 for authentication

---

## ✨ Key Features

**🔐 Authentication & Security:**

- GitHub OAuth 2.0 login
- Secure webhook signature verification
- User account management
- 2FA support for enhanced security

**📦 Deployment:**

- One-click GitHub repository deployment
- Automatic webhook-driven redeployment on push
- Deploy the same repo multiple times with different subdomains
- Support for public GitHub repositories
- Smart automatic path fixing for asset loading
- Proper MIME type detection and content-type headers

**🌐 Subdomain Management:**

- Custom subdomain support
- Auto-generated subdomain fallback
- Cloudflare KV-powered subdomain routing
- Subdomain-to-deployment mapping

**📊 Dashboard:**

- Browse personal GitHub repositories
- View all active deployments
- Track deployment history
- Manage automatic webhook configuration
- Real-time deployment status

**☁️ Cloud Integration:**

- Azure Blob Storage integration
- Cloudflare KV for routing
- GitHub API integration
- Automatic cleanup of local files

**🚀 Performance & Optimization:**

- Optimized caching headers (1h for HTML, 1y for assets)
- Automatic cleanup of temporary files
- Development vs Production modes
- Local file system support for development

---

## 📦 Prerequisites

## � Prerequisites

### Required

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Git** for cloning the repository

### For Production Deployment

- **Azure Storage Account** with static website hosting enabled
- **Azure Storage SAS Token** with appropriate permissions (Read, Write, Delete, List)
- **Cloudflare Account** with Workers KV enabled (optional for development)
- **GitHub OAuth Application** (for authentication)

### For Development

- **Docker** and **Docker Compose** (recommended for containerized dev)
- **MongoDB** (or use Docker container)
- **Redis** (or use Docker container for local KV substitute)

---

## 🚀 Quick Start

### Option 1: Docker (Recommended for Development)

The fastest way to get everything running locally:

```bash
# Clone the repository
git clone https://github.com/pandarudra/hostify.git
cd hostify

# Start all services (MongoDB, Redis, Backend, Frontend)
docker compose up --build

# Services running at:
# - Frontend: http://localhost:4173
# - Backend: http://localhost:8000
# - MongoDB: mongodb://localhost:27017
# - Redis: localhost:6379
```

**To stop all services:**

```bash
docker compose down
```

### Option 2: Local Development Setup

If you prefer to run services locally:

```bash
# Clone the repository
git clone https://github.com/pandarudra/hostify.git
cd hostify

# Install all dependencies
make install

# Or manually:
cd be && npm install && cd ..
cd fe && npm install && cd ..
```

### Option 3: Manual Backend-Only Setup

If you only want to run the backend:

```bash
cd be
npm install

# Create .env file (see Configuration section)
cp .env.example .env
# Edit .env with your configuration

npm run dev
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `be/` directory with the following variables:

```env
# Server Configuration
PORT=8000
ENV=dev                    # or 'production'
UPLOAD_DIR=./local         # Local directory for temporary file storage

# Database Configuration
MONGODB_URI=mongodb://mongo:27017/hostify
DATABASE_NAME=hostify

# Frontend URLs
FRONTEND_URL=http://localhost:4173
LOCAL_FRONTEND_URL=http://localhost:4173

# GitHub OAuth (Required for authentication)
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/github/callback

# GitHub Webhook (Required for auto-redeploy)
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# Azure Storage (Required for production)
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_STORAGE_CONTAINER_NAME=$web                  # Use $web for static hosting
AZURE_STORAGE_SAS_TOKEN=sv=2024-11-04&ss=...

# Cloudflare KV (Optional for dev, Required for production)
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_KV_NAMESPACE_ID=your-kv-namespace-id
CF_API_TOKEN=your-cloudflare-api-token

# Redis (If using external Redis)
# REDIS_URL=redis://localhost:6379
```

### Environment Variables Reference

| Variable                       | Type   | Required | Default | Description                      |
| ------------------------------ | ------ | -------- | ------- | -------------------------------- |
| `PORT`                         | number | Yes      | 8000    | Server port                      |
| `ENV`                          | string | Yes      | dev     | `dev` or `production`            |
| `UPLOAD_DIR`                   | string | Yes      | ./local | Temporary file storage directory |
| `MONGODB_URI`                  | string | Yes      | -       | MongoDB connection string        |
| `DATABASE_NAME`                | string | Yes      | hostify | Database name                    |
| `FRONTEND_URL`                 | string | Yes      | -       | Production frontend URL          |
| `LOCAL_FRONTEND_URL`           | string | Yes      | -       | Local frontend URL (dev)         |
| `GITHUB_CLIENT_ID`             | string | Yes\*    | -       | GitHub OAuth app ID              |
| `GITHUB_CLIENT_SECRET`         | string | Yes\*    | -       | GitHub OAuth app secret          |
| `GITHUB_CALLBACK_URL`          | string | Yes\*    | -       | GitHub OAuth callback URL        |
| `GITHUB_WEBHOOK_SECRET`        | string | No       | -       | Webhook signature secret         |
| `AZURE_STORAGE_ACCOUNT_NAME`   | string | Yes\*    | -       | Azure storage account            |
| `AZURE_STORAGE_CONTAINER_NAME` | string | Yes\*    | $web    | Azure storage container          |
| `AZURE_STORAGE_SAS_TOKEN`      | string | Yes\*    | -       | Azure SAS token                  |
| `CF_ACCOUNT_ID`                | string | Prod     | -       | Cloudflare account ID            |
| `CF_KV_NAMESPACE_ID`           | string | Prod     | -       | Cloudflare KV namespace          |
| `CF_API_TOKEN`                 | string | Prod     | -       | Cloudflare API token             |

**\* Required for OAuth authentication**  
**\* Required for Azure production deployment**

### Azure Storage Setup

### Azure Storage Setup

For production deployments, you'll need an Azure Storage Account:

1. **Create a Storage Account** in Azure Portal
2. **Enable Static website hosting**:
   - Go to Storage Account → Static website
   - Enable it and note the "Primary endpoint"
   - This creates a `$web` container automatically

3. **Generate a SAS Token**:
   - Storage Account → Shared access signature
   - Select permissions: **Read, Write, Delete, List**
   - Resource types: **Container, Object**
   - Set appropriate expiration date
   - Click "Generate SAS and connection string"
   - Copy the SAS token (starts with `sv=`)

4. **Add to your `.env`**:
   ```env
   AZURE_STORAGE_ACCOUNT_NAME=your-account-name
   AZURE_STORAGE_CONTAINER_NAME=$web
   AZURE_STORAGE_SAS_TOKEN=sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlac&se=2025-12-31...
   ```

### GitHub OAuth Setup

To enable user authentication:

1. **Create GitHub OAuth App**:
   - Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Fill in the application details:
     - **Application name**: Hostify
     - **Homepage URL**: `http://localhost:8000` (dev) or your production URL
     - **Authorization callback URL**: `http://localhost:8000/api/auth/github/callback`

2. **Get your credentials**:
   - Copy "Client ID" and "Client Secret"
   - Add to your `.env`:
     ```env
     GITHUB_CLIENT_ID=your-client-id
     GITHUB_CLIENT_SECRET=your-client-secret
     GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/github/callback
     ```

### Cloudflare KV Setup

For production subdomain routing (optional for dev):

1. **Create a KV Namespace**:
   - Go to Cloudflare Dashboard → Workers & Pages → KV
   - Click "Create namespace"
   - Name it something like `hostify-kv`

2. **Get your credentials**:
   - Copy your **Account ID** (visible in Cloudflare Dashboard)
   - Copy the **Namespace ID** from KV page
3. **Create API Token**:
   - Cloudflare Dashboard → My Profile → API Tokens
   - Click "Create Token"
   - Select template "Edit Cloudflare Workers"
   - Add permission: "Account > Workers KV Storage > Edit"
   - Create and copy the token

4. **Add to your `.env`**:
   ```env
   CF_ACCOUNT_ID=abc123xyz...
   CF_KV_NAMESPACE_ID=xyz789abc...
   CF_API_TOKEN=your-api-token...
   ```

---

## 🚀 Usage Guide

### Development

### Development

**Using Makefile (recommended):**

```bash
# Start both backend and frontend in tmux session
make dev

# Or run individually:
make run-backend   # Backend only
make run-frontend  # Frontend only
```

**Using npm directly:**

```bash
# Backend (from be/ directory)
npm run dev

# Frontend (from fe/ directory)
npm run dev
```

### Production Build

```bash
# Backend
cd be
npm run build
npm start

# Frontend
cd fe
npm run build
npm preview
```

### Make Commands

```bash
make install              # Install all dependencies
make install-backend      # Install backend deps only
make install-frontend     # Install frontend deps only
make dev                  # Start both in tmux
make run-backend          # Run backend only
make run-frontend         # Run frontend only
make stop                 # Stop dev environment
make restart              # Restart dev environment
make clean-local          # Clean local files
make test-prod-backend    # Test against production
make test-local-backend   # Test against local
```

---

## 📚 API Documentation

### Interactive API Docs

Once the backend is running, access interactive documentation:

- **Swagger UI**: [http://localhost:8000/api-docs](http://localhost:8000/api-docs)
  - Try API endpoints directly in your browser
  - View request/response schemas
  - See example payloads

- **ReDoc**: [http://localhost:8000/api-docs-redoc](http://localhost:8000/api-docs-redoc)
  - Clean, organized API reference
  - Detailed explanations and examples
  - Better for reading and sharing

- **OpenAPI JSON**: [http://localhost:8000/swagger.json](http://localhost:8000/swagger.json)
  - Raw OpenAPI 3.0 specification
  - Import into Postman, Insomnia, etc.

### Core Endpoints

#### Deploy Endpoint

**POST** `/api/v1/deploy` — Deploy a GitHub repository

**Request:**

```json
{
  "ghlink": "https://github.com/username/repository.git",
  "subdomain": "my-custom-subdomain"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Deployment successful",
  "blobPath": {
    "folderName": "repository-abc123",
    "subdomain": "my-custom-subdomain",
    "url": "https://my-custom-subdomain.rudrax.me"
  }
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-------------|--------|----------|-------------|
| `ghlink` | string | Yes | GitHub repository URL (public repos only) |
| `subdomain` | string | No | Custom subdomain (auto-generated if omitted) |

#### Webhook Endpoint

**POST** `/int/api/v1/webhook/gh` — GitHub webhook for auto-redeploy

Automatically triggered when you push to GitHub (requires webhook setup).

### Using the API

**With cURL:**

```bash
# Deploy with custom subdomain
curl -X POST http://localhost:8000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/repository.git",
    "subdomain": "my-awesome-site"
  }'

# Deploy with auto-generated subdomain
curl -X POST http://localhost:8000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{"ghlink": "https://github.com/username/repository.git"}'
```

**With JavaScript/Fetch:**

```javascript
const response = await fetch("http://localhost:8000/api/v1/deploy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ghlink: "https://github.com/username/repository.git",
    subdomain: "my-awesome-site",
  }),
});

const data = await response.json();
console.log(data.blobPath.url); // https://my-awesome-site.rudrax.me
```

**With Postman:**

1. Create a new POST request to `http://localhost:8000/api/v1/deploy`
2. Go to Body → raw → select JSON
3. Paste the request JSON
4. Click Send

---

## 🔄 Auto-Redeploy with GitHub Webhooks

Deploy automatically every time you push to GitHub — just like Vercel, Netlify, and other modern hosting platforms!

### Setup Steps

1. **Deploy your repository** first:

   ```bash
   curl -X POST http://localhost:8000/api/v1/deploy \
     -H "Content-Type: application/json" \
     -d '{
       "ghlink": "https://github.com/username/my-repo",
       "subdomain": "my-app"
     }'
   ```

2. **Generate a webhook secret** (for security):

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Add the output to your `.env`:

   ```env
   GITHUB_WEBHOOK_SECRET=your-generated-secret-here
   ```

3. **Create GitHub Webhook**:
   - Go to your repository on GitHub
   - Settings → Webhooks → Add webhook
   - Fill in:
     - **Payload URL**: `http://your-domain.com/int/api/v1/webhook/gh`
       - For local dev: `http://localhost:8000/int/api/v1/webhook/gh`
     - **Content type**: `application/json`
     - **Secret**: Your `GITHUB_WEBHOOK_SECRET` value
     - **Events**: Select "Just the push event" (or "Send me everything")
   - Click "Add webhook"

4. **Test it out**:
   - Make a commit and push to GitHub
   - Your site will automatically rebuild and redeploy!

### How It Works

```
┌─────────────────────────┐
│   You push to GitHub    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ GitHub sends webhook    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Hostify verifies signature for safety │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Finds all deployments for that repo  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Clones repo & uploads to Azure       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Website is live with your changes!   │
└─────────────────────────────────────┘
```

### Testing Webhooks

**Manual test with included test script:**

```bash
cd be
node test/test-webhook.js http://localhost:8000 https://github.com/username/repo.git your-webhook-secret
```

**Or use the automated test:**

```bash
make test-local-backend
```

### Deploy Same Repo Multiple Times

You can deploy the same repository to multiple subdomains:

```bash
# Production
curl -X POST http://localhost:8000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{"ghlink": "https://github.com/username/repo", "subdomain": "my-app"}'

# Staging
curl -X POST http://localhost:8000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{"ghlink": "https://github.com/username/repo", "subdomain": "my-app-staging"}'
```

When you push, **both deployments automatically update**!

---

## 🏗️ How it Works

### Deployment Flow

1. **You submit a deployment request** with a GitHub URL
2. **Hostify clones the repository** to a temporary local directory
3. **Subdomain is assigned** (custom or auto-generated)
4. **Files are processed**:
   - Git folder excluded
   - Absolute paths fixed to relative paths
   - Proper MIME types detected

5. **Files uploaded to Azure** (production mode):
   - Uploaded to `$web` container in Azure Blob Storage
   - Subdomain-to-folder mapping stored in Cloudflare KV
   - Optimized cache control headers applied

6. **Your site is live!**
   - Accessible at your custom subdomain
   - Automatic redeploys with webhooks
   - Deployment metadata stored for future reference

### Development vs Production Mode

**Development Mode** (`ENV=dev`):

- Files stored locally in `UPLOAD_DIR`
- No Azure required
- No Cloudflare KV required (warnings only)
- Perfect for testing and development
- URLs: `http://localhost:8000/local/{folderName}`

**Production Mode** (`ENV=production`):

- Files uploaded to Azure Blob Storage
- Subdomains routed via Cloudflare KV
- Full CDN integration possible
- URLs: `https://{subdomain}.your-domain.com`

---

## 📁 Project Structure

```
hostify/
├── be/                              # Backend (Express.js + TypeScript)
│   ├── src/
│   │   ├── server.ts                # Express app setup
│   │   ├── config/
│   │   │   ├── database.ts          # MongoDB connection
│   │   │   ├── swagger.ts           # Swagger API docs
│   │   │   ├── redocly.ts           # ReDoc API docs
│   │   │   └── general.ts           # General config
│   │   ├── constants/
│   │   │   └── e.ts                 # Environment variables
│   │   ├── controllers/
│   │   │   ├── deploy.controllers.ts # Deployment logic
│   │   │   ├── auth.controllers.ts   # OAuth logic
│   │   │   ├── git.controllers.ts    # Git operations
│   │   │   ├── repo.controllers.ts   # Repository operations
│   │   │   ├── notifications.controllers.ts
│   │   │   └── settings.controllers.ts
│   │   ├── models/                  # MongoDB models
│   │   │   ├── User.ts
│   │   │   ├── Deployment.ts
│   │   │   ├── DeveloperSettings.ts
│   │   │   └── ...
│   │   ├── router/                  # API routes
│   │   │   ├── deploy.router.ts
│   │   │   ├── auth.router.ts
│   │   │   └── index.ts
│   │   ├── utils/                   # Helper utilities
│   │   │   ├── azureStorage.ts      # Azure integration
│   │   │   ├── cloudflare.ts        # Cloudflare KV integration
│   │   │   ├── git.ts               # Git operations
│   │   │   └── general.ts
│   │   ├── helpers/
│   │   │   ├── upload.ts            # File upload logic
│   │   │   └── emailTemplete.ts     # Email templates
│   │   ├── services/
│   │   │   ├── heatmap.ts
│   │   │   └── notifications.ts
│   │   └── scripts/
│   │       └── cleanup-all.ts       # Cleanup utility
│   ├── test/
│   │   └── test-webhook.js          # Webhook testing
│   ├── local/                       # Temporary deployment files
│   ├── package.json
│   └── tsconfig.json
│
├── fe/                              # Frontend (SvelteKit + Tailwind)
│   ├── src/
│   │   ├── app.html                 # HTML shell
│   │   ├── routes/                  # SvelteKit pages
│   │   ├── lib/                     # Reusable components
│   │   └── app.d.ts                 # TypeScript types
│   ├── e2e/                         # End-to-end tests
│   ├── static/                      # Static assets
│   ├── playwright.config.ts         # E2E config
│   ├── vite.config.ts               # Vite config
│   ├── tailwind.config.ts           # Tailwind config
│   └── package.json
│
├── docker/                          # Docker configurations
│   ├── be.Dockerfile               # Backend Docker image
│   ├── fe.Dockerfile               # Frontend Docker image
│   └── full.Dockerfile             # Full-stack image
│
├── docs/                            # Documentation
│   ├── ARCHITECTURE.md              # System architecture
│   ├── OAUTH_IMPLEMENTATION.md      # OAuth setup guide
│   ├── AUTO_REDEPLOY_SETUP.md       # Webhook setup guide
│   ├── BACKEND_ENDPOINT_VERIFICATION.md
│   ├── TESTING_GUIDE.md
│   └── ...
│
├── scripts/                         # Utility scripts
│   ├── deploy-with-webhook.sh       # Deployment helper
│   ├── setup-oauth.sh               # OAuth setup
│   ├── setup-frontend.sh            # Frontend setup
│   └── cleanup-all.sh               # Full cleanup
│
├── docker-compose.yml               # Local dev setup
├── Makefile                         # Build commands
├── README.md                        # This file
└── .gitignore
```

---

## 🏗️ Deployment Architecture

### Deployment Flow

1. **Submit Deployment Request** → Submit GitHub URL and optional subdomain
2. **Clone Repository** → Download latest code from GitHub
3. **Assign Subdomain** → Create custom or auto-generated subdomain
4. **Process Files** → Exclude git files, fix absolute paths, detect MIME types
5. **Upload to Azure** → Store all files in Azure Blob Storage with optimal caching
6. **Update Mappings** → Store subdomain-to-folder mapping in Cloudflare KV
7. **Website Live** → Accessible at your custom subdomain immediately

### How Auto-Redeploy Works

```
┌──────────────────────────────┐
│   You push code to GitHub    │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ GitHub sends webhook to Hostify  │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Verify webhook signature for safety
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Find all deployments for this repo
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ For each deployment:             │
│ • Clone latest code              │
│ • Upload to Azure                │
│ • Update Cloudflare KV           │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Your site is live with changes! 🎉
└──────────────────────────────────┘
```

---

## 🔐 Security & Performance

## � Security & Performance

### Security Features

- **Webhook Signature Verification**: Uses HMAC-SHA256 to verify GitHub webhooks
- **Security Headers**: Helmet.js provides comprehensive security headers
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: All user inputs validated for GitHub URLs
- **SAS Token Authentication**: Azure Storage access via time-limited tokens
- **Environment Separation**: Dev and production modes with different configurations

### Performance Optimizations

- **Smart Caching**: HTML updates frequently (1h cache), assets cached for 1 year
- **Automatic Cleanup**: Local temporary files deleted after successful upload
- **Efficient Routing**: Cloudflare KV for O(1) subdomain lookups
- **Proper Content-Types**: All files get correct MIME types for optimal delivery
- **Auto Path Fixing**: Assets load correctly from any subfolder
- **Scalable Architecture**: Ready for multiple concurrent deployments

---

## 🧪 Testing & Deployment

### Running Tests

**Test locally:**

```bash
make test-local-backend
```

**Test against production:**

```bash
make test-prod-backend
```

**Manual webhook testing:**

```bash
cd be
node test/test-webhook.js http://localhost:8000 https://github.com/username/repo.git your-webhook-secret
```

### E2E Testing (Frontend)

```bash
cd fe
npm run test:e2e       # Run E2E tests
npm run test:e2e:ui    # Run with UI
```

### Building for Production

**Backend:**

```bash
cd be
npm run build          # Compile TypeScript
npm start              # Run production server
```

**Frontend:**

```bash
cd fe
npm run build          # Create optimized build
npm run preview        # Preview the build locally
```

### Deploying with Docker

Build and run production containers:

```bash
docker build -f docker/be.Dockerfile -t hostify-backend .
docker build -f docker/fe.Dockerfile -t hostify-frontend .

docker run -p 8000:8000 --env-file .env hostify-backend
docker run -p 3000:3000 hostify-frontend
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

| Issue                                | Cause                             | Solution                                                               |
| ------------------------------------ | --------------------------------- | ---------------------------------------------------------------------- |
| **404 on CSS/JS files**              | Links use absolute paths          | Files are auto-fixed; ensure HTML doesn't use dynamic paths            |
| **Deployment fails with auth error** | Invalid Azure credentials         | Check SAS token validity and permissions (read, write, delete, list)   |
| **Clone command fails**              | Private repo or invalid URL       | Ensure repo is public; verify GitHub URL format                        |
| **Cloudflare KV not working**        | Invalid credentials in production | Verify API token has KV permissions; check Account ID and Namespace ID |
| **Port already in use**              | Another service using port 8000   | Change PORT in `.env` or stop conflicting service                      |
| **MongoDB connection fails**         | Database not running or bad URI   | Start MongoDB or check MONGODB_URI in `.env`                           |
| **Webhook doesn't trigger redeploy** | Webhook not configured correctly  | Verify webhook secret matches; check GitHub webhook delivery logs      |
| **Out of disk space**                | UPLOAD_DIR filling up             | Run `make clean-local` to remove old temporary files                   |

### Debug Mode

For more detailed logging, check:

- Backend logs: `npm run dev` shows all output
- Docker logs: `docker compose logs -f backend`
- MongoDB logs: `docker compose logs -f mongo`

### Useful Commands

```bash
# Clean up all local deployment files
make clean-local

# View make commands
make help

# Check environment setup
env | grep HOSTIFY

# Restart from scratch
docker compose down -v
docker compose up --build
```

---

## 📚 Additional Resources

**Documentation:**

- [Architecture Overview](docs/ARCHITECTURE.md) — System design and data flow
- [OAuth Implementation](docs/OAUTH_IMPLEMENTATION.md) — GitHub OAuth setup and flow
- [Auto-Redeploy Setup](docs/AUTO_REDEPLOY_SETUP.md) — Complete webhook guide
- [Webhook Testing](docs/AUTOMATED_WEBHOOK_SETUP.md) — Advanced webhook scenarios
- [API Verification](docs/BACKEND_ENDPOINT_VERIFICATION.md) — Endpoint testing guide

**External Links:**

- [Express.js](https://expressjs.com/) — Backend framework
- [SvelteKit](https://kit.svelte.dev/) — Frontend framework
- [Azure Storage](https://learn.microsoft.com/azure/storage/) — Cloud hosting
- [Cloudflare Workers KV](https://developers.cloudflare.com/workers/runtime-apis/kv/) — Subdomain routing
- [GitHub Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks) — Webhook documentation

---

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/hostify.git
   cd hostify
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/YourFeatureName
   ```

### Making Changes

1. **Make your changes** and test them locally
2. **Run tests** to ensure nothing broke:
   ```bash
   make test-local-backend
   ```
3. **Commit with clear messages**:
   ```bash
   git commit -m "feat: Add new deployment feature"
   ```
4. **Push to your fork**:
   ```bash
   git push origin feature/YourFeatureName
   ```
5. **Open a Pull Request** with a clear description

### Code Standards

- Use TypeScript for all backend code
- Follow the existing code structure and naming conventions
- Add comments for complex logic
- Test your changes before submitting
- Update documentation if needed

### Areas for Contribution

- 🐛 **Bug fixes** — Fix reported issues
- ✨ **Features** — Add new capabilities
- 📚 **Documentation** — Improve guides and examples
- 🧪 **Tests** — Add or improve test coverage
- 🎨 **UI/UX** — Enhance the frontend experience

---

## 📄 License

This project is licensed under the **ISC License** — see the LICENSE file for details.

---

## 🙏 Acknowledgments

**Built with awesome open-source projects:**

- **Express.js** — Fast, unopinionated Node.js web framework
- **SvelteKit** — Next-gen frontend framework with SSR
- **TypeScript** — Type-safe JavaScript development
- **Azure SDK** — Cloud storage integration
- **Cloudflare Workers KV** — Global key-value storage
- **GitHub API** — Repository access and OAuth
- **Swagger UI** — Modern API documentation
- **ReDoc** — Beautiful API reference
- **Docker** — Containerization and local development
- **MongoDB** — User data persistence
- **Tailwind CSS** — Utility-first styling

---

## 📊 Project Status

- ✅ **Core deployment** — Fully functional
- ✅ **GitHub OAuth** — Implemented and tested
- ✅ **Auto-redeploy webhooks** — Production ready
- ✅ **Dashboard** — Basic functionality complete
- 🚀 **In development** — Advanced features and optimizations

---

## 📞 Support & Community

- **Questions?** — Check the docs folder or open an issue
- **Found a bug?** — Open an issue with details and steps to reproduce
- **Have an idea?** — Start a discussion or open a feature request
- **Need help?** — Check troubleshooting section above

---

<div align="center">

### ⭐ Like Hostify? Star us on GitHub!

**Made with ❤️ for developers who want simple, powerful static site hosting**

[⬆ Back to top](#hostify-)

</div>
