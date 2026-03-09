#!/bin/bash

# Example: Deploy with Automatic Webhook Creation
# This script demonstrates deploying a project with automatic GitHub webhook setup

set -e

# Configuration
API_URL="${API_URL:-http://localhost:8000}"
GITHUB_REPO="${GITHUB_REPO:-https://github.com/username/repo}"
SUBDOMAIN="${SUBDOMAIN:-my-app}"
GITHUB_TOKEN="${GITHUB_TOKEN}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "================================================"
echo "  Hostify - Automated Webhook Deployment"
echo "================================================"
echo ""

# Check if GitHub token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  No GITHUB_TOKEN provided${NC}"
    echo ""
    echo "Deployment will proceed WITHOUT automatic webhook creation."
    echo "You'll need to add the webhook URL manually to GitHub."
    echo ""
    echo "To enable automatic webhook creation:"
    echo "  export GITHUB_TOKEN='your_github_token'"
    echo ""
    read -p "Continue without automatic webhook? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
    USE_TOKEN=false
else
    echo -e "${GREEN}✅ GitHub token detected - webhook will be auto-created${NC}"
    echo ""
    USE_TOKEN=true
fi

# Build JSON payload
if [ "$USE_TOKEN" = true ]; then
    PAYLOAD=$(cat <<EOF
{
  "ghlink": "$GITHUB_REPO",
  "subdomain": "$SUBDOMAIN",
  "githubToken": "$GITHUB_TOKEN"
}
EOF
)
else
    PAYLOAD=$(cat <<EOF
{
  "ghlink": "$GITHUB_REPO",
  "subdomain": "$SUBDOMAIN"
}
EOF
)
fi

echo "Deploying..."
echo "  Repository: $GITHUB_REPO"
echo "  Subdomain: $SUBDOMAIN"
echo "  API: $API_URL/api/v1/deploy"
echo ""

# Make deployment request
RESPONSE=$(curl -s -X POST "$API_URL/api/v1/deploy" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Check if request was successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    
    # Extract and display key information
    URL=$(echo "$RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    WEBHOOK_URL=$(echo "$RESPONSE" | grep -o '"url":"[^"]*"' | tail -1 | cut -d'"' -f4)
    AUTO_CREATED=$(echo "$RESPONSE" | grep -o '"autoCreated":[^,}]*' | cut -d':' -f2)
    
    echo "📦 Deployment Details:"
    echo "  Subdomain: $SUBDOMAIN"
    echo "  Live URL: $URL"
    echo ""
    
    if [ "$AUTO_CREATED" = "true" ]; then
        echo -e "${GREEN}🎉 Webhook automatically created in GitHub!${NC}"
        echo ""
        echo "You're all set! Push to your repo to trigger auto-redeploy."
    else
        echo -e "${YELLOW}📝 Manual webhook setup required${NC}"
        echo ""
        echo "Add this webhook URL to your GitHub repository:"
        echo "  $WEBHOOK_URL"
        echo ""
        echo "Steps:"
        echo "  1. Go to: $GITHUB_REPO/settings/hooks/new"
        echo "  2. Payload URL: $WEBHOOK_URL"
        echo "  3. Content type: application/json"
        echo "  4. Events: Just the push event"
        echo "  5. Save webhook"
    fi
    
    echo ""
    echo "Full response saved to: deploy-response.json"
    echo "$RESPONSE" | python3 -m json.tool > deploy-response.json 2>/dev/null || echo "$RESPONSE" > deploy-response.json
    
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

echo ""
echo "================================================"
