"""
Test configuration and base classes
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import (
    Shop, 
    BuyingAccounts, 
    CommonInformation, 
    Order, 
    Product,
    EvidenceImages
)

User = get_user_model()


class BaseAPITestCase(APITestCase):
    """
    Base test case with common setup for API tests
    """
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            phone_number='1111111111',
            name='Admin',
            last_name='User',
            password='testpass123',
            is_staff=True,
            is_active=True,
            is_verified=True
        )
        
        self.agent_user = User.objects.create_user(
            email='agent@test.com',
            phone_number='2222222222',
            name='Agent',
            last_name='User',
            password='testpass123',
            role='agent',
            is_active=True,
            is_verified=True
        )
        
        self.client_user = User.objects.create_user(
            email='client@test.com',
            phone_number='3333333333',
            name='Client',
            last_name='User',
            password='testpass123',
            role='user',
            is_active=True,
            is_verified=True
        )
        
        self.buyer_user = User.objects.create_user(
            email='buyer@test.com',
            phone_number='4444444444',
            name='Buyer',
            last_name='User',
            password='testpass123',
            role='buyer',
            is_active=True,
            is_verified=True
        )
        
        # Create test shop
        self.test_shop = Shop.objects.create(
            name='Test Shop',
            link='https://testshop.com'
        )
        
        # Create test buying account
        self.test_buying_account = BuyingAccounts.objects.create(
            account_name='Test Account'
        )
        
        # Create common information
        self.common_info = CommonInformation.objects.create(
            change_rate=1.0,
            cost_per_pound=5.0
        )
        
        # Create test order
        self.test_order = Order.objects.create(
            client=self.client_user,
            sales_manager=self.agent_user
        )

    def get_jwt_token(self, user):
        """Get JWT token for user"""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)

    def authenticate_user(self, user):
        """Authenticate user for API calls"""
        token = self.get_jwt_token(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def unauthenticate_user(self):
        """Remove authentication"""
        self.client.credentials()


class ModelTestCase(TestCase):
    """
    Base test case for model tests
    """
    
    def setUp(self):
        """Set up test data"""
        self.test_user = User.objects.create_user(
            email='test@example.com',
            phone_number='1234567890',
            name='Test',
            last_name='User',
            password='testpass123'
        )
        
        self.agent_user = User.objects.create_user(
            email='agent@example.com',
            phone_number='0987654321',
            name='Agent',
            last_name='User',
            password='testpass123',
            role='agent'
        )
        
        self.test_shop = Shop.objects.create(
            name='Test Shop',
            link='https://testshop.com'
        )
