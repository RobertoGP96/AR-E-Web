"""
Sistema de agrupación de notificaciones similares.

Agrupa notificaciones del mismo tipo para reducir el ruido y mejorar la UX.
Por ejemplo, en lugar de mostrar:
- "Producto A fue comprado"
- "Producto B fue comprado"  
- "Producto C fue comprado"

Se muestra:
- "3 productos fueron comprados" (con lista de productos en metadata)
"""

from django.db import models, transaction
from django.utils import timezone
from datetime import timedelta
from typing import List, Optional, Dict, Any
import json

from api.models_notifications import Notification, NotificationType, NotificationPriority


class NotificationGroup(models.Model):
    """
    Modelo para agrupar notificaciones similares.
    """
    
    # Usuario destinatario
    recipient = models.ForeignKey(
        'api.CustomUser',
        on_delete=models.CASCADE,
        related_name='notification_groups',
        verbose_name='Destinatario'
    )
    
    # Tipo de notificación agrupada
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        verbose_name='Tipo'
    )
    
    # Título de la agrupación (ej: "5 productos fueron comprados")
    title = models.CharField(max_length=200, verbose_name='Título agrupado')
    
    # Contador de notificaciones en el grupo
    count = models.IntegerField(default=1, verbose_name='Cantidad')
    
    # Primera notificación del grupo (para referencia)
    first_notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='group_first',
        verbose_name='Primera notificación'
    )
    
    # Última notificación agregada
    last_notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='group_last',
        verbose_name='Última notificación'
    )
    
    # Metadata agregada (lista de todas las notificaciones)
    aggregated_data = models.JSONField(
        default=list,
        verbose_name='Datos agregados'
    )
    
    # Estado
    is_read = models.BooleanField(default=False, verbose_name='Leído')
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Grupo de notificaciones'
        verbose_name_plural = 'Grupos de notificaciones'
        indexes = [
            models.Index(fields=['recipient', 'notification_type', '-updated_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.count} notificaciones)"
    
    def add_notification(self, notification: Notification):
        """Agregar una notificación al grupo"""
        with transaction.atomic():
            self.count += 1
            self.last_notification = notification
            self.updated_at = timezone.now()
            
            # Agregar metadata de la notificación
            notif_data = {
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'metadata': notification.metadata,
                'created_at': notification.created_at.isoformat(),
                'action_url': notification.action_url,
            }
            
            if not isinstance(self.aggregated_data, list):
                self.aggregated_data = []
            
            self.aggregated_data.append(notif_data)
            
            # Actualizar título con contador
            self.title = self._generate_group_title()
            
            self.save()
    
    def _generate_group_title(self) -> str:
        """Generar título descriptivo según el tipo y cantidad"""
        type_templates = {
            NotificationType.ORDER_CREATED: "{count} órdenes fueron creadas",
            NotificationType.PRODUCT_PURCHASED: "{count} productos fueron comprados",
            NotificationType.PRODUCT_RECEIVED: "{count} productos fueron recibidos",
            NotificationType.PRODUCT_DELIVERED: "{count} productos fueron entregados",
            NotificationType.PAYMENT_RECEIVED: "{count} pagos fueron recibidos",
            NotificationType.PACKAGE_SHIPPED: "{count} paquetes fueron enviados",
            NotificationType.PACKAGE_DELIVERED: "{count} paquetes fueron entregados",
        }
        
        template = type_templates.get(
            self.notification_type,
            "{count} notificaciones de {type}"
        )
        
        return template.format(
            count=self.count,
            type=self.get_notification_type_display()
        )
    
    def mark_as_read(self):
        """Marcar el grupo completo como leído"""
        self.is_read = True
        self.save(update_fields=['is_read'])
    
    def get_notification_ids(self) -> List[int]:
        """Obtener IDs de todas las notificaciones en el grupo"""
        return [item['id'] for item in self.aggregated_data if 'id' in item]


class NotificationGrouper:
    """
    Clase para gestionar la agrupación de notificaciones.
    """
    
    # Tiempo máximo para considerar notificaciones como agrupables (minutos)
    GROUPING_WINDOW = 30
    
    # Tipos de notificación que se pueden agrupar
    GROUPABLE_TYPES = [
        NotificationType.PRODUCT_PURCHASED,
        NotificationType.PRODUCT_RECEIVED,
        NotificationType.PRODUCT_DELIVERED,
        NotificationType.ORDER_CREATED,
        NotificationType.PAYMENT_RECEIVED,
        NotificationType.PACKAGE_SHIPPED,
        NotificationType.PACKAGE_DELIVERED,
    ]
    
    @classmethod
    def should_group(cls, notification_type: str) -> bool:
        """Verificar si un tipo de notificación debe agruparse"""
        return notification_type in cls.GROUPABLE_TYPES
    
    @classmethod
    def find_active_group(
        cls,
        recipient_id: int,
        notification_type: str
    ) -> Optional[NotificationGroup]:
        """
        Buscar un grupo activo para agregar la notificación.
        
        Un grupo es activo si:
        - Es del mismo tipo
        - Fue actualizado en los últimos X minutos
        - No está marcado como leído
        """
        cutoff_time = timezone.now() - timedelta(minutes=cls.GROUPING_WINDOW)
        
        return NotificationGroup.objects.filter(
            recipient_id=recipient_id,
            notification_type=notification_type,
            is_read=False,
            updated_at__gte=cutoff_time
        ).first()
    
    @classmethod
    def create_or_update_group(
        cls,
        notification: Notification
    ) -> Optional[NotificationGroup]:
        """
        Crear un nuevo grupo o agregar a uno existente.
        
        Args:
            notification: La notificación a agrupar
        
        Returns:
            NotificationGroup si se agrupó, None si no aplica agrupación
        """
        # Verificar si el tipo es agrupable
        if not cls.should_group(notification.notification_type):
            return None
        
        # Buscar grupo activo
        group = cls.find_active_group(
            recipient_id=notification.recipient.id,
            notification_type=notification.notification_type
        )
        
        if group:
            # Agregar a grupo existente
            group.add_notification(notification)
            return group
        else:
            # Crear nuevo grupo
            group = NotificationGroup.objects.create(
                recipient=notification.recipient,
                notification_type=notification.notification_type,
                title=notification.title,
                count=1,
                first_notification=notification,
                last_notification=notification,
                aggregated_data=[{
                    'id': notification.id,
                    'title': notification.title,
                    'message': notification.message,
                    'metadata': notification.metadata,
                    'created_at': notification.created_at.isoformat(),
                    'action_url': notification.action_url,
                }]
            )
            return group
    
    @classmethod
    def get_grouped_notifications(
        cls,
        recipient_id: int,
        include_read: bool = False
    ) -> Dict[str, Any]:
        """
        Obtener notificaciones con agrupación aplicada.
        
        Returns:
            dict con 'groups' (agrupadas) y 'individual' (sin agrupar)
        """
        # Obtener grupos activos
        groups_query = NotificationGroup.objects.filter(recipient_id=recipient_id)
        
        if not include_read:
            groups_query = groups_query.filter(is_read=False)
        
        groups = list(groups_query)
        
        # Obtener notificaciones individuales (no agrupables)
        individual_query = Notification.objects.filter(
            recipient_id=recipient_id
        ).exclude(
            notification_type__in=cls.GROUPABLE_TYPES
        )
        
        if not include_read:
            individual_query = individual_query.filter(is_read=False)
        
        individual = list(individual_query)
        
        return {
            'groups': groups,
            'individual': individual,
            'total_groups': len(groups),
            'total_individual': len(individual),
            'total_notifications_in_groups': sum(g.count for g in groups),
        }
    
    @classmethod
    def expand_group(cls, group_id: int) -> List[Notification]:
        """
        Expandir un grupo para ver todas las notificaciones individuales.
        """
        try:
            group = NotificationGroup.objects.get(id=group_id)
            notification_ids = group.get_notification_ids()
            return list(Notification.objects.filter(id__in=notification_ids))
        except NotificationGroup.DoesNotExist:
            return []
    
    @classmethod
    def mark_group_as_read(cls, group_id: int):
        """Marcar un grupo y todas sus notificaciones como leídas"""
        try:
            group = NotificationGroup.objects.get(id=group_id)
            
            with transaction.atomic():
                # Marcar grupo
                group.mark_as_read()
                
                # Marcar todas las notificaciones
                notification_ids = group.get_notification_ids()
                Notification.objects.filter(id__in=notification_ids).update(
                    is_read=True,
                    read_at=timezone.now()
                )
        except NotificationGroup.DoesNotExist:
            pass
    
    @classmethod
    def cleanup_old_groups(cls, days: int = 30):
        """Eliminar grupos antiguos ya leídos"""
        cutoff_date = timezone.now() - timedelta(days=days)
        count = NotificationGroup.objects.filter(
            is_read=True,
            updated_at__lt=cutoff_date
        ).delete()[0]
        return count


def create_notification_with_grouping(
    recipient,
    notification_type,
    title,
    message,
    sender=None,
    priority=NotificationPriority.NORMAL,
    related_object=None,
    action_url=None,
    metadata=None,
    expires_at=None,
    enable_grouping=True
):
    """
    Crear notificación con soporte para agrupación automática.
    
    Args:
        (mismos que Notification.create_notification)
        enable_grouping: Si es True, intentará agrupar la notificación
    
    Returns:
        tuple: (notification, group) donde group puede ser None
    """
    from api.models_notifications import Notification
    
    # Crear notificación
    notification = Notification.create_notification(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        sender=sender,
        priority=priority,
        related_object=related_object,
        action_url=action_url,
        metadata=metadata,
        expires_at=expires_at
    )
    
    # Intentar agrupar
    group = None
    if enable_grouping:
        group = NotificationGrouper.create_or_update_group(notification)
    
    return notification, group
