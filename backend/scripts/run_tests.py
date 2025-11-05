"""
Test runner script for the API
"""

import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner


def run_tests():
    """Run all tests for the API"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=2, interactive=True)
    
    # Run all tests in the api.tests module
    failures = test_runner.run_tests(['api.tests'])
    
    if failures:
        sys.exit(1)
    else:
        print("\n✅ All tests passed!")


if __name__ == '__main__':
    run_tests()
