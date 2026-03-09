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
