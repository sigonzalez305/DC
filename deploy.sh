#!/bin/bash
echo "Building frontend..."
cd frontend
npm run build
cd ..

echo "Copying to docs folder..."
rm -rf docs
mkdir docs
cp -r frontend/dist/* docs/

echo "Adding .nojekyll..."
touch docs/.nojekyll

echo "Done! Now run:"
echo "git add docs frontend/vite.config.ts"
echo "git commit -m 'Configure GitHub Pages deployment'"
echo "git push"
