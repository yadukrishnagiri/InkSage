#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=== 1. Building React Frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== 2. Installing Backend Dependencies ==="
cd backend
pip install -r requirements.txt
cd ..

echo "=== Build Completed Successfully! ==="
