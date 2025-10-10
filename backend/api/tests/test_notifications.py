"""
Tests completos para el sistema de notificaciones.

Ejecutar con:
    python manage.py test api.tests.test_notifications
    python manage.py test api.tests.test_notifications.NotificationModelTest
    python manage.py test api.tests.test_notifications.NotificationViewSetTest.test_list_notifications
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.contenttypes.models import ContentType

from api.models import CustomUser, Order
from api.models_notifications import (
    Notification,
    NotificationPreference,
    NotificationType,
    NotificationPriority
)


class NotificationModelTest(TestCase):
    """Tests para el modelo Notification"""
    
    def setUp(self):
        """Configuración inicial para cada test"""
        self.user1 = CustomUser.objects.create_user(
            email='user1@test.com',
            password='testpass123',
            name='User',
            last_name='One',
            phone='+1234567890',
            role='client'
        )
        
        self.user2 = CustomUser.objects.create_user(
            email='user2@test.com',
            password='testpass123',
            name='User',
            last_name='Two',
            phone='+0987654321',
            role='sales_manager'
        )
    
    def test_create_notification(self):
        """Test crear notificación básica"""
        notification = Notification.objects.create(
            recipient=self.user1,
            sender=self.user2,
            notification_type=NotificationType.ORDER_CREATED,
            title='Test Notification',
            message='This is a test message'
        )
        
        self.assertEqual(notification.recipient, self.user1)
        self.assertEqual(notification.sender, self.user2)
        self.assertEqual(notification.notification_type, NotificationType.ORDER_CREATED)
        self.assertFalse(notification.is_read)
        self.assertIsNone(notification.read_at)
    
    def test_create_notification_helper(self):
        """Test método helper create_notification"""
        notification = Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Helper Test',
            message='Testing helper method',
            sender=self.user2,
            priority=NotificationPriority.HIGH
        )
        
        self.assertIsNotNone(notification.id)
        self.assertEqual(notification.priority, NotificationPriority.HIGH)
        self.assertEqual(notification.title, 'Helper Test')
    
    def test_mark_as_read(self):
        """Test marcar notificación como leída"""
        notification = Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Test',
            message='Test'
        )
        
        self.assertFalse(notification.is_read)
        
        notification.mark_as_read()
        notification.refresh_from_db()
        
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)
    
    def test_mark_as_unread(self):
        """Test marcar notificación como no leída"""
        notification = Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Test',
            message='Test'
        )
        
        notification.mark_as_read()
        self.assertTrue(notification.is_read)
        
        notification.mark_as_unread()
        notification.refresh_from_db()
        
        self.assertFalse(notification.is_read)
        self.assertIsNone(notification.read_at)
    
    def test_is_expired(self):
        """Test verificación de notificación expirada"""
        past_date = timezone.now() - timedelta(days=1)
        future_date = timezone.now() + timedelta(days=1)
        
        expired_notification = Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Expired',
            message='This should be expired',
            expires_at=past_date
        )
        
        active_notification = Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Active',
            message='This should be active',
            expires_at=future_date
        )
        
        self.assertTrue(expired_notification.is_expired)
        self.assertFalse(active_notification.is_expired)
    
    def test_create_bulk_notifications(self):
        """Test crear múltiples notificaciones a la vez"""
        user3 = CustomUser.objects.create_user(
            email='user3@test.com',
            password='testpass123',
            name='User',
            last_name='Three',
            phone='+1111111111',
            role='client'
        )
        
        recipients = [self.user1, self.user2, user3]
        
        notifications = Notification.create_bulk_notifications(
            recipients=recipients,
            notification_type=NotificationType.SYSTEM_MESSAGE,
            title='Bulk Test',
            message='Bulk notification test'
        )
        
        self.assertEqual(len(notifications), 3)
        self.assertEqual(Notification.objects.filter(title='Bulk Test').count(), 3)
    
    def test_notification_with_related_object(self):
        """Test notificación con objeto relacionado"""
        order = Order.objects.create(
            client=self.user1,
            sales_manager=self.user2,
            address='Test Address',
            status='pending'
        )
        
        notification = Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Order Created',
            message='Your order has been created',
            related_object=order
        )
        
        self.assertEqual(notification.related_object, order)
        self.assertEqual(notification.content_type, ContentType.objects.get_for_model(Order))
        self.assertEqual(notification.object_id, order.id)
    
    def test_notification_manager_unread(self):
        """Test manager method unread()"""
        Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Unread 1',
            message='Test'
        )
        
        read_notif = Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Read',
            message='Test'
        )
        read_notif.mark_as_read()
        
        Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Unread 2',
            message='Test'
        )
        
        unread_count = Notification.objects.for_user(self.user1).unread().count()
        self.assertEqual(unread_count, 2)
    
    def test_notification_manager_delete_expired(self):
        """Test eliminar notificaciones expiradas"""
        past_date = timezone.now() - timedelta(days=1)
        
        Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Expired',
            message='Test',
            expires_at=past_date
        )
        
        Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Active',
            message='Test'
        )
        
        deleted = Notification.objects.delete_expired()
        self.assertEqual(deleted, 1)
        self.assertEqual(Notification.objects.count(), 1)
    
    def test_notification_manager_delete_old_read(self):
        """Test eliminar notificaciones leídas antiguas"""
        old_date = timezone.now() - timedelta(days=40)
        
        old_notification = Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Old',
            message='Test'
        )
        old_notification.created_at = old_date
        old_notification.mark_as_read()
        old_notification.save()
        
        recent_notification = Notification.create_notification(
            recipient=self.user1,
            notification_type=NotificationType.ORDER_CREATED,
            title='Recent',
            message='Test'
        )
        recent_notification.mark_as_read()
        
        deleted = Notification.objects.delete_old_read(days=30)
        self.assertEqual(deleted, 1)
        self.assertEqual(Notification.objects.count(), 1)


class NotificationPreferenceTest(TestCase):
    """Tests para NotificationPreference"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email='user@test.com',
            password='testpass123',
            name='Test',
            last_name='User',
            phone='+1234567890',
            role='client'
        )
    
    def test_get_or_create_preferences(self):
        """Test obtener o crear preferencias"""
        preferences = NotificationPreference.get_or_create_preferences(self.user)
        
        self.assertIsNotNone(preferences)
        self.assertEqual(preferences.user, self.user)
        self.assertTrue(preferences.email_notifications)
        self.assertTrue(preferences.push_notifications)
    
    def test_is_notification_enabled(self):
        """Test verificar si tipo de notificación está habilitado"""
        preferences = NotificationPreference.get_or_create_preferences(self.user)
        
        # Por defecto, todas están habilitadas (lista vacía)
        self.assertTrue(preferences.is_notification_enabled(NotificationType.ORDER_CREATED))
        
        # Deshabilitar un tipo
        preferences.enabled_notification_types = [NotificationType.ORDER_CREATED]
        preferences.save()
        
        self.assertTrue(preferences.is_notification_enabled(NotificationType.ORDER_CREATED))
        self.assertFalse(preferences.is_notification_enabled(NotificationType.PAYMENT_RECEIVED))


class NotificationViewSetTest(APITestCase):
    """Tests para las vistas de notificaciones"""
    
    def setUp(self):
        """Configuración inicial"""
        self.client = APIClient()
        
        self.user = CustomUser.objects.create_user(
            email='user@test.com',
            password='testpass123',
            name='Test',
            last_name='User',
            phone='+1234567890',
            role='client'
        )
        
        self.other_user = CustomUser.objects.create_user(
            email='other@test.com',
            password='testpass123',
            name='Other',
            last_name='User',
            phone='+0987654321',
            role='sales_manager'
        )
        
        # Autenticar usuario
        self.client.force_authenticate(user=self.user)
        
        # Crear notificaciones de prueba
        self.notification1 = Notification.create_notification(
            recipient=self.user,
            notification_type=NotificationType.ORDER_CREATED,
            title='Test 1',
            message='Message 1'
        )
        
        self.notification2 = Notification.create_notification(
            recipient=self.user,
            notification_type=NotificationType.ORDER_CREATED,
            title='Test 2',
            message='Message 2',
            priority=NotificationPriority.HIGH
        )
        
        # Notificación de otro usuario (no debería aparecer)
        Notification.create_notification(
            recipient=self.other_user,
            notification_type=NotificationType.ORDER_CREATED,
            title='Other User',
            message='Should not appear'
        )
    
    def test_list_notifications(self):
        """Test listar notificaciones del usuario"""
        url = '/arye_system/api_data/notifications/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_retrieve_notification(self):
        """Test obtener detalle de notificación"""
        url = f'/arye_system/api_data/notifications/{self.notification1.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test 1')
    
    def test_mark_as_read_single(self):
        """Test marcar una notificación como leída"""
        url = f'/arye_system/api_data/notifications/{self.notification1.id}/mark_as_read/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
    
    def test_mark_as_unread_single(self):
        """Test marcar una notificación como no leída"""
        self.notification1.mark_as_read()
        
        url = f'/arye_system/api_data/notifications/{self.notification1.id}/mark_as_unread/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.notification1.refresh_from_db()
        self.assertFalse(self.notification1.is_read)
    
    def test_mark_all_as_read(self):
        """Test marcar todas las notificaciones como leídas"""
        url = '/arye_system/api_data/notifications/mark_all_as_read/'
        response = self.client.post(url, {})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        
        # Verificar que se marcaron como leídas
        self.notification1.refresh_from_db()
        self.notification2.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
        self.assertTrue(self.notification2.is_read)
    
    def test_mark_specific_as_read(self):
        """Test marcar notificaciones específicas como leídas"""
        url = '/arye_system/api_data/notifications/mark_all_as_read/'
        response = self.client.post(url, {
            'notification_ids': [self.notification1.id]
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        
        self.notification1.refresh_from_db()
        self.notification2.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
        self.assertFalse(self.notification2.is_read)
    
    def test_unread_endpoint(self):
        """Test obtener solo notificaciones no leídas"""
        self.notification1.mark_as_read()
        
        url = '/arye_system/api_data/notifications/unread/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.notification2.id)
    
    def test_unread_count(self):
        """Test obtener conteo de no leídas"""
        url = '/arye_system/api_data/notifications/unread_count/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 2)
        
        self.notification1.mark_as_read()
        
        response = self.client.get(url)
        self.assertEqual(response.data['unread_count'], 1)
    
    def test_stats_endpoint(self):
        """Test obtener estadísticas"""
        url = '/arye_system/api_data/notifications/stats/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)
        self.assertEqual(response.data['unread'], 2)
        self.assertIn('by_type', response.data)
        self.assertIn('by_priority', response.data)
    
    def test_delete_notification(self):
        """Test eliminar notificación"""
        url = f'/arye_system/api_data/notifications/{self.notification1.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(id=self.notification1.id).exists())
    
    def test_clear_read(self):
        """Test eliminar notificaciones leídas"""
        self.notification1.mark_as_read()
        
        url = '/arye_system/api_data/notifications/clear_read/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(Notification.objects.filter(recipient=self.user).count(), 1)
    
    def test_clear_all(self):
        """Test eliminar todas las notificaciones"""
        url = '/arye_system/api_data/notifications/clear_all/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(Notification.objects.filter(recipient=self.user).count(), 0)
    
    def test_unauthorized_access(self):
        """Test que usuarios no autenticados no pueden acceder"""
        self.client.force_authenticate(user=None)
        
        url = '/arye_system/api_data/notifications/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_filter_by_type(self):
        """Test filtrar por tipo de notificación"""
        Notification.create_notification(
            recipient=self.user,
            notification_type=NotificationType.PAYMENT_RECEIVED,
            title='Payment',
            message='Payment received'
        )
        
        url = '/arye_system/api_data/notifications/?notification_type=payment_received'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_filter_by_priority(self):
        """Test filtrar por prioridad"""
        url = '/arye_system/api_data/notifications/?priority=high'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['priority'], 'high')


class NotificationPreferenceViewSetTest(APITestCase):
    """Tests para las vistas de preferencias de notificación"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = CustomUser.objects.create_user(
            email='user@test.com',
            password='testpass123',
            name='Test',
            last_name='User',
            phone='+1234567890',
            role='client'
        )
        
        self.client.force_authenticate(user=self.user)
    
    def test_get_preferences(self):
        """Test obtener preferencias (crea si no existen)"""
        url = '/arye_system/api_data/notification-preferences/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user'], self.user.id)
        self.assertTrue(response.data['email_notifications'])
    
    def test_update_preferences(self):
        """Test actualizar preferencias"""
        url = '/arye_system/api_data/notification-preferences/update_preferences/'
        data = {
            'email_notifications': False,
            'push_notifications': True,
            'digest_frequency': 'daily'
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['email_notifications'])
        self.assertEqual(response.data['digest_frequency'], 'daily')
    
    def test_get_notification_types(self):
        """Test obtener tipos de notificación disponibles"""
        url = '/arye_system/api_data/notification-preferences/notification_types/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('notification_types', response.data)
        self.assertGreater(len(response.data['notification_types']), 0)
    
    def test_reset_to_defaults(self):
        """Test restablecer preferencias a valores por defecto"""
        # Primero modificar preferencias
        preferences = NotificationPreference.get_or_create_preferences(self.user)
        preferences.email_notifications = False
        preferences.digest_frequency = 'weekly'
        preferences.save()
        
        # Restablecer
        url = '/arye_system/api_data/notification-preferences/reset_to_defaults/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['email_notifications'])
        self.assertEqual(response.data['digest_frequency'], 'immediate')


# Ejecutar todos los tests con:
# python manage.py test api.tests.test_notifications --verbosity=2
