"""
Vistas para el sistema de notificaciones.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Count
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from api.notifications.models_notifications import Notification, NotificationPreference, NotificationType, NotificationPriority
from api.notifications.serializers_notifications import (
    NotificationSerializer,
    NotificationPreferenceSerializer,
    MarkAsReadSerializer,
    NotificationStatsSerializer,
    NotificationGroupSerializer,
    GroupedNotificationsSerializer,
)
from api.notifications.throttling_notifications import NotificationThrottle
from api.notifications.grouping_notifications import NotificationGrouper, NotificationGroup


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar notificaciones del usuario autenticado.
    
    Funcionalidades:
    - Listar notificaciones (filtradas por usuario autenticado)
    - Marcar notificaciones como leídas/no leídas
    - Eliminar notificaciones
    - Obtener estadísticas de notificaciones
    - Filtrar por tipo, prioridad, leídas/no leídas
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['notification_type', 'priority', 'is_read']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority', 'is_read']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Filtrar notificaciones solo del usuario autenticado.
        Excluir notificaciones expiradas.
        """
        # Para documentación swagger, devolver queryset vacío si no hay usuario
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return Notification.objects.none()
        
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('sender', 'recipient').prefetch_related('content_type')
    
    @extend_schema(
        summary="Listar notificaciones del usuario",
        description="Obtiene todas las notificaciones del usuario autenticado, ordenadas por fecha de creación (más recientes primero).",
        responses={200: NotificationSerializer(many=True)},
        tags=["Notificaciones"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @extend_schema(
        summary="Obtener detalle de notificación",
        description="Obtiene el detalle de una notificación específica.",
        responses={200: NotificationSerializer},
        tags=["Notificaciones"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(
        summary="Eliminar notificación",
        description="Elimina una notificación específica.",
        responses={204: None},
        tags=["Notificaciones"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @extend_schema(
        summary="Marcar notificación como leída",
        description="Marca una notificación específica como leída.",
        responses={200: NotificationSerializer},
        tags=["Notificaciones"]
    )
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Marcar una notificación como leída"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Marcar notificación como no leída",
        description="Marca una notificación específica como no leída.",
        responses={200: NotificationSerializer},
        tags=["Notificaciones"]
    )
    @action(detail=True, methods=['post'])
    def mark_as_unread(self, request, pk=None):
        """Marcar una notificación como no leída"""
        notification = self.get_object()
        notification.mark_as_unread()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Marcar múltiples notificaciones como leídas",
        description="Marca múltiples notificaciones como leídas. Si no se proporcionan IDs, marca todas las notificaciones del usuario como leídas.",
        request=MarkAsReadSerializer,
        responses={200: OpenApiTypes.OBJECT},
        tags=["Notificaciones"],
        examples=[
            OpenApiExample(
                "Marcar notificaciones específicas",
                value={"notification_ids": [1, 2, 3]},
                request_only=True
            ),
            OpenApiExample(
                "Marcar todas como leídas",
                value={},
                request_only=True
            )
        ]
    )
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Marcar todas las notificaciones como leídas (o una lista específica)"""
        serializer = MarkAsReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification_ids = serializer.validated_data.get('notification_ids')
        
        if notification_ids:
            # Marcar solo las notificaciones especificadas
            notifications = self.get_queryset().filter(id__in=notification_ids, is_read=False)
        else:
            # Marcar todas las notificaciones no leídas
            notifications = self.get_queryset().filter(is_read=False)
        
        count = notifications.count()
        
        # Marcar como leídas
        from django.utils import timezone
        notifications.update(is_read=True, read_at=timezone.now())
        
        return Response({
            'success': True,
            'message': f'{count} notificaciones marcadas como leídas',
            'count': count
        })
    
    @extend_schema(
        summary="Obtener notificaciones no leídas",
        description="Obtiene solo las notificaciones que no han sido leídas por el usuario.",
        responses={200: NotificationSerializer(many=True)},
        tags=["Notificaciones"]
    )
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Obtener solo notificaciones no leídas"""
        notifications = self.get_queryset().filter(is_read=False)
        
        # Aplicar filtros adicionales si se proporcionan
        notification_type = request.query_params.get('notification_type')
        priority = request.query_params.get('priority')
        
        if notification_type:
            notifications = notifications.filter(notification_type=notification_type)
        if priority:
            notifications = notifications.filter(priority=priority)
        
        page = self.paginate_queryset(notifications)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Obtener conteo de notificaciones no leídas",
        description="Obtiene el número total de notificaciones no leídas del usuario.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Notificaciones"],
        examples=[
            OpenApiExample(
                "Respuesta de conteo",
                value={"unread_count": 5},
                response_only=True
            )
        ]
    )
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Obtener el conteo de notificaciones no leídas"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
    
    @extend_schema(
        summary="Obtener estadísticas de notificaciones",
        description="Obtiene estadísticas detalladas de las notificaciones del usuario: total, no leídas, por tipo y por prioridad.",
        responses={200: NotificationStatsSerializer},
        tags=["Notificaciones"],
        examples=[
            OpenApiExample(
                "Ejemplo de estadísticas",
                value={
                    "total": 50,
                    "unread": 5,
                    "by_type": {
                        "order_created": 10,
                        "product_delivered": 8,
                        "payment_received": 5
                    },
                    "by_priority": {
                        "high": 15,
                        "normal": 30,
                        "low": 5
                    }
                },
                response_only=True
            )
        ]
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtener estadísticas de notificaciones"""
        queryset = self.get_queryset()
        
        # Conteo total y no leídas
        total = queryset.count()
        unread = queryset.filter(is_read=False).count()
        
        # Conteo por tipo
        by_type = dict(
            queryset.values('notification_type')
            .annotate(count=Count('id'))
            .values_list('notification_type', 'count')
        )
        
        # Conteo por prioridad
        by_priority = dict(
            queryset.values('priority')
            .annotate(count=Count('id'))
            .values_list('priority', 'count')
        )
        
        stats_data = {
            'total': total,
            'unread': unread,
            'by_type': by_type,
            'by_priority': by_priority,
        }
        
        serializer = NotificationStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Eliminar notificaciones leídas",
        description="Elimina todas las notificaciones que ya han sido leídas por el usuario.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Notificaciones"]
    )
    @action(detail=False, methods=['delete'])
    def clear_read(self, request):
        """Eliminar todas las notificaciones leídas"""
        count = self.get_queryset().filter(is_read=True).delete()[0]
        return Response({
            'success': True,
            'message': f'{count} notificaciones eliminadas',
            'count': count
        })
    
    @extend_schema(
        summary="Eliminar todas las notificaciones",
        description="Elimina todas las notificaciones del usuario (tanto leídas como no leídas).",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Notificaciones"]
    )
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Eliminar todas las notificaciones"""
        count = self.get_queryset().delete()[0]
        return Response({
            'success': True,
            'message': f'{count} notificaciones eliminadas',
            'count': count
        })
    
    @extend_schema(
        summary="Obtener estadísticas de throttling",
        description="Obtiene información sobre los límites de tasa de notificaciones del usuario y cuántas ha recibido en la última hora.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Notificaciones"]
    )
    @action(detail=False, methods=['get'])
    def throttle_stats(self, request):
        """Obtener estadísticas de throttling del usuario"""
        stats = NotificationThrottle.get_user_stats(request.user.id)
        return Response(stats)
    
    @extend_schema(
        summary="Obtener notificaciones agrupadas",
        description="Obtiene notificaciones con agrupación inteligente aplicada. Agrupa notificaciones similares para reducir el ruido.",
        responses={200: GroupedNotificationsSerializer},
        tags=["Notificaciones"]
    )
    @action(detail=False, methods=['get'])
    def grouped(self, request):
        """Obtener notificaciones con agrupación aplicada"""
        include_read = request.query_params.get('include_read', 'false').lower() == 'true'
        
        grouped_data = NotificationGrouper.get_grouped_notifications(
            recipient_id=request.user.id,
            include_read=include_read
        )
        
        serializer = GroupedNotificationsSerializer(grouped_data)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Expandir grupo de notificaciones",
        description="Obtiene todas las notificaciones individuales de un grupo.",
        parameters=[
            OpenApiParameter(
                name='group_id',
                type=int,
                location=OpenApiParameter.PATH,
                description='ID del grupo de notificaciones'
            )
        ],
        responses={200: NotificationSerializer(many=True)},
        tags=["Notificaciones"]
    )
    @action(detail=False, methods=['get'], url_path='groups/(?P<group_id>[^/.]+)/expand')
    def expand_group(self, request, group_id=None):
        """Expandir un grupo para ver todas sus notificaciones"""
        notifications = NotificationGrouper.expand_group(int(group_id))
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Marcar grupo como leído",
        description="Marca un grupo completo y todas sus notificaciones como leídas.",
        parameters=[
            OpenApiParameter(
                name='group_id',
                type=int,
                location=OpenApiParameter.PATH,
                description='ID del grupo de notificaciones'
            )
        ],
        responses={200: OpenApiTypes.OBJECT},
        tags=["Notificaciones"]
    )
    @action(detail=False, methods=['post'], url_path='groups/(?P<group_id>[^/.]+)/mark-read')
    def mark_group_read(self, request, group_id=None):
        """Marcar un grupo completo como leído"""
        NotificationGrouper.mark_group_as_read(int(group_id))
        return Response({
            'success': True,
            'message': 'Grupo marcado como leído'
        })


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las preferencias de notificación del usuario.
    
    Permite al usuario configurar:
    - Tipos de notificaciones que desea recibir
    - Activar/desactivar notificaciones por email
    - Activar/desactivar notificaciones push
    - Configurar frecuencia de resumen de notificaciones
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Solo las preferencias del usuario autenticado"""
        # Para documentación swagger, devolver queryset vacío si no hay usuario
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return NotificationPreference.objects.none()
        
        return NotificationPreference.objects.filter(user=self.request.user)
    
    @extend_schema(
        summary="Obtener preferencias de notificación",
        description="Obtiene las preferencias de notificación del usuario autenticado. Si no existen, las crea con valores por defecto.",
        responses={200: NotificationPreferenceSerializer},
        tags=["Preferencias de Notificación"]
    )
    def list(self, request, *args, **kwargs):
        """Obtener preferencias (crea si no existen)"""
        preferences = NotificationPreference.get_or_create_preferences(request.user)
        serializer = self.get_serializer(preferences)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Actualizar preferencias de notificación",
        description="Actualiza las preferencias de notificación del usuario.",
        request=NotificationPreferenceSerializer,
        responses={200: NotificationPreferenceSerializer},
        tags=["Preferencias de Notificación"]
    )
    @action(detail=False, methods=['put', 'patch'])
    def update_preferences(self, request):
        """Actualizar preferencias de notificación"""
        preferences = NotificationPreference.get_or_create_preferences(request.user)
        serializer = self.get_serializer(preferences, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @extend_schema(
        summary="Obtener tipos de notificación disponibles",
        description="Obtiene la lista de todos los tipos de notificación disponibles en el sistema.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Preferencias de Notificación"]
    )
    @action(detail=False, methods=['get'])
    def notification_types(self, request):
        """Obtener lista de tipos de notificación disponibles"""
        types = [
            {'value': choice[0], 'label': choice[1]}
            for choice in NotificationType.choices
        ]
        return Response({'notification_types': types})
    
    @extend_schema(
        summary="Restablecer preferencias a valores por defecto",
        description="Restablece todas las preferencias de notificación del usuario a los valores por defecto del sistema.",
        responses={200: NotificationPreferenceSerializer},
        tags=["Preferencias de Notificación"]
    )
    @action(detail=False, methods=['post'])
    def reset_to_defaults(self, request):
        """Restablecer preferencias a valores por defecto"""
        preferences = NotificationPreference.get_or_create_preferences(request.user)
        preferences.enabled_notification_types = []
        preferences.email_notifications = True
        preferences.push_notifications = True
        preferences.digest_frequency = 'immediate'
        preferences.save()
        
        serializer = self.get_serializer(preferences)
        return Response(serializer.data)
