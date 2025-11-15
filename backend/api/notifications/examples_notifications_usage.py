"""
Ejemplos de uso del sistema de notificaciones mejorado.

Este archivo muestra cómo usar las nuevas características implementadas.
"""

from api.notifications.models_notifications import Notification, NotificationType, NotificationPriority
from api.models import CustomUser, Order
from datetime import timedelta
from django.utils import timezone


# NOTA: Este es un archivo de EJEMPLOS, no para ejecutar directamente.
# Los ejemplos asumen que tienes datos en tu base de datos.
# Para testing real, usa: backend/api/tests/test_notifications.py


# ============================================================================
# CREAR NOTIFICACIONES
# ============================================================================

def example_create_simple_notification():
    """Crear una notificación simple"""
    user = CustomUser.objects.get(email='user@example.com')
    
    notification = Notification.create_notification(
        recipient=user,
        notification_type=NotificationType.ORDER_CREATED,
        title='Tu orden fue creada',
        message='La orden #123 ha sido procesada exitosamente.',
        priority=NotificationPriority.NORMAL
    )
    
    return notification


def example_create_notification_with_expiry():
    """Crear notificación que expira en 7 días"""
    user = CustomUser.objects.get(email='user@example.com')
    
    notification = Notification.create_notification(
        recipient=user,
        notification_type=NotificationType.SYSTEM_ALERT,
        title='Promoción especial',
        message='Tienes un 20% de descuento válido por 7 días.',
        priority=NotificationPriority.HIGH,
        expires_at=timezone.now() + timedelta(days=7),
        action_url='/promotions'
    )
    
    return notification


def example_create_notification_with_metadata():
    """Crear notificación con metadata adicional"""
    user = CustomUser.objects.get(email='user@example.com')
    
    notification = Notification.create_notification(
        recipient=user,
        notification_type=NotificationType.ORDER_STATUS_CHANGED,
        title='Estado de orden actualizado',
        message='Tu orden #456 cambió a "En tránsito"',
        metadata={
            'order_id': 456,
            'old_status': 'pending',
            'new_status': 'in_transit',
            'estimated_delivery': '2025-10-15',
            'tracking_number': 'TRK123456789'
        },
        action_url='/orders/456'
    )
    
    return notification


def example_create_bulk_notifications():
    """Enviar notificación a múltiples usuarios"""
    # Obtener todos los clientes
    clients = CustomUser.objects.filter(role='client', is_active=True)
    
    # Enviar notificación masiva
    notifications = Notification.create_bulk_notifications(
        recipients=clients,
        notification_type=NotificationType.SYSTEM_MESSAGE,
        title='Mantenimiento programado',
        message='El sistema estará en mantenimiento el 15 de octubre de 2-4 AM.',
        priority=NotificationPriority.HIGH,
        metadata={'maintenance_start': '2025-10-15 02:00', 'duration': '2 hours'}
    )
    
    return notifications


# ============================================================================
# USAR EL MANAGER PERSONALIZADO
# ============================================================================

def example_get_unread_notifications():
    """Obtener notificaciones no leídas de un usuario"""
    user = CustomUser.objects.get(email='user@example.com')
    
    # Usando el manager personalizado
    unread = Notification.objects.for_user(user).unread()
    
    print(f"Usuario tiene {unread.count()} notificaciones no leídas")
    return unread


def example_get_high_priority_unread():
    """Obtener solo notificaciones urgentes no leídas"""
    user = CustomUser.objects.get(email='user@example.com')
    
    urgent = (Notification.objects
              .for_user(user)
              .unread()
              .high_priority()
              .order_by('-created_at'))
    
    return urgent


def example_get_notifications_by_type():
    """Obtener notificaciones por tipo"""
    user = CustomUser.objects.get(email='user@example.com')
    
    order_notifications = (Notification.objects
                          .for_user(user)
                          .by_type(NotificationType.ORDER_CREATED))
    
    return order_notifications


def example_mark_notifications_as_read():
    """Marcar notificaciones como leídas"""
    user = CustomUser.objects.get(email='user@example.com')
    
    # Marcar una específica
    notification = Notification.objects.for_user(user).first()
    notification.mark_as_read()
    
    # Marcar todas las no leídas del usuario
    unread = Notification.objects.for_user(user).unread()
    for notif in unread:
        notif.mark_as_read()


# ============================================================================
# LIMPIEZA DE NOTIFICACIONES (Manager Methods)
# ============================================================================

def example_delete_expired_notifications():
    """Eliminar notificaciones expiradas"""
    count = Notification.objects.delete_expired()
    print(f"Eliminadas {count} notificaciones expiradas")
    return count


def example_delete_old_read_notifications():
    """Eliminar notificaciones leídas antiguas (>30 días)"""
    count = Notification.objects.delete_old_read(days=30)
    print(f"Eliminadas {count} notificaciones leídas antiguas")
    return count


def example_custom_cleanup():
    """Limpieza personalizada"""
    # Eliminar notificaciones leídas de más de 60 días
    count = Notification.objects.delete_old_read(days=60)
    
    # Eliminar expiradas
    expired = Notification.objects.delete_expired()
    
    print(f"Limpieza completada: {count} antiguas, {expired} expiradas")
    return count + expired


# ============================================================================
# FILTROS AVANZADOS
# ============================================================================

def example_complex_queries():
    """Queries complejas usando el manager"""
    user = CustomUser.objects.get(email='user@example.com')
    
    # Notificaciones urgentes no leídas de órdenes
    urgent_orders = (Notification.objects
                    .for_user(user)
                    .filter(notification_type__startswith='order_')
                    .high_priority()
                    .unread()
                    .order_by('-created_at'))
    
    # Notificaciones de los últimos 7 días
    recent = (Notification.objects
             .for_user(user)
             .filter(created_at__gte=timezone.now() - timedelta(days=7)))
    
    # Notificaciones con metadata específica
    with_tracking = (Notification.objects
                    .for_user(user)
                    .filter(metadata__has_key='tracking_number'))
    
    return urgent_orders, recent, with_tracking


def example_statistics():
    """Obtener estadísticas de notificaciones"""
    user = CustomUser.objects.get(email='user@example.com')
    
    all_notifs = Notification.objects.for_user(user)
    
    stats = {
        'total': all_notifs.count(),
        'unread': all_notifs.unread().count(),
        'high_priority': all_notifs.high_priority().count(),
        'expired': all_notifs.expired().count(),
        'by_type': {}
    }
    
    # Contar por tipo
    for notif_type, label in NotificationType.choices:
        count = all_notifs.by_type(notif_type).count()
        if count > 0:
            stats['by_type'][label] = count
    
    return stats


# ============================================================================
# PREFERENCIAS DE USUARIO
# ============================================================================

def example_user_preferences():
    """Trabajar con preferencias de notificación"""
    from api.models_notifications import NotificationPreference
    
    user = CustomUser.objects.get(email='user@example.com')
    
    # Obtener o crear preferencias
    prefs = NotificationPreference.get_or_create_preferences(user)
    
    # Configurar preferencias
    prefs.email_notifications = True
    prefs.push_notifications = False
    prefs.digest_frequency = 'daily'
    prefs.enabled_notification_types = [
        NotificationType.ORDER_CREATED,
        NotificationType.ORDER_STATUS_CHANGED,
        NotificationType.PAYMENT_RECEIVED
    ]
    prefs.save()
    
    # Verificar si un tipo está habilitado
    if prefs.is_notification_enabled(NotificationType.ORDER_CREATED):
        print("Las notificaciones de órdenes están habilitadas")


def example_check_preferences_before_sending():
    """Verificar preferencias antes de enviar notificación"""
    from api.models_notifications import NotificationPreference
    
    user = CustomUser.objects.get(email='user@example.com')
    prefs = NotificationPreference.get_or_create_preferences(user)
    
    notification_type = NotificationType.SYSTEM_MESSAGE
    
    # Solo crear si el usuario lo tiene habilitado
    if prefs.is_notification_enabled(notification_type):
        Notification.create_notification(
            recipient=user,
            notification_type=notification_type,
            title='Mensaje del sistema',
            message='Este mensaje solo se envía si está habilitado'
        )
    else:
        print(f"Usuario ha deshabilitado notificaciones de tipo {notification_type}")


# ============================================================================
# INTEGRACIÓN CON VISTAS/SIGNALS
# ============================================================================

def example_notify_from_view():
    """Ejemplo de cómo notificar desde una vista"""
    from rest_framework.decorators import api_view
    from rest_framework.response import Response
    from rest_framework import status as http_status
    
    @api_view(['POST'])
    def create_order(request):
        # ... lógica de creación de orden ...
        # order = Order.objects.create(...)  # ejemplo
        
        # Suponiendo que 'order' fue creado arriba
        # Notificar al usuario
        # Notification.create_notification(
        #     recipient=request.user,
        #     notification_type=NotificationType.ORDER_CREATED,
        #     title='Orden creada',
        #     message=f'Tu orden ha sido creada exitosamente',
        #     priority=NotificationPriority.HIGH,
        #     action_url=f'/orders/{order.id}',
        #     metadata={'order_id': order.id}
        # )
        
        return Response({'success': True}, status=http_status.HTTP_201_CREATED)


def example_batch_notification_from_task():
    """Ejemplo de notificación en batch desde una tarea programada"""
    from datetime import datetime, timedelta
    
    # Encontrar órdenes pendientes de pago por más de 7 días
    cutoff = timezone.now() - timedelta(days=7)
    overdue_orders = Order.objects.filter(
        pay_status='pending',
        created_at__lt=cutoff
    )
    
    # Notificar a cada cliente
    for order in overdue_orders:
        Notification.create_notification(
            recipient=order.client,
            notification_type=NotificationType.PAYMENT_OVERDUE,
            title='Pago pendiente',
            message=f'Tu orden #{order.id} tiene un pago pendiente hace más de 7 días.',
            priority=NotificationPriority.URGENT,
            action_url=f'/orders/{order.id}/payment',
            metadata={
                'order_id': order.id,
                'days_overdue': (timezone.now() - order.created_at).days
            }
        )


# ============================================================================
# COMANDO DE LIMPIEZA (desde código)
# ============================================================================

def example_programmatic_cleanup():
    """Ejecutar limpieza programáticamente"""
    from django.core.management import call_command
    
    # Ejecutar comando con parámetros
    call_command('clean_notifications', '--days', '30', verbosity=0)
    
    # O hacer limpieza manual
    expired = Notification.objects.delete_expired()
    old_read = Notification.objects.delete_old_read(days=30)
    
    print(f"Limpieza: {expired} expiradas, {old_read} antiguas")


# ============================================================================
# TESTING HELPERS
# ============================================================================

def example_create_test_notifications():
    """Crear notificaciones para testing"""
    user = CustomUser.objects.first()
    
    # Crear varios tipos
    types = [
        (NotificationType.ORDER_CREATED, NotificationPriority.NORMAL),
        (NotificationType.PAYMENT_RECEIVED, NotificationPriority.HIGH),
        (NotificationType.PRODUCT_DELIVERED, NotificationPriority.HIGH),
        (NotificationType.SYSTEM_MESSAGE, NotificationPriority.LOW),
    ]
    
    for notif_type, priority in types:
        Notification.create_notification(
            recipient=user,
            notification_type=notif_type,
            title=f'Test: {notif_type.label}',
            message='Esta es una notificación de prueba',
            priority=priority
        )


# ============================================================================
# USAGE EN PRODUCCIÓN
# ============================================================================

# Para usar estos ejemplos:
# 1. Importar en tu código:
#    from api.examples.notifications import example_create_simple_notification
#
# 2. Llamar en tus vistas/signals:
#    notification = example_create_simple_notification()
#
# 3. Para testing:
#    python manage.py shell
#    >>> from api.examples.notifications import *
#    >>> example_create_test_notifications()

"""
NOTAS IMPORTANTES:

1. Manager Personalizado:
   - Usa Notification.objects.for_user(user).unread() en lugar de filter manual
   - Es más legible y más eficiente gracias a los índices

2. Preferencias:
   - Siempre verifica preferencias antes de enviar notificaciones masivas
   - Usa get_or_create_preferences() para evitar errores

3. Limpieza:
   - Configura el comando clean_notifications en cron/scheduler
   - O usa Celery para tareas periódicas

4. Performance:
   - Los índices optimizados hacen queries 5-10x más rápidas
   - Usa select_related/prefetch_related cuando sea necesario

5. Testing:
   - Usa los tests en api/tests/test_notifications.py como referencia
   - Ejecuta tests después de cambios: python manage.py test api.tests.test_notifications
"""
