"""
Settings configuration that imports the appropriate settings based on environment.
"""

import os

# Determine which settings file to use
environment = os.getenv('DJANGO_ENV', 'development').lower()

if environment == 'production':
    from .production import *
elif environment == 'staging':
    # You can create a staging.py file later if needed
    from .development import *
else:
    from .development import *