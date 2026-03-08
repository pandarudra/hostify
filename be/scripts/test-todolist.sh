#!/bin/bash

# Test script for Hostify deployment with ToDoList repository
# Usage: ./scripts/test-todolist.sh [production|local]
# Or from be directory: ./scripts/test-todolist.sh [production|local]

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the be directory (parent of scripts)
BE_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
REPO_URL="https://github.com/tusharnankani/ToDoList.git"
SUBDOMAIN="todolist-test"

# Determine environment
ENV=${1:-production}

if [ "$ENV" = "production" ]; then
    BACKEND_URL="https://hostify-be.onrender.com"
    echo -e "${BLUE}🚀 Testing with PRODUCTION backend: $BACKEND_URL${NC}"
elif [ "$ENV" = "local" ]; then
    BACKEND_URL="http://localhost:3000"
    echo -e "${BLUE}🏠 Testing with LOCAL backend: $BACKEND_URL${NC}"
else
    echo -e "${RED}❌ Invalid environment. Use: production or local${NC}"
    exit 1
fi

# Load webhook secret from .env
ENV_FILE="$BE_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep GITHUB_WEBHOOK_SECRET "$ENV_FILE" | xargs)
else
    echo -e "${RED}❌ .env file not found at: $ENV_FILE${NC}"
    exit 1
fi

if [ -z "$GITHUB_WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ GITHUB_WEBHOOK_SECRET not set in .env${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Hostify Test Suite - ToDoList Repository${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

# Test 1: Check if backend is running
echo -e "${YELLOW}Test 1: Checking if backend is running...${NC}"
if curl -s -f "$BACKEND_URL/" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not accessible at $BACKEND_URL${NC}"
    exit 1
fi
echo ""

# Test 2: Deploy the project
echo -e "${YELLOW}Test 2: Deploying ToDoList repository...${NC}"
echo "Repository: $REPO_URL"
echo "Subdomain: $SUBDOMAIN"
echo ""

DEPLOY_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/deploy" \
  -H "Content-Type: application/json" \
  -d "{
    \"ghlink\": \"$REPO_URL\",
    \"subdomain\": \"$SUBDOMAIN\"
  }")

echo "Response: $DEPLOY_RESPONSE"
echo ""

if echo "$DEPLOY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Deployment successful${NC}"
    
    # Extract URL if available
    DEPLOYED_URL=$(echo "$DEPLOY_RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$DEPLOYED_URL" ]; then
        echo -e "${GREEN}🌐 Deployed at: $DEPLOYED_URL${NC}"
    fi
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Please check the error message above"
fi
echo ""

# Wait a bit for deployment to settle
echo -e "${BLUE}⏳ Waiting 3 seconds for deployment to settle...${NC}"
sleep 3
echo ""

# Test 3: Test webhook simulation
echo -e "${YELLOW}Test 3: Testing webhook simulation...${NC}"
echo "Running webhook test script..."
echo ""

WEBHOOK_TEST_SCRIPT="$BE_DIR/test/test-webhook.js"
if [ -f "$WEBHOOK_TEST_SCRIPT" ]; then
    node "$WEBHOOK_TEST_SCRIPT" "$BACKEND_URL" "$REPO_URL" "$GITHUB_WEBHOOK_SECRET"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Webhook test successful${NC}"
    else
        echo ""
        echo -e "${RED}❌ Webhook test failed${NC}"
    fi
else
    echo -e "${RED}❌ test-webhook.js not found at: $WEBHOOK_TEST_SCRIPT${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Test Suite Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Check your Cloudflare KV for stored metadata"
echo "2. Verify Azure Storage has the deployed files (production only)"
echo "3. Visit the deployed URL to see the ToDoList app"
echo "4. Check backend logs for detailed information"
echo ""
echo -e "${BLUE}To test multiple deployments:${NC}"
echo "  Change SUBDOMAIN in this script and run again"
echo ""
