# Hostify

A Node.js backend service that automatically deploys static websites from GitHub repositories to Azure Blob Storage with static website hosting.

## ✨ NEW: GitHub OAuth Authentication

**Now with one-click deployment!** Users can:

- 🔐 Login with GitHub OAuth
- 📦 Browse all their repositories
- 🚀 Deploy with a single click (no manual tokens!)
- 🔄 Automatic webhook creation
- 📊 Manage all deployments from dashboard

👉 **[Get Started with OAuth →](docs/OAUTH_IMPLEMENTATION.md)**

---

## 🚀 Features

- **🆕 GitHub OAuth Login**: One-click authentication and deployment
- **🆕 Repository Browser**: See and deploy all your GitHub repos
- **🆕 Automatic Webhooks**: Webhooks created automatically on deploy
- **🆕 Deployment Dashboard**: Track and manage all your deployments
- **Auto-Redeploy on Push**: Automatically redeploys when you push to GitHub (like Vercel/Netlify)
- **GitHub Webhook Integration**: Secure webhook endpoint with signature verification
- **Custom Subdomain Support**: Set your own subdomain or use the default folder name
- **Cloudflare KV Storage**: Subdomain-to-folder mappings stored in Cloudflare KV for easy routing
- **Project Metadata Tracking**: Store and retrieve complete deployment information
- **Multi-Project Support**: Deploy the same repo multiple times with different subdomains
- **GitHub Repository Cloning**: Automatically clones any public GitHub repository
- **Azure Blob Storage Integration**: Uploads files to Azure Storage with static website hosting
- **Smart Path Resolution**: Automatically fixes absolute paths in HTML files for subfolder hosting
- **Automatic Cleanup**: Removes local files after successful deployment
- **Content-Type Detection**: Properly sets MIME types for all file types
- **Optimized Caching**: Implements cache control headers for better performance
- **Development & Production Modes**: Flexible configuration for local dev and production deployments
- **API Documentation**: Interactive API docs with Swagger UI and ReDoc

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Azure Storage Account with static website hosting enabled
- Azure Storage SAS token with appropriate permissions

## 🛠️ Installation

1. Clone the repository:

```bash
git clone https://github.com/pandarudra/hostify.git
cd hostify
```

## 🐳 Local Docker (dev)

Quick-start everything (Mongo, Redis KV substitute, backend, frontend) with Docker:

```bash
# from repo root
docker compose up --build
```

Services started:

- MongoDB at `mongodb://localhost:27017/hostify` (auth disabled for local dev)
- Redis (used as a local KV stand-in) at `localhost:6379`
- Backend on `http://localhost:8000`
- Frontend preview on `http://localhost:4173`

You can override any env via `docker compose run`/`-e` or by editing `docker-compose.yml` (GitHub OAuth IDs, secrets, callback URL, etc.). Uploads/clones persist in `be/local` (mounted into the container).

2. Install dependencies:

```bash
cd be
npm install
```

3. Create a `.env` file in the `be` directory:

```env
PORT=8000
UPLOAD_DIR=./local

# Azure Storage Configuration
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_STORAGE_CONTAINER_NAME=$web
AZURE_STORAGE_SAS_TOKEN=your-sas-token-here

# Environment Mode
ENV=dev
# ENV=production

# Cloudflare Configuration (Optional in dev, Required in production)
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_KV_NAMESPACE_ID=your-kv-namespace-id
CF_API_TOKEN=your-cloudflare-api-token

# GitHub Webhook Secret (Required for auto-redeploy)
GITHUB_WEBHOOK_SECRET=your-webhook-secret-here
```

## 🔧 Configuration

### Azure Storage Setup

1. Create an Azure Storage Account
2. Enable **Static website hosting** in your storage account
3. Generate a SAS token with the following permissions:
   - Read, Write, Delete, List
   - Container and Object resource types
   - Set appropriate expiration date

4. Use the `$web` container for static website hosting

### Cloudflare KV Setup

1. Create a **Workers KV Namespace** in your Cloudflare account
2. Generate an **API Token** with KV permissions:
   - Account > Workers KV Storage > Edit
3. Get your **Account ID** and **Namespace ID** from Cloudflare dashboard
4. Add credentials to your `.env` file

**Note**: Cloudflare KV is optional in development mode but required for production deployments.

### Environment Variables

| Variable                       | Description                                      | Required    | Example                |
| ------------------------------ | ------------------------------------------------ | ----------- | ---------------------- |
| `PORT`                         | Server port                                      | Yes         | `8000`                 |
| `UPLOAD_DIR`                   | Local temp directory for cloning                 | Yes         | `./local`              |
| `AZURE_STORAGE_ACCOUNT_NAME`   | Azure storage account name                       | Yes         | `hostify`              |
| `AZURE_STORAGE_CONTAINER_NAME` | Container name (use `$web` for static hosting)   | Yes         | `$web`                 |
| `AZURE_STORAGE_SAS_TOKEN`      | SAS token for authentication                     | Yes         | `sv=2024-11-04&ss=...` |
| `ENV`                          | Environment mode (`dev` or `production`)         | Yes         | `dev`                  |
| `CF_ACCOUNT_ID`                | Cloudflare Account ID                            | Prod        | `abc123...`            |
| `CF_KV_NAMESPACE_ID`           | Cloudflare KV Namespace ID                       | Prod        | `xyz789...`            |
| `CF_API_TOKEN`                 | Cloudflare API Token with KV permissions         | Prod        | `token...`             |
| `GITHUB_WEBHOOK_SECRET`        | Secret for GitHub webhook signature verification | Recommended | `your-secret`          |

## 🚦 Usage

### Development Mode

```bash
make start
```

This starts the server with auto-reload on file changes.

### Production Build

```bash
npm run build
npm start
```

### 📚 API Documentation

Once the server is running, you can access interactive API documentation:

- **Swagger UI**: [http://localhost:8000/api-docs](http://localhost:8000/api-docs)
  - Interactive API explorer with "Try it out" functionality
  - Test endpoints directly from your browser
  - View request/response schemas

- **ReDoc**: [http://localhost:8000/api-docs-redoc](http://localhost:8000/api-docs-redoc)
  - Clean, responsive API documentation
  - Better for reading and understanding the API
  - Includes detailed schemas and examples

- **OpenAPI JSON**: [http://localhost:8000/swagger.json](http://localhost:8000/swagger.json)
  - Raw OpenAPI 3.0 specification
  - Can be imported into Postman, Insomnia, or other API tools

### API Endpoint

#### Deploy a GitHub Repository

**POST** `/api/v1/deploy`

**Request Body:**

```json
{
  "ghlink": "https://github.com/username/repository.git",
  "subdomain": "my-custom-subdomain" // Optional: defaults to folder name if not provided
}
```

**Parameters:**

| Parameter   | Type   | Required | Description                                               |
| ----------- | ------ | -------- | --------------------------------------------------------- |
| `ghlink`    | string | Yes      | GitHub repository URL (must be public)                    |
| `subdomain` | string | No       | Custom subdomain name (defaults to generated folder name) |

**Success Response:**

```json
{
  "success": true,
  "message": "Deployment successful",
  "blobPath": {
    "folderName": "repository-abc123",
    "subdomain": "my-custom-subdomain",
    "path": "repository-abc123",
    "url": "https://my-custom-subdomain.rudrax.me"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Deployment failed",
  "error": "Error message details"
}
```

### Example Usage with cURL

**With custom subdomain:**

```bash
# Production URL
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/repository.git",
    "subdomain": "my-awesome-site"
  }'

# Or for local development
curl -X POST http://localhost:8000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/repository.git",
    "subdomain": "my-awesome-site"
  }'
```

**Without custom subdomain (uses default folder name):**

```bash
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{"ghlink": "https://github.com/username/repository.git"}'
```

### Example Usage with JavaScript

```javascript
// With custom subdomain (production)
const response = await fetch("https://hostify-be.onrender.com/api/v1/deploy", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ghlink: "https://github.com/username/repository.git",
    subdomain: "my-awesome-site",
  }),
});

const data = await response.json();
console.log(data.blobPath.url); // https://my-awesome-site.rudrax.me
console.log(data.blobPath.subdomain); // my-awesome-site
console.log(data.blobPath.folderName); // repository-abc123
```

## 🔄 Auto-Redeploy with GitHub Webhooks

Hostify supports automatic redeployment when you push code to GitHub, just like Vercel and Netlify!

### Quick Setup

1. **Deploy your project first**:

   ```bash
   curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
     -H "Content-Type: application/json" \
     -d '{
       "ghlink": "https://github.com/username/repo",
       "subdomain": "my-app"
     }'
   ```

2. **Generate a webhook secret**:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Add this to your `.env` as `GITHUB_WEBHOOK_SECRET`

3. **Configure GitHub webhook**:
   - Go to your repo → Settings → Webhooks → Add webhook
   - Payload URL: `https://hostify-be.onrender.com/int/api/v1/webhook/gh`
   - Content type: `application/json`
   - Secret: Your `GITHUB_WEBHOOK_SECRET`
   - Events: "Just the push event"

4. **Push to GitHub** and watch your site redeploy automatically! 🎉

### How It Works

When you push to GitHub:

1. GitHub sends a webhook to your Hostify backend
2. Hostify verifies the signature for security
3. Looks up all projects using that repository (from Cloudflare KV)
4. Redeploys each project automatically
5. Updates the `lastDeployedAt` timestamp

### Multiple Deployments from Same Repo

You can deploy the same repo multiple times:

```bash
# Production
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -d '{"ghlink": "https://github.com/username/repo", "subdomain": "my-app"}'

# Staging
curl -X POST https://hostify-be.onrender.com/api/v1/deploy \
  -d '{"ghlink": "https://github.com/username/repo", "subdomain": "my-app-staging"}'
```

When you push to GitHub, **both deployments will automatically redeploy**!

### Testing the Webhook

Use the included test script:

```bash
cd be
# Test with production URL
node test/test-webhook.js https://hostify-be.onrender.com https://github.com/username/repo.git your-webhook-secret

# Or test locally
node test/test-webhook.js http://localhost:8000 https://github.com/username/repo.git your-webhook-secret
```

**Or use the automated test script:**

```bash
cd be
./scripts/test-todolist.sh production
```

### 📖 Full Documentation

For complete setup instructions, troubleshooting, and advanced features, see:
**[AUTO_REDEPLOY_SETUP.md](./AUTO_REDEPLOY_SETUP.md)**

## 📁 Project Structure

```
hostify/
├── be/
│   ├── src/
│   │   ├── config/
│   │   │   └── swagger.ts
│   │   ├── controllers/
│   │   │   └── deploy.controllers.ts
│   │   ├── helpers/
│   │   │   └── upload.ts
│   │   ├── router/
│   │   │   ├── deploy.router.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── azureStorage.ts
│   │   │   ├── cloudflare.ts
│   │   │   ├── git.ts
│   │   │   └── general.ts
│   │   ├── constants/
│   │   │   └── e.ts
│   │   └── server.ts
│   ├── local/                 # Temporary clone directory
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── README.md
```

## 🔄 How It Works

1. **Receive Request**: API receives a GitHub repository URL and optional custom subdomain
2. **Clone Repository**: Repository is cloned to a temporary local directory with a unique folder name
3. **Subdomain Assignment**: Uses custom subdomain if provided, otherwise defaults to folder name
4. **Process Files**:
   - Excludes `.git` folder and `.gitignore` files
   - Fixes absolute paths in HTML files to relative paths
5. **Upload to Azure** (Production mode):
   - All files are uploaded to Azure Blob Storage with proper content types
   - Subdomain mapping is saved to Cloudflare KV
6. **Cleanup**: Local temporary directory is deleted after successful upload (production only)
7. **Return URL**: Responds with the deployed website URL using the chosen subdomain

## 🎨 Features in Detail

### Custom Subdomains

You can specify a custom subdomain for your deployment:

- **With custom subdomain**: `{"subdomain": "my-site"}` → Deployed at `https://my-site.rudrax.me`
- **Without subdomain**: Uses auto-generated folder name → `https://repository-abc123.rudrax.me`

Subdomain mappings are stored in Cloudflare KV, allowing you to:

- Route custom subdomains to the correct Azure Storage folder
- Manage subdomain-to-deployment relationships
- Lookup which folder a subdomain points to using `getSubdomain(subdomain)` function

### Development vs Production Mode

**Development Mode** (`ENV=dev`):

- Files are stored locally in the `UPLOAD_DIR` folder
- Cloudflare KV is optional (warnings shown if not configured)
- No automatic cleanup of local files
- URLs use local paths: `/local/{folderName}`

**Production Mode** (`ENV=production`):

- Files are uploaded to Azure Blob Storage
- Cloudflare KV is required (errors if not configured)
- Automatic cleanup of local files after upload
- URLs use custom domain: `https://{subdomain}.rudrax.me`

### Automatic Path Fixing

The service automatically converts absolute paths in HTML files to relative paths, ensuring assets load correctly in subfolder hosting:

- `<script src="/script.js">` → `<script src="script.js">`
- `<link href="/style.css">` → `<link href="style.css">`
- `<img src="/image.png">` → `<img src="image.png">`

### Smart Content-Type Detection

Automatically sets correct MIME types for:

- HTML, CSS, JavaScript
- Images (PNG, JPG, GIF, SVG)
- Documents (PDF, TXT, MD, JSON, XML)
- Archives (ZIP)
- And more...

### Optimized Caching

- HTML files: 1 hour cache
- Static assets (CSS, JS, images): 1 year cache

## 🔐 Security

- Uses Helmet.js for security headers
- CORS protection with configurable origins
- SAS token authentication for Azure Storage
- Input validation for GitHub URLs

## 📝 API Response Codes

| Status Code | Description                            |
| ----------- | -------------------------------------- |
| 200         | Deployment successful                  |
| 500         | Deployment failed (with error details) |

## 🐛 Troubleshooting

### Common Issues

1. **404 errors for CSS/JS files**
   - Ensure HTML files use relative paths (not absolute paths with `/`)
   - The service automatically fixes this issue

2. **Authentication errors**
   - Verify your SAS token is valid and not expired
   - Ensure the token has correct permissions (read, write, list, delete)

3. **Clone failures**
   - Verify the GitHub repository URL is correct
   - Ensure the repository is public or you have access

4. **Cloudflare KV authentication errors**
   - In development: Warnings are shown but deployment continues
   - In production: Deployment fails if Cloudflare credentials are invalid
   - Verify your API token has correct permissions for Workers KV
   - Check that Account ID and Namespace ID are correct

5. **Local directory errors**
   - Ensure the `UPLOAD_DIR` path is writable
   - Check disk space availability

6. **Subdomain conflicts**
   - Each subdomain maps to one folder in Cloudflare KV
   - Redeploying with the same subdomain updates the mapping

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

ISC

## 🙏 Acknowledgments

- Built with TypeScript and Express.js
- Uses Azure Storage SDK for blob operations
- Git operations powered by simple-git
- API documentation powered by Swagger UI and ReDoc
- Subdomain management with Cloudflare KV

---

Made with ❤️ for easy static website deployment
