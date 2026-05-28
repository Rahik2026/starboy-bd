#!/bin/bash
# ============================================================
# STARBOY BD — One-Click Local Setup Script
# ============================================================

set -e

echo "🚀 STARBOY BD Production Setup"
echo "================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for env file
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        echo "✅ Created .env.local — EDIT THIS FILE with your real Firebase & Supabase keys!"
    else
        echo "❌ .env.local.example missing. Cannot continue."
        exit 1
    fi
else
    echo "✅ .env.local exists"
fi

# Build check
echo "🔨 Building for production..."
npm run build

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your real API keys"
echo "2. Run 'npm run dev' to start locally"
echo "3. Deploy to Vercel: npx vercel --prod"
echo ""
echo "📖 Full guide: DEPLOYMENT_GUIDE.md"
echo "🗄️  Database schema: supabase-schema.sql"
echo "================================"
