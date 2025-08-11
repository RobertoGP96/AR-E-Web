"""
Tests for User model and authentication
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase
from rest_framework import status
from api.tests import BaseAPITestCase

User = get_user_model()


class CustomUserModelTest(TestCase):
    """Test the custom user model"""

    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'name': 'Test',
            'last_name': 'User',
            'password': 'testpass123'
        }

    def test_create_user_with_email_successful(self):
        """Test creating a user with an email is successful"""
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(user.email, self.user_data['email'])
        self.assertTrue(user.check_password(self.user_data['password']))
        self.assertFalse(user.is_active)  # Should be inactive by default
        self.assertFalse(user.is_verified)  # Should be unverified by default

    def test_new_user_email_normalized(self):
        """Test that email for new user is normalized"""
        email = 'test@EXAMPLE.COM'
        user = User.objects.create_user(
            email=email,
            name='Test',
            last_name='User',
            password='testpass123'
        )
        
        self.assertEqual(user.email, email.lower())

    def test_new_user_invalid_email(self):
        """Test creating user with invalid email raises error"""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email='',
                name='Test',
                last_name='User',
                password='testpass123'
            )

    def test_create_superuser(self):
        """Test creating a superuser"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            name='Admin',
            last_name='User',
            password='testpass123'
        )
        
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_active)

    def test_user_full_name_property(self):
        """Test the full_name property"""
        user = User.objects.create_user(**self.user_data)
        expected_full_name = f"{self.user_data['name']} {self.user_data['last_name']}"
        
        self.assertEqual(user.full_name, expected_full_name)

    def test_user_has_role_method(self):
        """Test the has_role method"""
        user = User.objects.create_user(
            **self.user_data,
            role='agent'
        )
        
        self.assertTrue(user.has_role('agent'))
        self.assertFalse(user.has_role('buyer'))
        self.assertFalse(user.has_role('accountant'))
        self.assertFalse(user.has_role('nonexistent_role'))

    def test_user_verify_method(self):
        """Test the verify method"""
        user = User.objects.create_user(**self.user_data)
        user.verification_secret = 'test_secret'
        user.save()
        
        self.assertFalse(user.is_verified)
        self.assertFalse(user.is_active)
        
        user.verify()
        
        self.assertTrue(user.is_verified)
        self.assertTrue(user.is_active)
        self.assertIsNone(user.verification_secret)


class UserAPITest(BaseAPITestCase):
    """Test the User API endpoints"""

    def test_create_user_successful(self):
        """Test creating a user via API"""
        user_data = {
            'email': 'newuser@example.com',
            'name': 'New',
            'last_name': 'User',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'phone_number': '+1234567890'
        }
        
        response = self.client.post('/shein_shop/user/', user_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects.get(email=user_data['email'])
        self.assertEqual(user.email, user_data['email'])
        self.assertEqual(user.name, user_data['name'])
        self.assertFalse(user.is_active)  # Should require verification

    def test_create_user_duplicate_email(self):
        """Test creating a user with duplicate email fails"""
        user_data = {
            'email': 'client@test.com',  # This email already exists
            'name': 'Duplicate',
            'last_name': 'User',
            'password': 'testpass123',
            'password_confirm': 'testpass123'
        }
        
        response = self.client.post('/shein_shop/user/', user_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_user_password_mismatch(self):
        """Test creating a user with password mismatch fails"""
        user_data = {
            'email': 'mismatch@example.com',
            'name': 'Mismatch',
            'last_name': 'User',
            'password': 'testpass123',
            'password_confirm': 'differentpass123'
        }
        
        response = self.client.post('/shein_shop/user/', user_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password_confirm', response.data)

    def test_create_user_invalid_phone(self):
        """Test creating a user with invalid phone number fails"""
        user_data = {
            'email': 'invalidphone@example.com',
            'name': 'Invalid',
            'last_name': 'Phone',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'phone_number': 'invalid-phone'
        }
        
        response = self.client.post('/shein_shop/user/', user_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_get_user_list_authenticated(self):
        """Test getting user list when authenticated"""
        self.authenticate_user(self.admin_user)
        
        response = self.client.get('/shein_shop/user/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 4)  # At least our test users

    def test_get_user_list_unauthenticated(self):
        """Test getting user list when not authenticated returns 401"""
        response = self.client.get('/shein_shop/user/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_user_detail(self):
        """Test getting user detail"""
        self.authenticate_user(self.admin_user)
        
        response = self.client.get(f'/shein_shop/user/{self.client_user.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.client_user.email)
        self.assertEqual(response.data['name'], self.client_user.name)

    def test_verify_user_valid_secret(self):
        """Test user verification with valid secret"""
        user = User.objects.create_user(
            email='verify@example.com',
            name='Verify',
            last_name='User',
            password='testpass123',
            verification_secret='valid_secret'
        )
        
        response = self.client.get(f'/shein_shop/verify_user/valid_secret')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'user_registered')
        
        user.refresh_from_db()
        self.assertTrue(user.is_verified)
        self.assertTrue(user.is_active)

    def test_verify_user_invalid_secret(self):
        """Test user verification with invalid secret"""
        response = self.client.get(f'/shein_shop/verify_user/invalid_secret')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'unable to register user')


class AuthenticationTest(BaseAPITestCase):
    """Test JWT authentication"""

    def test_obtain_token_valid_credentials(self):
        """Test obtaining JWT token with valid credentials"""
        data = {
            'email': 'agent@test.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/shein_shop/token/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_obtain_token_invalid_credentials(self):
        """Test obtaining JWT token with invalid credentials"""
        data = {
            'email': 'agent@test.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post('/shein_shop/token/', data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_inactive_user(self):
        """Test obtaining JWT token for inactive user"""
        inactive_user = User.objects.create_user(
            email='inactive@test.com',
            name='Inactive',
            last_name='User',
            password='testpass123',
            is_active=False
        )
        
        data = {
            'email': 'inactive@test.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/shein_shop/token/', data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token(self):
        """Test refreshing JWT token"""
        # First get tokens
        data = {
            'email': 'agent@test.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/shein_shop/token/', data)
        refresh_token = response.data['refresh']
        
        # Then refresh
        refresh_data = {'refresh': refresh_token}
        response = self.client.post('/shein_shop/token/refresh/', refresh_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_protected_endpoint_with_token(self):
        """Test accessing protected endpoint with valid token"""
        self.authenticate_user(self.agent_user)
        
        response = self.client.get('/shein_shop/security/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token"""
        response = self.client.get('/shein_shop/security/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
