# Test Scripts

This directory contains test scripts for the Hostify deployment system.

## test-webhook.js

Simulates GitHub webhook POST requests to test the auto-redeploy functionality.

### Usage

```bash
node test/test-webhook.js <backend-url> <repo-url> [webhook-secret]
```

### Examples

**Test production backend:**

```bash
node test/test-webhook.js https://hostify-be.onrender.com https://github.com/username/repo.git your-webhook-secret
```

**Test local backend:**

```bash
node test/test-webhook.js http://localhost:3000 https://github.com/username/repo.git your-webhook-secret
```

**With environment variable:**

```bash
node test/test-webhook.js https://hostify-be.onrender.com https://github.com/username/repo.git $(grep GITHUB_WEBHOOK_SECRET .env | cut -d'=' -f2)
```

### What it does

1. Creates a mock GitHub webhook payload (push event)
2. Generates HMAC SHA-256 signature for authentication
3. Sends POST request to `/int/api/v1/webhook/gh`
4. Displays the response and deployment results

### Output

The script will show:

- Webhook request details
- Response status and body
- Deployment results for each subdomain
- Success/failure summary

## Using the Automated Test Script

For easier testing, use the automated bash script in the `scripts` directory:

```bash
./scripts/test-todolist.sh production
```

or

```bash
./scripts/test-todolist.sh local
```

This will automatically:

1. Check if the backend is running
2. Deploy a test project
3. Run the webhook simulation
4. Display comprehensive results
