#!/usr/bin/env bash
# exit on error
set -o errexit

# This build script runs when Root Directory is set to 'backend'

# Install system dependencies for lxml (if running on Ubuntu/Debian)
# Note: These may already be available on Render, but ensuring they're present
if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get install -y libxml2-dev libxslt-dev python3-dev
fi

# Upgrade pip to latest version
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Convert static asset files
python manage.py collectstatic --no-input

# Apply any outstanding database migrations
python manage.py migrate