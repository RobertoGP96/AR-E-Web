"""
Serializadores para el sistema de notificaciones.
"""

from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from api.notifications.models_notifications import Notification, NotificationPreference, NotificationType, NotificationPriority
from api.serializers import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializador para notificaciones.
    """
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True)
    sender_name = serializers.CharField(source='sender.full_name', read_only=True, allow_null=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient',
            'recipient_name',
            'sender',
            'sender_name',
            'notification_type',
            'notification_type_display',
            'priority',
            'priority_display',
            'title',
            'message',
            'action_url',
            'is_read',
            'read_at',
            'metadata',
            'created_at',
            'expires_at',
            'time_ago',
        ]
        read_only_fields = [
            'id',
            'recipient',
            'sender',
            'notification_type',
            'priority',
            'title',
            'message',
            'action_url',
            'read_at',
            'metadata',
            'created_at',
            'expires_at',
        ]
    
    @extend_schema_field(str)
    def get_time_ago(self, obj):
        """Calcular tiempo transcurrido desde la creación de la notificación"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return 'Hace unos segundos'
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f'Hace {minutes} {"minuto" if minutes == 1 else "minutos"}'
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f'Hace {hours} {"hora" if hours == 1 else "horas"}'
        elif diff < timedelta(days=30):
            days = diff.days
            return f'Hace {days} {"día" if days == 1 else "días"}'
        elif diff < timedelta(days=365):
            months = int(diff.days / 30)
            return f'Hace {months} {"mes" if months == 1 else "meses"}'
        else:
            years = int(diff.days / 365)
            return f'Hace {years} {"año" if years == 1 else "años"}'


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializador para preferencias de notificación.
    """
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id',
            'user',
            'user_name',
            'enabled_notification_types',
            'email_notifications',
            'push_notifications',
            'digest_frequency',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class MarkAsReadSerializer(serializers.Serializer):
    """
    Serializador para marcar notificaciones como leídas.
    """
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='Lista de IDs de notificaciones a marcar como leídas. Si no se proporciona, marca todas.'
    )


class NotificationStatsSerializer(serializers.Serializer):
    """
    Serializador para estadísticas de notificaciones.
    """
    total = serializers.IntegerField()
    unread = serializers.IntegerField()
    by_type = serializers.DictField()
    by_priority = serializers.DictField()


class NotificationGroupSerializer(serializers.Serializer):
    """
    Serializador para grupos de notificaciones.
    """
    id = serializers.IntegerField()
    recipient = serializers.IntegerField(source='recipient.id')
    recipient_name = serializers.CharField(source='recipient.full_name')
    notification_type = serializers.CharField()
    notification_type_display = serializers.CharField(source='get_notification_type_display')
    title = serializers.CharField()
    count = serializers.IntegerField()
    is_read = serializers.BooleanField()
    aggregated_data = serializers.JSONField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    
    # Datos de primera y última notificación
    first_notification_id = serializers.IntegerField(source='first_notification.id')
    last_notification_id = serializers.IntegerField(source='last_notification.id')
    last_action_url = serializers.CharField(source='last_notification.action_url', allow_null=True)


class GroupedNotificationsSerializer(serializers.Serializer):
    """
    Serializador para notificaciones agrupadas + individuales.
    """
    groups = NotificationGroupSerializer(many=True)
    individual = NotificationSerializer(many=True)
    total_groups = serializers.IntegerField()
    total_individual = serializers.IntegerField()
    total_notifications_in_groups = serializers.IntegerField()
