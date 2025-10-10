"""
Servicio de email para notificaciones.

Gestiona el envío de notificaciones por correo electrónico con templates HTML.
"""

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from typing import Optional, List, Dict, Any
import logging

from api.models_notifications import Notification, NotificationPreference
from api.models import CustomUser

logger = logging.getLogger(__name__)


class NotificationEmailService:
    """
    Servicio para enviar notificaciones por email.
    """
    
    # Configuración por defecto
    DEFAULT_FROM_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@ar-e-system.com')
    BASE_URL = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    APP_NAME = getattr(settings, 'APP_NAME', 'AR-E System')
    
    @classmethod
    def should_send_email(cls, recipient: CustomUser, notification_type: str) -> bool:
        """
        Verificar si se debe enviar email según las preferencias del usuario.
        
        Args:
            recipient: Usuario destinatario
            notification_type: Tipo de notificación
        
        Returns:
            bool: True si debe enviar email
        """
        try:
            prefs = NotificationPreference.get_or_create_preferences(recipient)
            
            # Verificar si email está habilitado
            if not prefs.email_notifications:
                return False
            
            # Verificar si el tipo específico está habilitado
            if not prefs.is_notification_enabled(notification_type):
                return False
            
            # Verificar frecuencia (immediate envía siempre, otros acumulan)
            if prefs.digest_frequency != 'immediate':
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error verificando preferencias de email: {e}")
            return True  # En caso de error, enviar por defecto
    
    @classmethod
    def send_notification_email(
        cls,
        recipient: CustomUser,
        title: str,
        message: str,
        notification_type: str,
        priority: str = 'normal',
        action_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        sender: Optional[CustomUser] = None
    ) -> bool:
        """
        Enviar email de notificación.
        
        Args:
            recipient: Usuario destinatario
            title: Título de la notificación
            message: Mensaje de la notificación
            notification_type: Tipo de notificación
            priority: Prioridad (urgent, high, normal, low)
            action_url: URL de acción
            metadata: Datos adicionales
            sender: Usuario que genera la notificación
        
        Returns:
            bool: True si se envió exitosamente
        """
        # Verificar si debe enviar
        if not cls.should_send_email(recipient, notification_type):
            logger.info(f"Email no enviado a {recipient.email} por preferencias de usuario")
            return False
        
        try:
            # Verificar que el usuario tenga email
            if not recipient.email:
                logger.warning(f"Usuario {recipient.id} no tiene email configurado")
                return False
            
            # Preparar contexto para templates
            context = {
                'recipient_name': recipient.full_name,
                'title': title,
                'message': message,
                'priority': priority,
                'action_url': action_url,
                'metadata': metadata or {},
                'sender_name': sender.full_name if sender else None,
                'base_url': cls.BASE_URL,
                'app_name': cls.APP_NAME,
                'current_year': timezone.now().year,
            }
            
            # Renderizar templates
            html_content = render_to_string('emails/notification_email.html', context)
            text_content = render_to_string('emails/notification_email.txt', context)
            
            # Definir asunto según prioridad
            subject_prefix = {
                'urgent': '[URGENTE] ',
                'high': '[IMPORTANTE] ',
                'normal': '',
                'low': ''
            }.get(priority.lower(), '')
            
            subject = f"{subject_prefix}{title}"
            
            # Crear email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=cls.DEFAULT_FROM_EMAIL,
                to=[recipient.email]
            )
            
            # Agregar versión HTML
            email.attach_alternative(html_content, "text/html")
            
            # Enviar
            email.send(fail_silently=False)
            
            logger.info(f"Email enviado exitosamente a {recipient.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando email a {recipient.email}: {e}")
            return False
    
    @classmethod
    def send_notification_email_from_object(cls, notification: Notification) -> bool:
        """
        Enviar email desde un objeto Notification.
        
        Args:
            notification: Instancia de Notification
        
        Returns:
            bool: True si se envió exitosamente
        """
        return cls.send_notification_email(
            recipient=notification.recipient,
            title=notification.title,
            message=notification.message,
            notification_type=notification.notification_type,
            priority=notification.priority,
            action_url=notification.action_url,
            metadata=notification.metadata,
            sender=notification.sender
        )
    
    @classmethod
    def send_bulk_notification_emails(
        cls,
        recipients: List[CustomUser],
        title: str,
        message: str,
        notification_type: str,
        priority: str = 'normal',
        action_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Enviar emails a múltiples usuarios.
        
        Returns:
            dict: {
                'sent': [lista de emails enviados],
                'failed': [lista de emails fallidos],
                'skipped': [lista de emails omitidos por preferencias]
            }
        """
        sent = []
        failed = []
        skipped = []
        
        for recipient in recipients:
            # Verificar preferencias primero
            if not cls.should_send_email(recipient, notification_type):
                skipped.append(recipient.email)
                continue
            
            # Intentar enviar
            success = cls.send_notification_email(
                recipient=recipient,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                action_url=action_url,
                metadata=metadata
            )
            
            if success:
                sent.append(recipient.email)
            else:
                failed.append(recipient.email)
        
        return {
            'sent': sent,
            'failed': failed,
            'skipped': skipped,
            'total_sent': len(sent),
            'total_failed': len(failed),
            'total_skipped': len(skipped)
        }
    
    @classmethod
    def send_digest_email(
        cls,
        recipient: CustomUser,
        notifications: List[Notification]
    ) -> bool:
        """
        Enviar email resumen con múltiples notificaciones.
        
        Args:
            recipient: Usuario destinatario
            notifications: Lista de notificaciones a incluir
        
        Returns:
            bool: True si se envió exitosamente
        """
        if not notifications:
            return False
        
        try:
            # Agrupar notificaciones por tipo
            by_type = {}
            for notif in notifications:
                notif_type = notif.get_notification_type_display()
                if notif_type not in by_type:
                    by_type[notif_type] = []
                by_type[notif_type].append(notif)
            
            # Context para el digest
            context = {
                'recipient_name': recipient.full_name,
                'notifications': notifications,
                'notifications_by_type': by_type,
                'total_count': len(notifications),
                'unread_count': sum(1 for n in notifications if not n.is_read),
                'base_url': cls.BASE_URL,
                'app_name': cls.APP_NAME,
                'current_year': timezone.now().year,
            }
            
            # Renderizar template de digest (crear uno específico o usar el normal)
            html_content = render_to_string('emails/notification_digest.html', context)
            text_content = render_to_string('emails/notification_digest.txt', context)
            
            subject = f"Resumen de notificaciones - {len(notifications)} nuevas"
            
            # Crear y enviar email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=cls.DEFAULT_FROM_EMAIL,
                to=[recipient.email]
            )
            
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            
            logger.info(f"Email digest enviado a {recipient.email} con {len(notifications)} notificaciones")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando digest a {recipient.email}: {e}")
            return False


def send_notification_with_email(
    recipient,
    notification_type,
    title,
    message,
    sender=None,
    priority='normal',
    related_object=None,
    action_url=None,
    metadata=None,
    expires_at=None,
    send_email=True
):
    """
    Wrapper para crear notificación y enviar email automáticamente.
    
    Args:
        (mismos que Notification.create_notification)
        send_email: Si es True, intenta enviar email
    
    Returns:
        tuple: (notification, email_sent)
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
    
    # Enviar email si está habilitado
    email_sent = False
    if send_email:
        email_sent = NotificationEmailService.send_notification_email_from_object(notification)
    
    return notification, email_sent
