"""
URLs para el sistema de notificaciones.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.notifications.views_notifications import NotificationViewSet, NotificationPreferenceViewSet
from api.notifications.realtime_notifications import notification_sse_view

# Crear router para las vistas de notificaciones
router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'notification-preferences', NotificationPreferenceViewSet, basename='notification-preference')

urlpatterns = [
    # SSE stream endpoint (se añade el prefijo principal al incluir este módulo en `api_urls.py`)
    path('notifications/stream/', notification_sse_view, name='notification-stream'),
    # Router URLs
    *router.urls,
]
