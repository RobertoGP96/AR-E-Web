#!/usr/bin/env bash
# exit on error
set -o errexit

# Change to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Convert static asset files
python manage.py collectstatic --no-input

# Apply any outstanding database migrations
python manage.py migrate