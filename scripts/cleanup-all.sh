#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}"
echo "⚠️  ═══════════════════════════════════════════════════════"
echo "⚠️  WARNING: COMPLETE DATA CLEANUP"
echo "⚠️  ═══════════════════════════════════════════════════════"
echo -e "${NC}"
echo ""
echo "This script will:"
echo "  1. Delete ALL users from MongoDB"
echo "  2. Delete ALL deployments from MongoDB"
echo "  3. Delete ALL keys from Cloudflare KV"
echo ""
echo -e "${RED}❌ THIS CANNOT BE UNDONE! ❌${NC}"
echo ""

# Ask for confirmation
read -p "Type 'DELETE EVERYTHING' to confirm (or anything else to cancel): " confirmation

if [ "$confirmation" != "DELETE EVERYTHING" ]; then
    echo -e "\n${GREEN}✓ Cleanup cancelled. No data was deleted.${NC}"
    exit 0
fi

echo -e "\n${YELLOW}🚨 Starting cleanup process...${NC}\n"

# Navigate to the backend directory
cd "$(dirname "$0")/.." || exit

# Run the TypeScript cleanup script
npm run cleanup:all

echo ""
