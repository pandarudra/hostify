#!/bin/bash

# Script to clean the local deployment folder
# Usage: ./scripts/cleanlocal.sh

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCAL_DIR="$PROJECT_ROOT/be/local"

echo -e "${YELLOW}Cleaning local deployment folder...${NC}"

# Check if local directory exists
if [ ! -d "$LOCAL_DIR" ]; then
    echo -e "${RED}Error: Local directory not found at $LOCAL_DIR${NC}"
    exit 1
fi

# Count items before deletion
ITEM_COUNT=$(find "$LOCAL_DIR" -mindepth 1 -maxdepth 1 | wc -l)

if [ "$ITEM_COUNT" -eq 0 ]; then
    echo -e "${GREEN}Local directory is already empty.${NC}"
    exit 0
fi

echo -e "${YELLOW}Found $ITEM_COUNT item(s) in local directory.${NC}"

# Remove all contents in the local directory
rm -rf "$LOCAL_DIR"/*

# Verify deletion
REMAINING_COUNT=$(find "$LOCAL_DIR" -mindepth 1 -maxdepth 1 | wc -l)

if [ "$REMAINING_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully cleaned local directory!${NC}"
    echo -e "${GREEN}  Removed $ITEM_COUNT item(s) from $LOCAL_DIR${NC}"
else
    echo -e "${RED}✗ Warning: Some items may not have been deleted.${NC}"
    echo -e "${RED}  $REMAINING_COUNT item(s) remaining.${NC}"
    exit 1
fi
