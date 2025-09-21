#!/usr/bin/env bash
# exit on error
set -o errexit

# Check if we're in the right directory
if [ -d "backend" ]; then
    echo "Found backend directory, changing to it..."
    cd backend
elif [ -f "manage.py" ]; then
    echo "Already in backend directory..."
else
    echo "ERROR: Cannot find Django project structure"
    exit 1
fi

# Install dependencies
pip install -r requirements.txt

# Convert static asset files
python manage.py collectstatic --no-input

# Apply any outstanding database migrations
python manage.py migrate