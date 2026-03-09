#!/bin/bash

# Setup script for OAuth authentication feature
# This installs required dependencies for MongoDB and JWT

set -e

echo "================================================"
echo "  Hostify - OAuth Authentication Setup"
echo "================================================"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the be/ directory"
    exit 1
fi

echo "📦 Installing dependencies..."
echo ""

# Install MongoDB and JWT dependencies
npm install mongoose jsonwebtoken

# Install TypeScript types
npm install --save-dev @types/jsonwebtoken @types/mongoose

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "================================================"
echo "  Next Steps:"
echo "================================================"
echo ""
echo "1. Set up MongoDB:"
echo "   - MongoDB Atlas (free): https://www.mongodb.com/cloud/atlas"
echo "   - Or install locally: brew install mongodb-community"
echo ""
echo "2. Create GitHub OAuth App:"
echo "   - Go to: https://github.com/settings/developers"
echo "   - Click 'New OAuth App'"
echo "   - Set callback URL: http://localhost:8000/api/auth/github/callback"
echo ""
echo "3. Update .env file with:"
echo "   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hostify"
echo "   GITHUB_CLIENT_ID=your_client_id"
echo "   GITHUB_CLIENT_SECRET=your_client_secret"
echo "   GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/github/callback"
echo "   JWT_SECRET=\$(node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")"
echo "   FRONTEND_URL=http://localhost:5173"
echo ""
echo "4. Read the documentation:"
echo "   docs/OAUTH_SETUP.md"
echo ""
echo "================================================"
