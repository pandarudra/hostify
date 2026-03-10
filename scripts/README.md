# Deployment Scripts

## deploy-with-webhook.sh

Automated deployment script with optional automatic webhook creation.

### Usage

**With automatic webhook creation:**

```bash
export GITHUB_TOKEN="ghp_your_token_here"
export GITHUB_REPO="https://github.com/username/repo"
export SUBDOMAIN="my-app"

./scripts/deploy-with-webhook.sh
```

**Without automatic webhook (manual setup):**

```bash
export GITHUB_REPO="https://github.com/username/repo"
export SUBDOMAIN="my-app"

./scripts/deploy-with-webhook.sh
```

### Environment Variables

- `GITHUB_TOKEN` (optional): GitHub Personal Access Token for automatic webhook creation
- `GITHUB_REPO` (required): Full GitHub repository URL
- `SUBDOMAIN` (required): Desired subdomain for deployment
- `API_URL` (optional): Hostify API URL (default: http://localhost:8000)

### Examples

**Deploy to production:**

```bash
export API_URL="https://your-production-domain.com"
export GITHUB_TOKEN="ghp_xxxxx"
export GITHUB_REPO="https://github.com/myorg/myapp"
export SUBDOMAIN="myapp"

./scripts/deploy-with-webhook.sh
```

**Deploy to local development:**

```bash
export GITHUB_REPO="https://github.com/test/demo"
export SUBDOMAIN="demo-local"

./scripts/deploy-with-webhook.sh
```

### Making the script executable

```bash
chmod +x scripts/deploy-with-webhook.sh
```

## cleanlocal.sh

Cleans up local temporary files and directories.

```bash
./scripts/cleanlocal.sh
```

---

## setup-frontend.sh

Automated script to set up the SvelteKit frontend for Hostify.

### What it does

- Creates a new SvelteKit project with TypeScript
- Installs all required dependencies (Tailwind CSS, Axios, Lucide icons, etc.)
- Sets up Tailwind CSS configuration
- Creates the recommended directory structure
- Generates a `.env` file with default configuration

### Usage

```bash
cd scripts
./setup-frontend.sh
```

### After running the script

1. Follow the comprehensive guide at [docs/FRONTEND_BUILD_GUIDE.md](../docs/FRONTEND_BUILD_GUIDE.md)
2. Create the necessary files as outlined in the guide:
   - Components (Header, Footer, RepoCard, etc.)
   - Services (API client, auth, deploy, repo services)
   - Stores (auth store)
   - Pages (Login, Dashboard, Repositories, Deployments)
   - Type definitions
3. Start the development server:
   ```bash
   cd fe
   npm run dev
   ```
4. Visit `http://localhost:5173` to see your frontend

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Running Hostify backend at `http://localhost:8000`

### Configuration

Edit `fe/.env` to change API endpoints:

```env
PUBLIC_API_BASE_URL=http://localhost:8000
PUBLIC_FRONTEND_URL=http://localhost:5173
```

For production, update these to your production URLs.

---
