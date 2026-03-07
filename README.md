# Hostify

A Node.js backend service that automatically deploys static websites from GitHub repositories to Azure Blob Storage with static website hosting.

## 🚀 Features

- **GitHub Repository Cloning**: Automatically clones any public GitHub repository
- **Azure Blob Storage Integration**: Uploads files to Azure Storage with static website hosting
- **Smart Path Resolution**: Automatically fixes absolute paths in HTML files for subfolder hosting
- **Automatic Cleanup**: Removes local files after successful deployment
- **Content-Type Detection**: Properly sets MIME types for all file types
- **Optimized Caching**: Implements cache control headers for better performance

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

### Environment Variables

| Variable                       | Description                                    | Example                |
| ------------------------------ | ---------------------------------------------- | ---------------------- |
| `PORT`                         | Server port                                    | `8000`                 |
| `UPLOAD_DIR`                   | Local temp directory for cloning               | `./local`              |
| `AZURE_STORAGE_ACCOUNT_NAME`   | Azure storage account name                     | `hostify`              |
| `AZURE_STORAGE_CONTAINER_NAME` | Container name (use `$web` for static hosting) | `$web`                 |
| `AZURE_STORAGE_SAS_TOKEN`      | SAS token for authentication                   | `sv=2024-11-04&ss=...` |

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
  "ghlink": "https://github.com/username/repository.git"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Deployment successful",
  "blobPath": {
    "folderName": "repository-abc123",
    "path": "https://your-account.z30.web.core.windows.net/repository-abc123/index.html"
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

```bash
curl -X POST http://localhost:8000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{"ghlink": "https://github.com/username/repository.git"}'
```

### Example Usage with JavaScript

```javascript
const response = await fetch("http://localhost:8000/api/v1/deploy", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ghlink: "https://github.com/username/repository.git",
  }),
});

const data = await response.json();
console.log(data.blobPath.path); // Deployed website URL
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

1. **Receive Request**: API receives a GitHub repository URL
2. **Clone Repository**: Repository is cloned to a temporary local directory with a unique folder name
3. **Process Files**:
   - Excludes `.git` folder and `.gitignore` files
   - Fixes absolute paths in HTML files to relative paths
4. **Upload to Azure**: All files are uploaded to Azure Blob Storage with proper content types
5. **Cleanup**: Local temporary directory is deleted after successful upload
6. **Return URL**: Responds with the deployed website URL

## 🎨 Features in Detail

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

4. **Local directory errors**
   - Ensure the `UPLOAD_DIR` path is writable
   - Check disk space availability

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
