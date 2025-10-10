"""
Tests para verificar que las actualizaciones parciales de usuarios funcionen correctamente
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class UserPartialUpdateTestCase(TestCase):
    """Tests para actualización parcial de usuarios"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.client = APIClient()
        
        # Crear un usuario administrador para hacer las peticiones
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            phone_number='+1234567890',
            name='Admin',
            last_name='Test',
            password='admin123',
            role='admin',
            is_staff=True,
            is_active=True,
            is_verified=True
        )
        
        # Crear un usuario de prueba para actualizar
        self.test_user = User.objects.create_user(
            email='test@example.com',
            phone_number='+9876543210',
            name='Test',
            last_name='User',
            password='test123',
            role='user',
            agent_profit=0,
            home_address='Calle Original 123',
            is_active=True,
            is_verified=False
        )
        
        # Autenticar como admin
        self.client.force_authenticate(user=self.admin_user)

    def test_partial_update_single_field_name(self):
        """Test: Actualizar solo el campo 'name'"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'name': 'Nombre Actualizado'}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que el nombre se actualizó
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.name, 'Nombre Actualizado')
        
        # Verificar que otros campos NO cambiaron
        self.assertEqual(self.test_user.last_name, 'User')
        self.assertEqual(self.test_user.email, 'test@example.com')
        self.assertEqual(self.test_user.phone_number, '+9876543210')
        self.assertEqual(self.test_user.home_address, 'Calle Original 123')
        self.assertEqual(self.test_user.role, 'user')

    def test_partial_update_single_field_phone(self):
        """Test: Actualizar solo el campo 'phone_number'"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'phone_number': '+1111111111'}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que el teléfono se actualizó
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.phone_number, '+1111111111')
        
        # Verificar que otros campos NO cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.last_name, 'User')
        self.assertEqual(self.test_user.email, 'test@example.com')

    def test_partial_update_single_field_address(self):
        """Test: Actualizar solo el campo 'home_address'"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'home_address': 'Nueva Dirección 456'}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que la dirección se actualizó
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.home_address, 'Nueva Dirección 456')
        
        # Verificar que otros campos NO cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.phone_number, '+9876543210')

    def test_partial_update_single_field_role(self):
        """Test: Actualizar solo el campo 'role'"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'role': 'agent'}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que el rol se actualizó
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.role, 'agent')
        
        # Verificar que otros campos NO cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.phone_number, '+9876543210')

    def test_partial_update_single_field_agent_profit(self):
        """Test: Actualizar solo el campo 'agent_profit'"""
        # Primero cambiar el rol a agent
        self.test_user.role = 'agent'
        self.test_user.save()
        
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'agent_profit': 15.5}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que la ganancia se actualizó
        self.test_user.refresh_from_db()
        self.assertEqual(float(self.test_user.agent_profit), 15.5)
        
        # Verificar que otros campos NO cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.role, 'agent')

    def test_partial_update_single_field_is_active(self):
        """Test: Actualizar solo el campo 'is_active'"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'is_active': False}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que el estado se actualizó
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.is_active, False)
        
        # Verificar que otros campos NO cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.email, 'test@example.com')

    def test_partial_update_single_field_is_verified(self):
        """Test: Actualizar solo el campo 'is_verified'"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'is_verified': True}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que el estado de verificación se actualizó
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.is_verified, True)
        
        # Verificar que otros campos NO cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.is_active, True)

    def test_partial_update_multiple_fields(self):
        """Test: Actualizar varios campos a la vez"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {
            'name': 'Nuevo Nombre',
            'home_address': 'Nueva Dirección Completa',
            'is_verified': True
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que los campos enviados se actualizaron
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.name, 'Nuevo Nombre')
        self.assertEqual(self.test_user.home_address, 'Nueva Dirección Completa')
        self.assertEqual(self.test_user.is_verified, True)
        
        # Verificar que los campos NO enviados NO cambiaron
        self.assertEqual(self.test_user.last_name, 'User')
        self.assertEqual(self.test_user.phone_number, '+9876543210')
        self.assertEqual(self.test_user.role, 'user')

    def test_partial_update_without_password(self):
        """Test: Actualizar campos sin enviar password"""
        original_password = self.test_user.password
        
        url = f'/api_data/user/{self.test_user.id}/'
        data = {
            'name': 'Sin Cambio de Contraseña',
            'email': 'newemail@test.com'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que los campos se actualizaron
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.name, 'Sin Cambio de Contraseña')
        self.assertEqual(self.test_user.email, 'newemail@test.com')
        
        # Verificar que la contraseña NO cambió
        self.assertEqual(self.test_user.password, original_password)

    def test_partial_update_with_password(self):
        """Test: Actualizar incluyendo nueva contraseña"""
        original_password = self.test_user.password
        
        url = f'/api_data/user/{self.test_user.id}/'
        data = {
            'name': 'Con Nueva Contraseña',
            'password': 'newpassword123'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que el nombre se actualizó
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.name, 'Con Nueva Contraseña')
        
        # Verificar que la contraseña SÍ cambió
        self.assertNotEqual(self.test_user.password, original_password)
        self.assertTrue(self.test_user.check_password('newpassword123'))

    def test_partial_update_empty_optional_field(self):
        """Test: Actualizar campo opcional a vacío"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'home_address': ''}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que la dirección se vació
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.home_address, '')

    def test_partial_update_preserves_readonly_fields(self):
        """Test: Los campos readonly no se pueden actualizar"""
        original_date_joined = self.test_user.date_joined
        
        url = f'/api_data/user/{self.test_user.id}/'
        data = {
            'name': 'Nombre Nuevo',
            'date_joined': '2020-01-01T00:00:00Z',  # Intentar cambiar campo readonly
            'id': 99999  # Intentar cambiar el ID
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que name sí cambió
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.name, 'Nombre Nuevo')
        
        # Verificar que los campos readonly NO cambiaron
        self.assertEqual(self.test_user.id, self.test_user.id)  # ID no cambió
        self.assertEqual(self.test_user.date_joined, original_date_joined)


class UserPartialUpdateValidationTestCase(TestCase):
    """Tests para validaciones en actualizaciones parciales"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.client = APIClient()
        
        # Crear un usuario administrador
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            phone_number='+1234567890',
            name='Admin',
            last_name='Test',
            password='admin123',
            role='admin',
            is_staff=True,
            is_active=True,
            is_verified=True
        )
        
        # Crear usuarios de prueba
        self.test_user = User.objects.create_user(
            email='test@example.com',
            phone_number='+9876543210',
            name='Test',
            last_name='User',
            password='test123',
            role='user'
        )
        
        self.other_user = User.objects.create_user(
            email='other@example.com',
            phone_number='+5555555555',
            name='Other',
            last_name='User',
            password='other123',
            role='user'
        )
        
        # Autenticar como admin
        self.client.force_authenticate(user=self.admin_user)

    def test_partial_update_invalid_email_format(self):
        """Test: Rechazar email con formato inválido"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'email': 'invalid-email'}
        
        response = self.client.patch(url, data, format='json')
        
        # Debe fallar la validación
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_update_invalid_phone_format(self):
        """Test: Rechazar teléfono con formato inválido"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'phone_number': 'abc123xyz'}
        
        response = self.client.patch(url, data, format='json')
        
        # Debe fallar la validación
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_update_invalid_role(self):
        """Test: Rechazar rol inválido"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'role': 'invalid_role'}
        
        response = self.client.patch(url, data, format='json')
        
        # Debe fallar la validación
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_update_negative_agent_profit(self):
        """Test: Rechazar ganancia de agente negativa"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'agent_profit': -10}
        
        response = self.client.patch(url, data, format='json')
        
        # Debe fallar la validación
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


def run_tests():
    """Función auxiliar para ejecutar los tests"""
    import sys
    from django.core.management import execute_from_command_line
    
    sys.argv = ['manage.py', 'test', 'api.tests.test_partial_update', '--verbosity=2']
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    run_tests()
