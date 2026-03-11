# Cleanup Scripts

This directory contains scripts to clean up data from MongoDB and Cloudflare KV.

## ⚠️ WARNING

**These scripts will permanently delete data. Use with extreme caution!**

## Available Scripts

### Complete Cleanup

Deletes ALL data from both MongoDB and Cloudflare KV:

```bash
# From the root directory
./scripts/cleanup-all.sh

# OR from the backend directory
cd be
npm run cleanup:all
```

This will:

- Delete all users from MongoDB
- Delete all deployments from MongoDB
- Delete all keys from Cloudflare KV

**You will be asked to type "DELETE EVERYTHING" to confirm.**

## Configuration

The cleanup scripts use the following environment variables:

### MongoDB

- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017/hostify`)

### Cloudflare KV

- `CF_ACCOUNT_ID` - Your Cloudflare account ID
- `CF_API_TOKEN` - Your Cloudflare API token
- `CF_KV_NAMESPACE_ID` - Your KV namespace ID

Make sure these are set in your `.env` file in the `be/` directory.

## Safety Features

- **Confirmation required**: You must type "DELETE EVERYTHING" to proceed
- **Current counts displayed**: Shows how many records will be deleted before deletion
- **Graceful failure**: If Cloudflare KV is not configured, it will skip KV cleanup
- **Clear output**: Shows progress and results for each operation

## Manual Cleanup (MongoDB)

If you prefer to clean MongoDB manually:

```javascript
// Connect to MongoDB
mongosh

// Switch to your database
use hostify

// Delete all users
db.users.deleteMany({})

// Delete all deployments
db.deployments.deleteMany({})

// Verify
db.users.countDocuments()
db.deployments.countDocuments()
```

## Manual Cleanup (Cloudflare KV)

Using Cloudflare Dashboard:

1. Go to Workers & Pages > KV
2. Select your namespace
3. Delete keys individually or use the API

Using wrangler CLI:

```bash
# List all keys
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# Delete individual keys
wrangler kv:key delete "key-name" --namespace-id=YOUR_NAMESPACE_ID
```

## Troubleshooting

### "Cannot connect to MongoDB"

- Check if MongoDB is running: `systemctl status mongod` or `brew services list`
- Verify `MONGODB_URI` in your `.env` file

### "Cloudflare KV cleanup skipped"

- Ensure `CF_ACCOUNT_ID`, `CF_API_TOKEN`, and `CF_KV_NAMESPACE_ID` are set in `.env`
- Verify your Cloudflare API token has the correct permissions

### "Permission denied"

- Make sure the script is executable: `chmod +x scripts/cleanup-all.sh`
- Run from the project root directory
