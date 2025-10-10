"""
Tests para verificar actualizaciones parciales de usuarios
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class PartialUserUpdateTestCase(TestCase):
    """Tests para actualizaciones parciales de usuarios"""

    def setUp(self):
        """Configuración inicial para los tests"""
        self.client = APIClient()
        
        # Crear un superusuario para autenticación
        self.admin_user = User.objects.create_superuser(
            email='admin@test.com',
            password='admin123',
            name='Admin',
            last_name='User',
            phone_number='1234567890'
        )
        
        # Crear un usuario de prueba
        self.test_user = User.objects.create_user(
            email='test@test.com',
            password='test123',
            name='Test',
            last_name='User',
            phone_number='9876543210',
            home_address='123 Test Street',
            role='user',
            agent_profit=0
        )
        
        # Autenticar como admin
        self.client.force_authenticate(user=self.admin_user)

    def test_update_only_name(self):
        """Test: Actualizar solo el nombre del usuario"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'name': 'UpdatedName'}
        
        response = self.client.patch(url, data, format='json')
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.data if hasattr(response, 'data') else response.content}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.name, 'UpdatedName')
        # Verificar que otros campos no cambiaron
        self.assertEqual(self.test_user.last_name, 'User')
        self.assertEqual(self.test_user.email, 'test@test.com')
        self.assertEqual(self.test_user.phone_number, '9876543210')

    def test_update_only_phone(self):
        """Test: Actualizar solo el teléfono del usuario"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'phone_number': '5555555555'}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.phone_number, '5555555555')
        # Verificar que otros campos no cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.email, 'test@test.com')

    def test_update_only_address(self):
        """Test: Actualizar solo la dirección del usuario"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'home_address': '456 New Address'}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.home_address, '456 New Address')
        # Verificar que otros campos no cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.phone_number, '9876543210')

    def test_update_only_role(self):
        """Test: Actualizar solo el rol del usuario"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'role': 'agent'}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.role, 'agent')
        # Verificar que otros campos no cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.email, 'test@test.com')

    def test_update_only_agent_profit(self):
        """Test: Actualizar solo la ganancia del agente"""
        # Primero cambiar a agente
        self.test_user.role = 'agent'
        self.test_user.save()
        
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'agent_profit': 15.5}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        self.assertEqual(float(self.test_user.agent_profit), 15.5)
        # Verificar que otros campos no cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.role, 'agent')

    def test_update_only_is_active(self):
        """Test: Actualizar solo el estado activo del usuario"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'is_active': False}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.is_active, False)
        # Verificar que otros campos no cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.email, 'test@test.com')

    def test_update_only_is_verified(self):
        """Test: Actualizar solo el estado de verificación del usuario"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'is_verified': True}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.is_verified, True)
        # Verificar que otros campos no cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.email, 'test@test.com')

    def test_update_multiple_fields(self):
        """Test: Actualizar múltiples campos a la vez"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {
            'name': 'NewName',
            'last_name': 'NewLastName',
            'phone_number': '1111111111'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.name, 'NewName')
        self.assertEqual(self.test_user.last_name, 'NewLastName')
        self.assertEqual(self.test_user.phone_number, '1111111111')
        # Verificar que campos no enviados no cambiaron
        self.assertEqual(self.test_user.email, 'test@test.com')
        self.assertEqual(self.test_user.home_address, '123 Test Street')

    def test_update_password_only(self):
        """Test: Actualizar solo la contraseña del usuario"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'password': 'newpassword123'}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        # Verificar que la contraseña fue encriptada correctamente
        self.assertTrue(self.test_user.check_password('newpassword123'))
        # Verificar que otros campos no cambiaron
        self.assertEqual(self.test_user.name, 'Test')
        self.assertEqual(self.test_user.email, 'test@test.com')

    def test_update_without_password(self):
        """Test: Actualizar usuario sin enviar contraseña"""
        old_password = self.test_user.password
        
        url = f'/api_data/user/{self.test_user.id}/'
        data = {
            'name': 'UpdatedWithoutPassword',
            'phone_number': '2222222222'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.name, 'UpdatedWithoutPassword')
        self.assertEqual(self.test_user.phone_number, '2222222222')
        # Verificar que la contraseña no cambió
        self.assertEqual(self.test_user.password, old_password)
        self.assertTrue(self.test_user.check_password('test123'))

    def test_update_email_to_empty(self):
        """Test: Actualizar email a vacío (permitido)"""
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'email': ''}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        self.assertIsNone(self.test_user.email)

    def test_update_with_duplicate_phone(self):
        """Test: Intentar actualizar con un teléfono que ya existe"""
        # Crear otro usuario
        other_user = User.objects.create_user(
            email='other@test.com',
            password='other123',
            name='Other',
            last_name='User',
            phone_number='3333333333'
        )
        
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'phone_number': '3333333333'}
        
        response = self.client.patch(url, data, format='json')
        
        # Debe fallar porque el teléfono ya existe
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_update_with_duplicate_email(self):
        """Test: Intentar actualizar con un email que ya existe"""
        # Crear otro usuario
        other_user = User.objects.create_user(
            email='other@test.com',
            password='other123',
            name='Other',
            last_name='User',
            phone_number='3333333333'
        )
        
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'email': 'other@test.com'}
        
        response = self.client.patch(url, data, format='json')
        
        # Debe fallar porque el email ya existe
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_partial_update_preserves_unspecified_fields(self):
        """Test: Verificar que los campos no especificados se preservan"""
        original_data = {
            'name': self.test_user.name,
            'last_name': self.test_user.last_name,
            'email': self.test_user.email,
            'phone_number': self.test_user.phone_number,
            'home_address': self.test_user.home_address,
            'role': self.test_user.role,
            'agent_profit': self.test_user.agent_profit,
            'is_active': self.test_user.is_active,
            'is_verified': self.test_user.is_verified,
        }
        
        url = f'/api_data/user/{self.test_user.id}/'
        data = {'name': 'OnlyNameChanged'}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_user.refresh_from_db()
        
        # Verificar que solo el nombre cambió
        self.assertEqual(self.test_user.name, 'OnlyNameChanged')
        # Verificar que todo lo demás permanece igual
        self.assertEqual(self.test_user.last_name, original_data['last_name'])
        self.assertEqual(self.test_user.email, original_data['email'])
        self.assertEqual(self.test_user.phone_number, original_data['phone_number'])
        self.assertEqual(self.test_user.home_address, original_data['home_address'])
        self.assertEqual(self.test_user.role, original_data['role'])
        self.assertEqual(self.test_user.agent_profit, original_data['agent_profit'])
        self.assertEqual(self.test_user.is_active, original_data['is_active'])
        self.assertEqual(self.test_user.is_verified, original_data['is_verified'])
