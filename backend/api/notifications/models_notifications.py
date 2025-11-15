"""
Modelos para el sistema de notificaciones
"""

from django.db import models
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
# from api.models import CustomUser  # Eliminado para evitar importación circular


class NotificationManager(models.Manager):
    """Manager personalizado para Notificaciones"""
    
    def unread(self):
        """Obtener solo notificaciones no leídas"""
        return self.filter(is_read=False)
    
    def for_user(self, user):
        """Obtener notificaciones para un usuario específico"""
        return self.filter(recipient=user)
    
    def by_type(self, notification_type):
        """Filtrar por tipo de notificación"""
        return self.filter(notification_type=notification_type)
    
    def high_priority(self):
        """Obtener solo notificaciones de alta prioridad"""
        return self.filter(priority__in=[NotificationPriority.HIGH, NotificationPriority.URGENT])
    
    def expired(self):
        """Obtener notificaciones expiradas"""
        from django.utils import timezone
        return self.filter(expires_at__lt=timezone.now())
    
    def delete_expired(self):
        """Eliminar notificaciones expiradas"""
        count = self.expired().count()
        self.expired().delete()
        return count
    
    def delete_old_read(self, days=30):
        """Eliminar notificaciones leídas más antiguas que X días"""
        from django.utils import timezone
        from datetime import timedelta
        cutoff_date = timezone.now() - timedelta(days=days)
        count = self.filter(is_read=True, created_at__lt=cutoff_date).count()
        self.filter(is_read=True, created_at__lt=cutoff_date).delete()
        return count


class NotificationType(models.TextChoices):
    """Tipos de notificaciones del sistema"""
    
    # Notificaciones de órdenes
    ORDER_CREATED = 'order_created', 'Orden creada'
    ORDER_STATUS_CHANGED = 'order_status_changed', 'Estado de orden cambiado'
    ORDER_ASSIGNED = 'order_assigned', 'Orden asignada'
    ORDER_COMPLETED = 'order_completed', 'Orden completada'
    ORDER_CANCELLED = 'order_cancelled', 'Orden cancelada'
    
    # Notificaciones de productos
    PRODUCT_ADDED = 'product_added', 'Producto añadido'
    PRODUCT_PURCHASED = 'product_purchased', 'Producto comprado'
    PRODUCT_RECEIVED = 'product_received', 'Producto recibido'
    PRODUCT_DELIVERED = 'product_delivered', 'Producto entregado'
    PRODUCT_OUT_OF_STOCK = 'product_out_of_stock', 'Producto agotado'
    
    # Notificaciones de pagos
    PAYMENT_RECEIVED = 'payment_received', 'Pago recibido'
    PAYMENT_PENDING = 'payment_pending', 'Pago pendiente'
    PAYMENT_OVERDUE = 'payment_overdue', 'Pago vencido'
    
    # Notificaciones de paquetes
    PACKAGE_SHIPPED = 'package_shipped', 'Paquete enviado'
    PACKAGE_IN_TRANSIT = 'package_in_transit', 'Paquete en tránsito'
    PACKAGE_DELIVERED = 'package_delivered', 'Paquete entregado'
    PACKAGE_DELAYED = 'package_delayed', 'Paquete retrasado'
    
    # Notificaciones de usuario
    USER_REGISTERED = 'user_registered', 'Usuario registrado'
    USER_VERIFIED = 'user_verified', 'Usuario verificado'
    USER_ROLE_CHANGED = 'user_role_changed', 'Rol de usuario cambiado'
    
    # Notificaciones del sistema
    SYSTEM_MESSAGE = 'system_message', 'Mensaje del sistema'
    SYSTEM_ALERT = 'system_alert', 'Alerta del sistema'
    SYSTEM_MAINTENANCE = 'system_maintenance', 'Mantenimiento del sistema'


class NotificationPriority(models.TextChoices):
    """Prioridades de notificaciones"""
    LOW = 'low', 'Baja'
    NORMAL = 'normal', 'Normal'
    HIGH = 'high', 'Alta'
    URGENT = 'urgent', 'Urgente'


class Notification(models.Model):
    """
    Modelo para almacenar notificaciones del sistema.
    Cada notificación está asociada a un usuario y puede estar vinculada a cualquier objeto del sistema.
    """
    
    # Manager personalizado
    objects = NotificationManager()
    
    # Usuario destinatario
    recipient = models.ForeignKey(
        'api.CustomUser',
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Destinatario'
    )
    
    # Usuario que generó la notificación (opcional)
    sender = models.ForeignKey(
        'api.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications',
        verbose_name='Remitente'
    )
    
    # Tipo y prioridad
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        verbose_name='Tipo'
    )
    
    priority = models.CharField(
        max_length=20,
        choices=NotificationPriority.choices,
        default=NotificationPriority.NORMAL,
        verbose_name='Prioridad'
    )
    
    # Contenido
    title = models.CharField(max_length=200, verbose_name='Título')
    message = models.TextField(verbose_name='Mensaje')
    
    # Relación genérica (para vincular a cualquier modelo)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')
    
    # URL de acción (donde redirigir al hacer clic)
    action_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='URL de acción'
    )
    
    # Estado
    is_read = models.BooleanField(
        default=False,
        verbose_name='Leída'
    )
    
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Leída en'
    )
    
    # Metadata adicional (JSON)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadata'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name='Creada en'
    )
    
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Expira en',
        help_text='Las notificaciones pueden expirar automáticamente'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        indexes = [
            # Índices para consultas comunes
            models.Index(fields=['recipient', '-created_at'], name='notif_recip_created_idx'),
            models.Index(fields=['recipient', 'is_read'], name='notif_recip_read_idx'),
            models.Index(fields=['recipient', 'is_read', '-created_at'], name='notif_recip_read_created_idx'),
            models.Index(fields=['notification_type'], name='notif_type_idx'),
            models.Index(fields=['priority', '-created_at'], name='notif_priority_created_idx'),
            # Índice para notificaciones no leídas (query más común)
            models.Index(fields=['recipient', 'is_read', 'priority'], name='notif_unread_priority_idx'),
            # Índice para limpieza de notificaciones expiradas
            models.Index(fields=['expires_at'], name='notif_expires_idx'),
            # Índice para búsquedas por contenido relacionado
            models.Index(fields=['content_type', 'object_id'], name='notif_content_idx'),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.recipient.full_name}"
    
    def mark_as_read(self):
        """Marcar la notificación como leída"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def mark_as_unread(self):
        """Marcar la notificación como no leída"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=['is_read', 'read_at'])
    
    @property
    def is_expired(self):
        """Verificar si la notificación ha expirado"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    @classmethod
    def create_notification(cls, recipient, notification_type, title, message, 
                          sender=None, priority=NotificationPriority.NORMAL,
                          related_object=None, action_url=None, metadata=None, expires_at=None):
        """
        Método helper para crear notificaciones de forma más sencilla.
        
        Args:
            recipient: Usuario destinatario
            notification_type: Tipo de notificación (NotificationType)
            title: Título de la notificación
            message: Mensaje de la notificación
            sender: Usuario que genera la notificación (opcional)
            priority: Prioridad de la notificación (opcional)
            related_object: Objeto relacionado (opcional)
            action_url: URL de acción (opcional)
            metadata: Metadata adicional en formato dict (opcional)
            expires_at: Fecha de expiración (opcional)
        
        Returns:
            Notification: Instancia de la notificación creada
        """
        notification = cls(
            recipient=recipient,
            sender=sender,
            notification_type=notification_type,
            priority=priority,
            title=title,
            message=message,
            action_url=action_url,
            metadata=metadata or {},
            expires_at=expires_at
        )
        
        if related_object:
            notification.related_object = related_object
        
        notification.save()
        return notification
    
    @classmethod
    def create_bulk_notifications(cls, recipients, notification_type, title, message,
                                 sender=None, priority=NotificationPriority.NORMAL,
                                 action_url=None, metadata=None):
        """
        Crear múltiples notificaciones para varios usuarios a la vez.
        
        Args:
            recipients: Lista de usuarios destinatarios
            notification_type: Tipo de notificación
            title: Título de la notificación
            message: Mensaje de la notificación
            sender: Usuario que genera la notificación (opcional)
            priority: Prioridad (opcional)
            action_url: URL de acción (opcional)
            metadata: Metadata adicional (opcional)
        
        Returns:
            list: Lista de notificaciones creadas
        """
        notifications = [
            cls(
                recipient=recipient,
                sender=sender,
                notification_type=notification_type,
                priority=priority,
                title=title,
                message=message,
                action_url=action_url,
                metadata=metadata or {}
            )
            for recipient in recipients
        ]
        
        return cls.objects.bulk_create(notifications)


class NotificationPreference(models.Model):
    """
    Preferencias de notificación por usuario.
    Permite a los usuarios configurar qué tipos de notificaciones desean recibir.
    """
    
    user = models.OneToOneField(
        'api.CustomUser',
        on_delete=models.CASCADE,
        related_name='notification_preferences',
        verbose_name='Usuario'
    )
    
    # Preferencias por tipo de notificación
    enabled_notification_types = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Tipos de notificación habilitados',
        help_text='Lista de tipos de notificación que el usuario desea recibir'
    )
    
    # Preferencias generales
    email_notifications = models.BooleanField(
        default=True,
        verbose_name='Notificaciones por email'
    )
    
    push_notifications = models.BooleanField(
        default=True,
        verbose_name='Notificaciones push'
    )
    
    # Configuración de frecuencia
    digest_frequency = models.CharField(
        max_length=20,
        choices=[
            ('immediate', 'Inmediato'),
            ('daily', 'Diario'),
            ('weekly', 'Semanal'),
            ('never', 'Nunca'),
        ],
        default='immediate',
        verbose_name='Frecuencia de resumen'
    )
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Preferencia de notificación'
        verbose_name_plural = 'Preferencias de notificación'
    
    def __str__(self):
        return f"Preferencias de {self.user.full_name}"
    
    def is_notification_enabled(self, notification_type):
        """Verificar si un tipo de notificación está habilitado"""
        # Si la lista está vacía, todas las notificaciones están habilitadas por defecto
        if not self.enabled_notification_types:
            return True
        return notification_type in self.enabled_notification_types
    
    @classmethod
    def get_or_create_preferences(cls, user):
        """Obtener o crear preferencias para un usuario"""
        preferences, created = cls.objects.get_or_create(
            user=user,
            defaults={
                'enabled_notification_types': [],
                'email_notifications': True,
                'push_notifications': True,
                'digest_frequency': 'immediate'
            }
        )
        return preferences
