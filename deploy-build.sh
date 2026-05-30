#!/bin/bash
# Run from project root after making any frontend changes.
# Builds the React app and copies the output to API/public/ for serving.
set -e

echo "Building frontend..."
cd Main && npm run build
cd ..

echo "Deploying build to API/public/..."
cp -r Main/dist/. API/public/

echo "Done. API/public/ is ready to commit and push."
