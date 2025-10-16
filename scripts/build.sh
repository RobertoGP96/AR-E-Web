#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Check if we're in the right directory
if [ -f "manage.py" ]; then
    echo "Already in Django project directory..."
elif [ -d "backend" ]; then
    echo "Found backend directory, changing to it..."
    cd backend
    echo "Changed to: $(pwd)"
    ls -la
else
    echo "ERROR: Cannot find Django project structure"
    echo "Looking for manage.py or backend directory..."
    exit 1
fi

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# Convert static asset files
python manage.py collectstatic --no-input

# Apply any outstanding database migrations
python manage.py migrate

# Create superuser if environment variables are set
if [ ! -z "$DJANGO_SUPERUSER_USERNAME" ] && [ ! -z "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser..."
    python manage.py create_admin
else
    echo "Superuser environment variables not set, skipping superuser creation"
    echo "To create superuser later, set DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, and DJANGO_SUPERUSER_PASSWORD"
fi