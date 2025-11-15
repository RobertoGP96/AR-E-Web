"""
Sistema de notificaciones en tiempo real usando Server-Sent Events (SSE).

SSE es más simple que WebSockets y suficiente para notificaciones unidireccionales.
No requiere Django Channels ni configuración compleja.
"""

from django.http import StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.core.cache import cache
import json
import time
import logging
from typing import Generator, Optional

from api.notifications.models_notifications import Notification

logger = logging.getLogger(__name__)


class NotificationSSE:
    """
    Clase para gestionar Server-Sent Events de notificaciones.
    """
    
    # Tiempo entre heartbeats (segundos)
    HEARTBEAT_INTERVAL = 30
    
    # TTL del cache (segundos)
    CACHE_TTL = 60
    
    @classmethod
    def _get_channel_key(cls, user_id: int) -> str:
        """Generar clave de canal para un usuario"""
        return f"notif_sse_channel:{user_id}"
    
    @classmethod
    def publish_notification(cls, user_id: int, notification_data: dict):
        """
        Publicar una notificación en el canal SSE del usuario.
        
        Args:
            user_id: ID del usuario destinatario
            notification_data: Datos de la notificación en formato dict
        """
        channel_key = cls._get_channel_key(user_id)
        
        # Guardar en cache con timestamp
        message = {
            'event': 'notification',
            'data': notification_data,
            'timestamp': timezone.now().isoformat()
        }
        
        # Usar una lista en cache para acumular mensajes
        messages = cache.get(channel_key, [])
        messages.append(message)
        
        # Mantener solo los últimos 50 mensajes
        if len(messages) > 50:
            messages = messages[-50:]
        
        cache.set(channel_key, messages, cls.CACHE_TTL)
        
        logger.info(f"Notificación publicada en canal SSE del usuario {user_id}")
    
    @classmethod
    def get_pending_messages(cls, user_id: int) -> list:
        """Obtener mensajes pendientes del usuario"""
        channel_key = cls._get_channel_key(user_id)
        messages = cache.get(channel_key, [])
        
        # Limpiar mensajes después de leer
        cache.delete(channel_key)
        
        return messages
    
    @classmethod
    def format_sse_message(cls, event: str, data: dict) -> str:
        """
        Formatear mensaje en formato SSE.
        
        SSE Format:
        event: event_name
        data: {"key": "value"}
        
        """
        lines = []
        
        if event:
            lines.append(f"event: {event}")
        
        if data:
            # JSON debe estar en una sola línea
            json_data = json.dumps(data, ensure_ascii=False)
            lines.append(f"data: {json_data}")
        
        # SSE requiere línea en blanco al final
        lines.append("")
        lines.append("")
        
        return "\n".join(lines)
    
    @classmethod
    def event_stream(cls, user_id: int) -> Generator[str, None, None]:
        """
        Generador de eventos SSE para un usuario.
        
        Args:
            user_id: ID del usuario
        
        Yields:
            str: Mensajes en formato SSE
        """
        logger.info(f"Iniciando stream SSE para usuario {user_id}")
        
        # Enviar mensaje de conexión
        yield cls.format_sse_message("connected", {
            "message": "Conectado al servidor de notificaciones",
            "user_id": user_id,
            "timestamp": timezone.now().isoformat()
        })
        
        last_heartbeat = time.time()
        
        try:
            while True:
                current_time = time.time()
                
                # Verificar mensajes pendientes
                messages = cls.get_pending_messages(user_id)
                
                for message in messages:
                    yield cls.format_sse_message(
                        message.get('event', 'notification'),
                        message.get('data', {})
                    )
                
                # Enviar heartbeat cada X segundos
                if current_time - last_heartbeat >= cls.HEARTBEAT_INTERVAL:
                    yield cls.format_sse_message("heartbeat", {
                        "timestamp": timezone.now().isoformat()
                    })
                    last_heartbeat = current_time
                
                # Esperar un poco antes de la próxima iteración
                time.sleep(1)
                
        except GeneratorExit:
            logger.info(f"Stream SSE cerrado para usuario {user_id}")
        except Exception as e:
            logger.error(f"Error en stream SSE para usuario {user_id}: {e}")
            yield cls.format_sse_message("error", {
                "message": "Error en la conexión",
                "error": str(e)
            })


def notification_sse_view(request):
    """
    Vista para manejar conexión SSE de notificaciones.
    
    Uso desde frontend:
        const eventSource = new EventSource('/arye_system/api_data/notifications/stream');
        
        eventSource.addEventListener('notification', (event) => {
            const data = JSON.parse(event.data);
            console.log('Nueva notificación:', data);
        });
        
        eventSource.addEventListener('heartbeat', (event) => {
            console.log('Heartbeat recibido');
        });
    """
    # Verificar autenticación
    if not request.user.is_authenticated:
        return StreamingHttpResponse(
            "event: error\ndata: {\"error\": \"No autenticado\"}\n\n",
            content_type="text/event-stream",
            status=401
        )
    
    response = StreamingHttpResponse(
        NotificationSSE.event_stream(request.user.id),
        content_type="text/event-stream"
    )
    
    # Headers necesarios para SSE
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'  # Deshabilitar buffering de Nginx
    
    return response


def send_realtime_notification(notification: Notification):
    """
    Enviar notificación en tiempo real vía SSE.
    
    Args:
        notification: Instancia de Notification a enviar
    """
    from api.notifications.serializers_notifications import NotificationSerializer
    
    # Serializar notificación
    serializer = NotificationSerializer(notification)
    
    # Publicar en canal SSE
    NotificationSSE.publish_notification(
        user_id=notification.recipient.id,
        notification_data=serializer.data
    )


def create_notification_with_realtime(
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
    send_realtime=True
):
    """
    Crear notificación y enviar en tiempo real.
    
    Args:
        (mismos que Notification.create_notification)
        send_realtime: Si es True, envía vía SSE
    
    Returns:
        Notification: La notificación creada
    """
    from api.notifications.models_notifications import Notification
    
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
    
    # Enviar en tiempo real
    if send_realtime:
        send_realtime_notification(notification)
    
    return notification


# ============================================================================
# ALTERNATIVA: WebSocket usando Django Channels (para referencia)
# ============================================================================
"""
Para implementación completa con WebSockets:

1. Instalar dependencias:
   pip install channels channels-redis

2. Configurar en settings.py:
   INSTALLED_APPS += ['channels']
   ASGI_APPLICATION = 'config.asgi.application'
   CHANNEL_LAYERS = {
       'default': {
           'BACKEND': 'channels_redis.core.RedisChannelLayer',
           'CONFIG': {
               'hosts': [('localhost', 6379)],
           },
       },
   }

3. Crear consumer:
   from channels.generic.websocket import AsyncWebsocketConsumer
   
   class NotificationConsumer(AsyncWebsocketConsumer):
       async def connect(self):
           self.user_id = self.scope['user'].id
           self.channel_name = f'notifications_{self.user_id}'
           
           await self.channel_layer.group_add(
               self.channel_name,
               self.channel_name
           )
           
           await self.accept()
       
       async def disconnect(self, close_code):
           await self.channel_layer.group_discard(
               self.channel_name,
               self.channel_name
           )
       
       async def notification_message(self, event):
           await self.send(text_data=json.dumps(event['message']))

4. Configurar routing.py:
   from django.urls import re_path
   from . import consumers
   
   websocket_urlpatterns = [
       re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
   ]

5. Uso desde frontend:
   const ws = new WebSocket('ws://localhost:8000/ws/notifications/');
   ws.onmessage = (event) => {
       const data = JSON.parse(event.data);
       console.log('Notificación:', data);
   };
"""
