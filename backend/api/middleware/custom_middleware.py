"""
Custom middleware for request logging and error handling.
"""

import time
import logging
from django.conf import settings
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.exceptions import APIException

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    """
    Middleware to log API requests and responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Start timing
        start_time = time.time()

        # Log request
        self._log_request(request)

        # Process request
        response = self.get_response(request)

        # Calculate duration
        duration = time.time() - start_time

        # Log response
        self._log_response(request, response, duration)

        return response

    def _log_request(self, request):
        """Log incoming request details."""
        if settings.DEBUG or getattr(settings, 'LOG_API_REQUESTS', False):
            logger.info(
                f"API Request: {request.method} {request.path} "
                f"from {self._get_client_ip(request)} "
                f"user={request.user.username if request.user.is_authenticated else 'anonymous'}"
            )

    def _log_response(self, request, response, duration):
        """Log response details."""
        if settings.DEBUG or getattr(settings, 'LOG_API_REQUESTS', False):
            logger.info(
                f"API Response: {request.method} {request.path} "
                f"status={response.status_code} "
                f"duration={duration:.3f}s"
            )

    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ExceptionHandlingMiddleware:
    """
    Middleware to handle exceptions and return proper JSON responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            return self._handle_exception(e, request)

    def _handle_exception(self, exc, request):
        """Handle different types of exceptions."""

        # Log the exception
        logger.error(
            f"Exception in {request.method} {request.path}: {str(exc)}",
            exc_info=True
        )

        # Handle Django ValidationError
        if isinstance(exc, ValidationError):
            return JsonResponse({
                'error': 'Validation Error',
                'details': exc.messages
            }, status=status.HTTP_400_BAD_REQUEST)

        # Handle DRF APIException
        if isinstance(exc, APIException):
            return JsonResponse({
                'error': exc.detail
            }, status=exc.status_code)

        # Handle database errors
        if 'database' in str(exc).lower() or 'connection' in str(exc).lower():
            return JsonResponse({
                'error': 'Database Error',
                'message': 'A database error occurred. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Handle permission errors
        if isinstance(exc, PermissionError):
            return JsonResponse({
                'error': 'Permission Denied',
                'message': 'You do not have permission to perform this action.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Generic server error
        return JsonResponse({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CORSMiddleware:
    """
    Custom CORS middleware for better control.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add CORS headers
        origin = request.META.get('HTTP_ORIGIN')
        if origin and self._is_allowed_origin(origin):
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = (
                'Accept, Accept-Encoding, Authorization, Content-Type, '
                'DNT, Origin, User-Agent, X-CSRFToken, X-Requested-With'
            )
            response['Access-Control-Max-Age'] = '86400'  # 24 hours

        return response

    def _is_allowed_origin(self, origin):
        """Check if origin is in allowed origins."""
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        return origin in allowed_origins