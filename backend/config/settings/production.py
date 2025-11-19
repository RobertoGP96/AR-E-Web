"""
Production settings.
"""

import dj_database_url
import os
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Production allowed hosts
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='ar-e-web.onrender.com,www.ar-e-web.onrender.com',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# If this app runs on Render, Render sets the environment variable
# RENDER_EXTERNAL_HOSTNAME with the public hostname (eg: app-name.onrender.com).
# Add it to ALLOWED_HOSTS automatically if present so you don't need to
# manually update environment vars when deploying to Render.
render_host = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if render_host:
    # In some setups ALLOWED_HOSTS may be a tuple from the config cast; ensure list
    if not isinstance(ALLOWED_HOSTS, list):
        ALLOWED_HOSTS = list(ALLOWED_HOSTS)
    if render_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(render_host)

# Database
DATABASE_URL = config('DATABASE_URL')

if DATABASE_URL:
    # Use Neon PostgreSQL in production
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
    # Add SSL configuration for Neon
    DATABASES['default']['OPTIONS'] = {
        'sslmode': 'require',
    }
else:
    # Fallback to SQLite if DATABASE_URL is not set
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# CORS settings for production
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='https://your-frontend-domain.com',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

CORS_ALLOW_ALL_ORIGINS = False

# Security settings for production
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Email backend for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

# Logging Configuration for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'json': {
            'format': '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(module)s", "message": "%(message)s"}',
            'class': 'pythonjsonlogger.jsonlogger.JsonFormatter',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'api': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}