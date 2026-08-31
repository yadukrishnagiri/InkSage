#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=== 1. Building React Frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== 2. Installing Lightweight CPU PyTorch & Backend Dependencies ==="
cd backend
python -m pip install --upgrade pip setuptools wheel
# Install CPU-only PyTorch first to prevent downloading 2GB+ of NVIDIA CUDA bloat
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
cd ..

echo "=== Build Completed Successfully! ==="
