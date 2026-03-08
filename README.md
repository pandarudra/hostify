# Hostify

A Node.js backend service that automatically deploys static websites from GitHub repositories to Azure Blob Storage with static website hosting.

## 🚀 Features

- **Custom Subdomain Support**: Set your own subdomain or use the default folder name
- **Cloudflare KV Storage**: Subdomain-to-folder mappings stored in Cloudflare KV for easy routing
- **GitHub Repository Cloning**: Automatically clones any public GitHub repository
- **Azure Blob Storage Integration**: Uploads files to Azure Storage with static website hosting
- **Smart Path Resolution**: Automatically fixes absolute paths in HTML files for subfolder hosting
- **Automatic Cleanup**: Removes local files after successful deployment
- **Content-Type Detection**: Properly sets MIME types for all file types
- **Optimized Caching**: Implements cache control headers for better performance
- **Development & Production Modes**: Flexible configuration for local dev and production deployments

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

| Variable                       | Description                                    | Required | Example                |
| ------------------------------ | ---------------------------------------------- | -------- | ---------------------- |
| `PORT`                         | Server port                                    | Yes      | `8000`                 |
| `UPLOAD_DIR`                   | Local temp directory for cloning               | Yes      | `./local`              |
| `AZURE_STORAGE_ACCOUNT_NAME`   | Azure storage account name                     | Yes      | `hostify`              |
| `AZURE_STORAGE_CONTAINER_NAME` | Container name (use `$web` for static hosting) | Yes      | `$web`                 |
| `AZURE_STORAGE_SAS_TOKEN`      | SAS token for authentication                   | Yes      | `sv=2024-11-04&ss=...` |
| `ENV`                          | Environment mode (`dev` or `production`)       | Yes      | `dev`                  |
| `CF_ACCOUNT_ID`                | Cloudflare Account ID                          | Prod     | `abc123...`            |
| `CF_KV_NAMESPACE_ID`           | Cloudflare KV Namespace ID                     | Prod     | `xyz789...`            |
| `CF_API_TOKEN`                 | Cloudflare API Token with KV permissions       | Prod     | `token...`             |

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
curl -X POST http://localhost:8000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "ghlink": "https://github.com/username/repository.git",
    "subdomain": "my-awesome-site"
  }'
```

**Without custom subdomain (uses default folder name):**

```bash
curl -X POST http://localhost:8000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{"ghlink": "https://github.com/username/repository.git"}'
```

### Example Usage with JavaScript

```javascript
// With custom subdomain
const response = await fetch("http://localhost:8000/api/v1/deploy", {
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

## 📁 Project Structure

```
hostify/
├── be/
│   ├── src/
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

---

Made with ❤️ for easy static website deployment
