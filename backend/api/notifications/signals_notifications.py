"""
Señales de Django para generar notificaciones automáticamente.
Este archivo detecta eventos en el sistema y crea notificaciones para los usuarios relevantes.
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from api.models import Order, Product, ProductBuyed, ProductReceived, Package, DeliverReceip, CustomUser
from api.notifications.models_notifications import Notification, NotificationType, NotificationPriority


# ============================================================================
# SEÑALES DE ÓRDENES
# ============================================================================

@receiver(post_save, sender=Order)
def notify_order_created(sender, instance, created, **kwargs):
    """
    Notificar cuando se crea una nueva orden.
    - Notifica al cliente que su orden fue creada
    - Notifica al agente asignado
    - Notifica a los admins
    """
    if created:
        # Notificar al cliente
        Notification.create_notification(
            recipient=instance.client,
            notification_type=NotificationType.ORDER_CREATED,
            title='¡Orden creada con éxito!',
            message=f'Tu orden #{instance.id} ha sido creada y está siendo procesada.',
            sender=instance.sales_manager,
            priority=NotificationPriority.NORMAL,
            related_object=instance,
            action_url=f'/orders/{instance.id}',
            metadata={'order_id': instance.id}
        )
        
        # Notificar al agente asignado
        Notification.create_notification(
            recipient=instance.sales_manager,
            notification_type=NotificationType.ORDER_ASSIGNED,
            title='Nueva orden asignada',
            message=f'Se te ha asignado la orden #{instance.id} del cliente {instance.client.full_name}.',
            priority=NotificationPriority.HIGH,
            related_object=instance,
            action_url=f'/orders/{instance.id}',
            metadata={'order_id': instance.id, 'client_id': instance.client.id}
        )
        
        # Notificar a todos los admins
        admins = CustomUser.objects.filter(role='admin')
        Notification.create_bulk_notifications(
            recipients=admins,
            notification_type=NotificationType.ORDER_CREATED,
            title='Nueva orden en el sistema',
            message=f'Nueva orden #{instance.id} creada por {instance.sales_manager.full_name}.',
            sender=instance.sales_manager,
            priority=NotificationPriority.NORMAL,
            action_url=f'/orders/{instance.id}',
            metadata={'order_id': instance.id}
        )


@receiver(pre_save, sender=Order)
def notify_order_status_changed(sender, instance, **kwargs):
    """
    Notificar cuando cambia el estado de una orden.
    Solo notifica si la orden ya existía y el estado cambió.
    """
    if instance.pk:  # Si la orden ya existe
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            
            # Verificar si cambió el estado
            if old_instance.status != instance.status:
                # Notificar al cliente
                Notification.create_notification(
                    recipient=instance.client,
                    notification_type=NotificationType.ORDER_STATUS_CHANGED,
                    title='Estado de tu orden actualizado',
                    message=f'Tu orden #{instance.id} cambió de estado: {old_instance.status} → {instance.status}',
                    sender=instance.sales_manager,
                    priority=NotificationPriority.HIGH,
                    related_object=instance,
                    action_url=f'/orders/{instance.id}',
                    metadata={
                        'order_id': instance.id,
                        'old_status': old_instance.status,
                        'new_status': instance.status
                    }
                )
                
                # Si la orden se completó, notificar también al agente
                if instance.status == 'Completado':
                    Notification.create_notification(
                        recipient=instance.sales_manager,
                        notification_type=NotificationType.ORDER_COMPLETED,
                        title='Orden completada',
                        message=f'La orden #{instance.id} ha sido completada exitosamente.',
                        priority=NotificationPriority.NORMAL,
                        related_object=instance,
                        action_url=f'/orders/{instance.id}',
                        metadata={'order_id': instance.id}
                    )
            
            # Verificar si cambió el estado de pago
            if old_instance.pay_status != instance.pay_status:
                # Notificar al cliente
                Notification.create_notification(
                    recipient=instance.client,
                    notification_type=NotificationType.PAYMENT_RECEIVED if instance.pay_status == 'Pagado' else NotificationType.PAYMENT_PENDING,
                    title='Estado de pago actualizado',
                    message=f'El estado de pago de tu orden #{instance.id} cambió a: {instance.pay_status}',
                    priority=NotificationPriority.HIGH if instance.pay_status == 'Pagado' else NotificationPriority.NORMAL,
                    related_object=instance,
                    action_url=f'/orders/{instance.id}',
                    metadata={
                        'order_id': instance.id,
                        'old_pay_status': old_instance.pay_status,
                        'new_pay_status': instance.pay_status
                    }
                )
                
                # Notificar a los contadores si el pago fue recibido
                if instance.pay_status == 'Pagado':
                    accountants = CustomUser.objects.filter(role='accountant')
                    Notification.create_bulk_notifications(
                        recipients=accountants,
                        notification_type=NotificationType.PAYMENT_RECEIVED,
                        title='Pago recibido',
                        message=f'La orden #{instance.id} ha sido pagada por {instance.client.full_name}.',
                        priority=NotificationPriority.NORMAL,
                        action_url=f'/orders/{instance.id}',
                        metadata={'order_id': instance.id, 'client_id': instance.client.id}
                    )
        except Order.DoesNotExist:
            pass


# ============================================================================
# SEÑALES DE PRODUCTOS
# ============================================================================

@receiver(post_save, sender=Product)
def notify_product_added(sender, instance, created, **kwargs):
    """
    Notificar cuando se agrega un producto a una orden.
    - Notifica al comprador que hay un nuevo producto para comprar
    """
    if created:
        # Notificar a los compradores
        buyers = CustomUser.objects.filter(role='buyer')
        Notification.create_bulk_notifications(
            recipients=buyers,
            notification_type=NotificationType.PRODUCT_ADDED,
            title='Nuevo producto pendiente de compra',
            message=f'Producto "{instance.name}" agregado a la orden #{instance.order.id}.',
            priority=NotificationPriority.NORMAL,
            action_url=f'/products/{instance.id}',
            metadata={
                'product_id': str(instance.id),
                'order_id': instance.order.id,
                'product_name': instance.name
            }
        )


@receiver(post_save, sender=ProductBuyed)
def notify_product_purchased(sender, instance, created, **kwargs):
    """
    Notificar cuando un producto es comprado.
    - Notifica al agente de la orden
    - Notifica al cliente
    - Notifica al logístico
    """
    if created:
        # Notificar al agente
        Notification.create_notification(
            recipient=instance.original_product.order.sales_manager,
            notification_type=NotificationType.PRODUCT_PURCHASED,
            title='Producto comprado',
            message=f'Se compró el producto "{instance.original_product.name}" ({instance.amount_buyed} unidades).',
            priority=NotificationPriority.NORMAL,
            related_object=instance,
            action_url=f'/products/{instance.original_product.id}',
            metadata={
                'product_id': str(instance.original_product.id),
                'order_id': instance.original_product.order.id,
                'amount_buyed': instance.amount_buyed
            }
        )
        
        # Notificar al cliente
        Notification.create_notification(
            recipient=instance.original_product.order.client,
            notification_type=NotificationType.PRODUCT_PURCHASED,
            title='Tu producto fue comprado',
            message=f'El producto "{instance.original_product.name}" de tu orden #{instance.original_product.order.id} ha sido comprado.',
            priority=NotificationPriority.NORMAL,
            action_url=f'/orders/{instance.original_product.order.id}',
            metadata={
                'product_id': str(instance.original_product.id),
                'order_id': instance.original_product.order.id
            }
        )
        
        # Notificar a los logísticos
        logisticals = CustomUser.objects.filter(role='logistical')
        Notification.create_bulk_notifications(
            recipients=logisticals,
            notification_type=NotificationType.PRODUCT_PURCHASED,
            title='Producto comprado - Preparar recepción',
            message=f'Producto "{instance.original_product.name}" comprado y en camino.',
            priority=NotificationPriority.NORMAL,
            action_url=f'/products/{instance.original_product.id}',
            metadata={
                'product_id': str(instance.original_product.id),
                'order_id': instance.original_product.order.id
            }
        )


@receiver(post_save, sender=ProductReceived)
def notify_product_received(sender, instance, created, **kwargs):
    """
    Notificar cuando un producto es recibido en el almacén.
    - Notifica al agente
    - Notifica al cliente
    - Notifica a los logísticos para preparar entrega
    """
    if created and instance.original_product:
        order = instance.original_product.order
        
        # Notificar al agente (sales_manager de la orden)
        if order and order.sales_manager:
            Notification.create_notification(
                recipient=order.sales_manager,
                notification_type=NotificationType.PRODUCT_RECEIVED,
                title='Producto recibido en almacén',
                message=f'Se recibió el producto "{instance.original_product.name}" ({instance.amount_received} unidades).',
                priority=NotificationPriority.HIGH,
                related_object=instance,
                action_url=f'/products/{instance.original_product.id}',
                metadata={
                    'product_id': str(instance.original_product.id),
                    'order_id': order.id,
                    'package_id': instance.package.id if instance.package else None
                }
            )
        
        # Notificar al cliente
        if order and order.client:
            Notification.create_notification(
                recipient=order.client,
                notification_type=NotificationType.PRODUCT_RECEIVED,
                title='¡Tu producto llegó!',
                message=f'El producto "{instance.original_product.name}" de tu orden #{order.id} fue recibido y está listo para entrega.',
                priority=NotificationPriority.HIGH,
                action_url=f'/orders/{order.id}',
                metadata={
                    'product_id': str(instance.original_product.id),
                    'order_id': order.id
                }
            )


# ============================================================================
# SEÑALES DE PAQUETES
# ============================================================================

@receiver(post_save, sender=Package)
def notify_package_status(sender, instance, created, **kwargs):
    """
    Notificar sobre el estado de los paquetes.
    """
    if created:
        # Notificar a los logísticos que hay un nuevo paquete
        logisticals = CustomUser.objects.filter(role='logistical')
        Notification.create_bulk_notifications(
            recipients=logisticals,
            notification_type=NotificationType.PACKAGE_SHIPPED,
            title='Nuevo paquete registrado',
            message=f'Paquete {instance.number_of_tracking} de {instance.agency_name} registrado en el sistema.',
            priority=NotificationPriority.NORMAL,
            action_url=f'/packages/{instance.id}',
            metadata={
                'package_id': instance.id,
                'tracking_number': instance.number_of_tracking
            }
        )


@receiver(pre_save, sender=Package)
def notify_package_status_changed(sender, instance, **kwargs):
    """
    Notificar cuando cambia el estado de un paquete.
    """
    if instance.pk:
        try:
            old_instance = Package.objects.get(pk=instance.pk)
            
            if old_instance.status_of_processing != instance.status_of_processing:
                # Obtener todos los productos en este paquete
                products_in_package = instance.package_products.all()
                
                # Notificar a los clientes de los productos en el paquete
                for product_received in products_in_package:
                    client = product_received.original_product.order.client
                    
                    if instance.status_of_processing == 'Completado':
                        notification_type = NotificationType.PACKAGE_DELIVERED
                        title = '¡Tu paquete ha llegado!'
                        message = f'El paquete con tracking {instance.number_of_tracking} ha sido entregado.'
                        priority = NotificationPriority.HIGH
                    else:
                        notification_type = NotificationType.PACKAGE_IN_TRANSIT
                        title = 'Actualización de tu paquete'
                        message = f'Tu paquete {instance.number_of_tracking} cambió a: {instance.status_of_processing}'
                        priority = NotificationPriority.NORMAL
                    
                    Notification.create_notification(
                        recipient=client,
                        notification_type=notification_type,
                        title=title,
                        message=message,
                        priority=priority,
                        related_object=instance,
                        action_url=f'/packages/{instance.id}',
                        metadata={
                            'package_id': instance.id,
                            'tracking_number': instance.number_of_tracking,
                            'status': instance.status_of_processing
                        }
                    )
        except Package.DoesNotExist:
            pass


# ============================================================================
# SEÑALES DE ENTREGAS
# ============================================================================

@receiver(post_save, sender=DeliverReceip)
def notify_delivery_created(sender, instance, created, **kwargs):
    """
    Notificar cuando se crea un recibo de entrega.
    """
    if created and instance.client:  # Solo notificar si hay un cliente asociado
        # Notificar al cliente
        Notification.create_notification(
            recipient=instance.client,
            notification_type=NotificationType.PRODUCT_DELIVERED,
            title='¡Entrega registrada!',
            message=f'Se ha registrado una entrega de {instance.weight:.2f} lb. Costo: ${instance.weight_cost:.2f}',
            priority=NotificationPriority.HIGH,
            related_object=instance,
            action_url=f'/deliveries/{instance.id}',
            metadata={
                'delivery_id': instance.id,
                'weight': instance.weight,
                'weight_cost': float(instance.weight_cost),
                'manager_profit': float(instance.manager_profit)
            }
        )
        
        # Notificar al agente asignado del cliente (si tiene)
        if instance.client.assigned_agent:
            Notification.create_notification(
                recipient=instance.client.assigned_agent,
                notification_type=NotificationType.PRODUCT_DELIVERED,
                title='Entrega completada',
                message=f'Se completó la entrega para tu cliente {instance.client.full_name}. Ganancia: ${instance.manager_profit:.2f}',
                priority=NotificationPriority.NORMAL,
                related_object=instance,
                action_url=f'/deliveries/{instance.id}',
                metadata={
                    'client_id': instance.client.id,
                    'delivery_id': instance.id,
                    'manager_profit': float(instance.manager_profit)
                }
            )


# ============================================================================
# SEÑALES DE USUARIOS
# ============================================================================

@receiver(post_save, sender=CustomUser)
def notify_user_events(sender, instance, created, **kwargs):
    """
    Notificar eventos relacionados con usuarios.
    """
    if created:
        # Notificar a los admins sobre el nuevo usuario
        admins = CustomUser.objects.filter(role='admin')
        Notification.create_bulk_notifications(
            recipients=admins,
            notification_type=NotificationType.USER_REGISTERED,
            title='Nuevo usuario registrado',
            message=f'{instance.full_name} se ha registrado como {instance.get_role_display()}.',
            priority=NotificationPriority.NORMAL,
            action_url=f'/users/{instance.id}',
            metadata={
                'user_id': instance.id,
                'role': instance.role
            }
        )
        
        # Enviar notificación de bienvenida al usuario
        Notification.create_notification(
            recipient=instance,
            notification_type=NotificationType.SYSTEM_MESSAGE,
            title='¡Bienvenido a nuestro sistema!',
            message=f'Hola {instance.name}, tu cuenta ha sido creada exitosamente. Estamos para ayudarte en lo que necesites.',
            priority=NotificationPriority.NORMAL,
            action_url='/',
            metadata={'is_welcome': True}
        )


@receiver(pre_save, sender=CustomUser)
def notify_user_verified(sender, instance, **kwargs):
    """
    Notificar cuando un usuario es verificado.
    """
    if instance.pk:
        try:
            old_instance = CustomUser.objects.get(pk=instance.pk)
            
            # Si el usuario fue verificado
            if not old_instance.is_verified and instance.is_verified:
                Notification.create_notification(
                    recipient=instance,
                    notification_type=NotificationType.USER_VERIFIED,
                    title='¡Cuenta verificada!',
                    message='Tu cuenta ha sido verificada exitosamente. Ahora puedes acceder a todas las funcionalidades.',
                    priority=NotificationPriority.HIGH,
                    action_url='/',
                    metadata={'verified_at': str(instance.updated_at)}
                )
            
            # Si cambió el rol del usuario
            if old_instance.role != instance.role:
                Notification.create_notification(
                    recipient=instance,
                    notification_type=NotificationType.USER_ROLE_CHANGED,
                    title='Tu rol ha cambiado',
                    message=f'Tu rol ha sido actualizado de {old_instance.get_role_display()} a {instance.get_role_display()}.',
                    priority=NotificationPriority.HIGH,
                    action_url='/',
                    metadata={
                        'old_role': old_instance.role,
                        'new_role': instance.role
                    }
                )
        except CustomUser.DoesNotExist:
            pass
