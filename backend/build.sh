#!/usr/bin/env bash
# exit on error
set -o errexit

# This build script runs when Root Directory is set to 'backend'

# Upgrade pip to latest version
pip install --upgrade pip

# Install dependencies with binary wheels when possible to avoid compilation
pip install --only-binary=lxml,psycopg2-binary -r requirements.txt

# Convert static asset files
python manage.py collectstatic --no-input

# Apply any outstanding database migrations
python manage.py migrate