#!/bin/bash
set -e

echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

echo "📦 Preparing docs folder..."
rm -rf docs
mkdir -p docs
cp -r frontend/dist/* docs/

echo "📝 Adding .nojekyll..."
touch docs/.nojekyll

echo "✅ Done! Files are in /docs"
echo ""
echo "Next steps:"
echo "1. git add docs"
echo "2. git commit -m 'Deploy to GitHub Pages'"
echo "3. git push"
echo "4. Go to GitHub.com → Settings → Pages → Set folder to /docs"
