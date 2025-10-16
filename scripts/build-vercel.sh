#!/bin/bash
set -e

echo "Building client application..."

# Install dependencies at root level
pnpm install --frozen-lockfile

# Build client
pnpm build:client

echo "Build completed successfully!"