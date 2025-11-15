"""
Sistema de throttling para prevenir spam de notificaciones.

Este módulo implementa límites de tasa para la creación de notificaciones,
evitando que se generen demasiadas notificaciones en poco tiempo.
"""

from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from typing import Optional, Tuple
import hashlib

from api.notifications.models_notifications import NotificationType, NotificationPriority


class NotificationThrottle:
    """
    Clase para gestionar throttling de notificaciones.
    
    Límites por defecto:
    - Por usuario general: 100 notificaciones/hora
    - Por tipo de notificación: 10 del mismo tipo/hora
    - Notificaciones idénticas: 1/5 minutos
    - Urgentes: 20/hora
    """
    
    # Límites por defecto
    DEFAULT_USER_LIMIT = 100  # Notificaciones por hora
    DEFAULT_TYPE_LIMIT = 10   # Del mismo tipo por hora
    DEFAULT_DUPLICATE_WINDOW = 300  # 5 minutos en segundos
    URGENT_LIMIT = 20  # Notificaciones urgentes por hora
    
    # Duración de cache (1 hora)
    CACHE_TTL = 3600
    
    @classmethod
    def _get_cache_key(cls, key_type: str, user_id: int, **kwargs) -> str:
        """Generar clave de cache única"""
        base = f"notif_throttle:{key_type}:{user_id}"
        
        if kwargs:
            # Agregar parámetros adicionales a la clave
            params = ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
            base = f"{base}:{params}"
        
        return base
    
    @classmethod
    def _get_duplicate_hash(cls, recipient_id: int, notification_type: str, 
                           title: str, message: str) -> str:
        """Generar hash único para detectar duplicados"""
        content = f"{recipient_id}:{notification_type}:{title}:{message}"
        return hashlib.md5(content.encode()).hexdigest()
    
    @classmethod
    def can_send_notification(
        cls,
        recipient_id: int,
        notification_type: str,
        priority: str = NotificationPriority.NORMAL,
        title: str = "",
        message: str = "",
        bypass_throttle: bool = False
    ) -> Tuple[bool, Optional[str]]:
        """
        Verificar si se puede enviar una notificación.
        
        Args:
            recipient_id: ID del usuario receptor
            notification_type: Tipo de notificación
            priority: Prioridad de la notificación
            title: Título (para detectar duplicados)
            message: Mensaje (para detectar duplicados)
            bypass_throttle: Si es True, omite el throttling
        
        Returns:
            Tuple[bool, Optional[str]]: (puede_enviar, razón_si_no)
        """
        if bypass_throttle:
            return True, None
        
        # 1. Verificar límite general del usuario
        user_key = cls._get_cache_key("user", recipient_id)
        user_count = cache.get(user_key, 0)
        
        if user_count >= cls.DEFAULT_USER_LIMIT:
            return False, f"Límite de {cls.DEFAULT_USER_LIMIT} notificaciones por hora alcanzado"
        
        # 2. Verificar límite por tipo de notificación
        type_key = cls._get_cache_key("type", recipient_id, type=notification_type)
        type_count = cache.get(type_key, 0)
        
        if type_count >= cls.DEFAULT_TYPE_LIMIT:
            return False, f"Límite de {cls.DEFAULT_TYPE_LIMIT} notificaciones del tipo '{notification_type}' por hora alcanzado"
        
        # 3. Verificar límite de urgentes si aplica
        if priority in [NotificationPriority.HIGH, NotificationPriority.URGENT]:
            urgent_key = cls._get_cache_key("urgent", recipient_id)
            urgent_count = cache.get(urgent_key, 0)
            
            if urgent_count >= cls.URGENT_LIMIT:
                return False, f"Límite de {cls.URGENT_LIMIT} notificaciones urgentes por hora alcanzado"
        
        # 4. Verificar duplicados recientes
        if title and message:
            duplicate_hash = cls._get_duplicate_hash(
                recipient_id, notification_type, title, message
            )
            duplicate_key = f"notif_dup:{duplicate_hash}"
            
            if cache.get(duplicate_key):
                return False, "Notificación duplicada enviada recientemente (últimos 5 minutos)"
        
        return True, None
    
    @classmethod
    def record_notification(
        cls,
        recipient_id: int,
        notification_type: str,
        priority: str = NotificationPriority.NORMAL,
        title: str = "",
        message: str = ""
    ):
        """
        Registrar que se envió una notificación (incrementar contadores).
        
        Args:
            recipient_id: ID del usuario receptor
            notification_type: Tipo de notificación
            priority: Prioridad
            title: Título
            message: Mensaje
        """
        # Incrementar contador general del usuario
        user_key = cls._get_cache_key("user", recipient_id)
        user_count = cache.get(user_key, 0)
        cache.set(user_key, user_count + 1, cls.CACHE_TTL)
        
        # Incrementar contador por tipo
        type_key = cls._get_cache_key("type", recipient_id, type=notification_type)
        type_count = cache.get(type_key, 0)
        cache.set(type_key, type_count + 1, cls.CACHE_TTL)
        
        # Incrementar contador de urgentes si aplica
        if priority in [NotificationPriority.HIGH, NotificationPriority.URGENT]:
            urgent_key = cls._get_cache_key("urgent", recipient_id)
            urgent_count = cache.get(urgent_key, 0)
            cache.set(urgent_key, urgent_count + 1, cls.CACHE_TTL)
        
        # Marcar como duplicado por 5 minutos
        if title and message:
            duplicate_hash = cls._get_duplicate_hash(
                recipient_id, notification_type, title, message
            )
            duplicate_key = f"notif_dup:{duplicate_hash}"
            cache.set(duplicate_key, True, cls.DEFAULT_DUPLICATE_WINDOW)
    
    @classmethod
    def get_user_stats(cls, recipient_id: int) -> dict:
        """
        Obtener estadísticas de throttling para un usuario.
        
        Args:
            recipient_id: ID del usuario
        
        Returns:
            dict: Estadísticas de uso
        """
        user_key = cls._get_cache_key("user", recipient_id)
        urgent_key = cls._get_cache_key("urgent", recipient_id)
        
        user_count = cache.get(user_key, 0)
        urgent_count = cache.get(urgent_key, 0)
        
        # Calcular contadores por tipo
        type_counts = {}
        for notif_type, label in NotificationType.choices:
            type_key = cls._get_cache_key("type", recipient_id, type=notif_type)
            count = cache.get(type_key, 0)
            if count > 0:
                type_counts[notif_type] = count
        
        return {
            'user_id': recipient_id,
            'total_sent_last_hour': user_count,
            'remaining_this_hour': max(0, cls.DEFAULT_USER_LIMIT - user_count),
            'urgent_sent_last_hour': urgent_count,
            'urgent_remaining': max(0, cls.URGENT_LIMIT - urgent_count),
            'by_type': type_counts,
            'limits': {
                'user_limit': cls.DEFAULT_USER_LIMIT,
                'type_limit': cls.DEFAULT_TYPE_LIMIT,
                'urgent_limit': cls.URGENT_LIMIT,
                'duplicate_window_seconds': cls.DEFAULT_DUPLICATE_WINDOW,
            }
        }
    
    @classmethod
    def reset_user_throttle(cls, recipient_id: int):
        """
        Resetear throttling para un usuario (útil para admins).
        
        Args:
            recipient_id: ID del usuario
        """
        # Limpiar contador general
        user_key = cls._get_cache_key("user", recipient_id)
        cache.delete(user_key)
        
        # Limpiar contador urgente
        urgent_key = cls._get_cache_key("urgent", recipient_id)
        cache.delete(urgent_key)
        
        # Limpiar contadores por tipo
        for notif_type, _ in NotificationType.choices:
            type_key = cls._get_cache_key("type", recipient_id, type=notif_type)
            cache.delete(type_key)
    
    @classmethod
    def configure_limits(
        cls,
        user_limit: Optional[int] = None,
        type_limit: Optional[int] = None,
        urgent_limit: Optional[int] = None,
        duplicate_window: Optional[int] = None
    ):
        """
        Configurar límites personalizados (en runtime).
        
        Args:
            user_limit: Límite general por usuario/hora
            type_limit: Límite por tipo/hora
            urgent_limit: Límite de urgentes/hora
            duplicate_window: Ventana para duplicados (segundos)
        """
        if user_limit is not None:
            cls.DEFAULT_USER_LIMIT = user_limit
        if type_limit is not None:
            cls.DEFAULT_TYPE_LIMIT = type_limit
        if urgent_limit is not None:
            cls.URGENT_LIMIT = urgent_limit
        if duplicate_window is not None:
            cls.DEFAULT_DUPLICATE_WINDOW = duplicate_window


def create_throttled_notification(recipient, notification_type, title, message, 
                                  sender=None, priority=NotificationPriority.NORMAL,
                                  related_object=None, action_url=None, 
                                  metadata=None, expires_at=None,
                                  bypass_throttle=False):
    """
    Wrapper de Notification.create_notification con throttling integrado.
    
    Args:
        (mismos que Notification.create_notification)
        bypass_throttle: Si es True, omite verificación de throttling
    
    Returns:
        Tuple[Optional[Notification], bool, Optional[str]]: 
            (notificación_creada, fue_throttled, razón)
    
    Example:
        notification, throttled, reason = create_throttled_notification(
            recipient=user,
            notification_type=NotificationType.ORDER_CREATED,
            title="Orden creada",
            message="Tu orden fue creada",
            priority=NotificationPriority.HIGH
        )
        
        if throttled:
            print(f"Notificación bloqueada: {reason}")
        else:
            print(f"Notificación enviada: {notification.id}")
    """
    from api.models_notifications import Notification
    
    # Verificar si puede enviar
    can_send, reason = NotificationThrottle.can_send_notification(
        recipient_id=recipient.id,
        notification_type=notification_type,
        priority=priority,
        title=title,
        message=message,
        bypass_throttle=bypass_throttle
    )
    
    if not can_send:
        return None, True, reason
    
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
    
    # Registrar envío
    NotificationThrottle.record_notification(
        recipient_id=recipient.id,
        notification_type=notification_type,
        priority=priority,
        title=title,
        message=message
    )
    
    return notification, False, None


def create_bulk_throttled_notifications(recipients, notification_type, title, message,
                                       sender=None, priority=NotificationPriority.NORMAL,
                                       action_url=None, metadata=None,
                                       bypass_throttle=False):
    """
    Wrapper de create_bulk_notifications con throttling.
    
    Returns:
        dict: {
            'created': [lista de notificaciones creadas],
            'throttled': [lista de user_ids que fueron throttled],
            'reasons': {user_id: reason}
        }
    """
    from api.models_notifications import Notification
    
    created = []
    throttled = []
    reasons = {}
    
    for recipient in recipients:
        can_send, reason = NotificationThrottle.can_send_notification(
            recipient_id=recipient.id,
            notification_type=notification_type,
            priority=priority,
            title=title,
            message=message,
            bypass_throttle=bypass_throttle
        )
        
        if can_send:
            notification = Notification.create_notification(
                recipient=recipient,
                notification_type=notification_type,
                title=title,
                message=message,
                sender=sender,
                priority=priority,
                action_url=action_url,
                metadata=metadata or {}
            )
            created.append(notification)
            
            NotificationThrottle.record_notification(
                recipient_id=recipient.id,
                notification_type=notification_type,
                priority=priority,
                title=title,
                message=message
            )
        else:
            throttled.append(recipient.id)
            reasons[recipient.id] = reason
    
    return {
        'created': created,
        'throttled': throttled,
        'reasons': reasons,
        'total_sent': len(created),
        'total_throttled': len(throttled)
    }
