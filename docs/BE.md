# Scripts

This directory contains utility scripts for testing and managing the Hostify deployment system.

## test-todolist.sh

Automated test script that deploys a sample repository and tests the webhook functionality.

### Usage

```bash
# Test with production backend
./scripts/test-todolist.sh production

# Test with local backend
./scripts/test-todolist.sh local
```

You can also run it from the project root:

```bash
cd /home/rudra/Desktop/hostify/be
./scripts/test-todolist.sh production
```

### What it does

1. **Backend Health Check**: Verifies the backend is running and accessible
2. **Project Deployment**: Deploys the ToDoList repository from GitHub
3. **Webhook Simulation**: Tests the auto-redeploy webhook functionality
4. **Results Summary**: Displays comprehensive test results

### Configuration

Edit the script to change:

- `REPO_URL`: The GitHub repository to test with
- `SUBDOMAIN`: The subdomain name for deployment

### Requirements

- `.env` file must exist in the `be` directory
- `GITHUB_WEBHOOK_SECRET` must be set in `.env`
- Backend must be running (production or local)

### Test Repository

The script defaults to testing with:
**https://github.com/tusharnankani/ToDoList.git**

This is a sample repository that demonstrates the deployment functionality.

### Example Output

```
═══════════════════════════════════════════════
   Hostify Test Suite - ToDoList Repository
═══════════════════════════════════════════════

Test 1: Checking if backend is running...
✅ Backend is running

Test 2: Deploying ToDoList repository...
Repository: https://github.com/tusharnankani/ToDoList.git
Subdomain: todolist-test

✅ Deployment successful
🌐 Deployed at: https://todolist-test.rudrax.me

Test 3: Testing webhook simulation...
✅ Webhook test successful

🎯 Deployment Results:
  1. ✅ todolist-test
     URL: https://todolist-test.rudrax.me

═══════════════════════════════════════════════
🎉 Test Suite Complete!
═══════════════════════════════════════════════
```

## Troubleshooting

### Error: ".env file not found"

- Make sure you're running the script from the `be` directory or its subdirectories
- Check that `.env` exists at `/home/rudra/Desktop/hostify/be/.env`

### Error: "GITHUB_WEBHOOK_SECRET not set"

- Add `GITHUB_WEBHOOK_SECRET=your_secret_here` to your `.env` file
- Generate a secret with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Error: "Backend is not accessible"

- For production: Check if https://hostify-be.onrender.com is running
- For local: Make sure your local server is running on port 8000

### Error: "test-webhook.js not found"

- The script expects `test/test-webhook.js` to exist
- Make sure you haven't moved or deleted the test directory

## Related Documentation

- [TESTING_GUIDE.md](../../TESTING_GUIDE.md) - Comprehensive testing guide
- [QUICKSTART.md](../../md/QUICKSTART.md) - Quick start guide
- [AUTO_REDEPLOY_SETUP.md](../../md/AUTO_REDEPLOY_SETUP.md) - Auto-redeploy setup
