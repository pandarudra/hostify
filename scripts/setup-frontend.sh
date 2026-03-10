#!/bin/bash

# Hostify Frontend Setup Script
# This script sets up the SvelteKit frontend for Hostify

set -e

echo "🚀 Setting up Hostify Frontend with SvelteKit..."
echo ""

# Check if we're in the correct directory
if [ ! -f "../be/package.json" ]; then
    echo "❌ Error: Please run this script from the scripts/ directory"
    exit 1
fi

cd ..

# Create SvelteKit project
echo "📦 Creating SvelteKit project..."
npm create svelte@latest fe -- --template skeleton --types typescript --prettier --eslint --playwright --vitest

cd fe

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Install additional packages
echo "📥 Installing additional packages..."
npm install axios js-cookie lucide-svelte svelte-sonner
npm install -D @types/js-cookie tailwindcss postcss autoprefixer

# Initialize Tailwind CSS
echo "🎨 Setting up Tailwind CSS..."
npx tailwindcss init -p

# Create .env file
echo "⚙️  Creating environment file..."
cat > .env << 'EOF'
PUBLIC_API_BASE_URL=http://localhost:8000
PUBLIC_FRONTEND_URL=http://localhost:5173
EOF

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p src/lib/components
mkdir -p src/lib/stores
mkdir -p src/lib/services
mkdir -p src/lib/types
mkdir -p src/routes/login
mkdir -p src/routes/dashboard
mkdir -p src/routes/repositories
mkdir -p src/routes/deployments
mkdir -p src/routes/auth/callback

# Update package.json scripts
echo "📝 Updating package.json scripts..."
npm pkg set scripts.dev="vite dev"
npm pkg set scripts.build="vite build"
npm pkg set scripts.preview="vite preview"
npm pkg set scripts.check="svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
npm pkg set scripts.check:watch="svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "📖 Next steps:"
echo "   1. Follow the guide at docs/FRONTEND_BUILD_GUIDE.md"
echo "   2. Create the necessary files as outlined in the guide"
echo "   3. Run 'cd fe && npm run dev' to start the development server"
echo ""
echo "🎉 Happy coding!"
