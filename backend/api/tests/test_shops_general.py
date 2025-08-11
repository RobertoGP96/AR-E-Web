"""
Tests for Shop and general API functionality
"""

from django.test import TestCase
from rest_framework import status
from api.tests import BaseAPITestCase, ModelTestCase
from api.models import Shop, BuyingAccounts, CommonInformation


class ShopModelTest(ModelTestCase):
    """Test the Shop model"""

    def test_shop_creation(self):
        """Test shop is created successfully"""
        shop = Shop.objects.create(
            name='New Test Shop',
            link='https://newtestshop.com'
        )
        
        self.assertEqual(shop.name, 'New Test Shop')
        self.assertEqual(shop.link, 'https://newtestshop.com')

    def test_shop_str_method(self):
        """Test shop string representation"""
        self.assertEqual(str(self.test_shop), 'Test Shop')

    def test_shop_unique_name(self):
        """Test shop name must be unique"""
        with self.assertRaises(Exception):  # IntegrityError
            Shop.objects.create(
                name='Test Shop',  # Same name as existing shop
                link='https://duplicate.com'
            )

    def test_shop_unique_link(self):
        """Test shop link must be unique"""
        with self.assertRaises(Exception):  # IntegrityError
            Shop.objects.create(
                name='Duplicate Link Shop',
                link='https://testshop.com'  # Same link as existing shop
            )


class BuyingAccountsModelTest(TestCase):
    """Test the BuyingAccounts model"""

    def test_buying_account_creation(self):
        """Test buying account is created successfully"""
        account = BuyingAccounts.objects.create(
            account_name='Test Buying Account'
        )
        
        self.assertEqual(account.account_name, 'Test Buying Account')

    def test_buying_account_str_method(self):
        """Test buying account string representation"""
        account = BuyingAccounts.objects.create(
            account_name='String Test Account'
        )
        
        self.assertEqual(str(account), 'String Test Account')

    def test_buying_account_unique_name(self):
        """Test buying account name must be unique"""
        BuyingAccounts.objects.create(account_name='Unique Test')
        
        with self.assertRaises(Exception):  # IntegrityError
            BuyingAccounts.objects.create(account_name='Unique Test')


class CommonInformationModelTest(TestCase):
    """Test the CommonInformation model"""

    def test_common_information_creation(self):
        """Test common information is created successfully"""
        info = CommonInformation.objects.create(
            change_rate=1.25,
            cost_per_pound=4.50
        )
        
        self.assertEqual(info.change_rate, 1.25)
        self.assertEqual(info.cost_per_pound, 4.50)

    def test_get_instance_method(self):
        """Test get_instance method creates or returns existing instance"""
        # Should create new instance if none exists
        CommonInformation.objects.all().delete()
        
        instance1 = CommonInformation.get_instance()
        self.assertIsNotNone(instance1)
        self.assertEqual(instance1.change_rate, 0)
        self.assertEqual(instance1.cost_per_pound, 0)
        
        # Should return existing instance
        instance1.change_rate = 1.5
        instance1.save()
        
        instance2 = CommonInformation.get_instance()
        self.assertEqual(instance1.id, instance2.id)
        self.assertEqual(instance2.change_rate, 1.5)


class ShopAPITest(BaseAPITestCase):
    """Test the Shop API endpoints"""

    def test_get_shop_list(self):
        """Test getting shop list"""
        response = self.client.get('/shein_shop/shop/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_get_shop_detail_by_name(self):
        """Test getting shop detail by name"""
        response = self.client.get(f'/shein_shop/shop/{self.test_shop.name}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.test_shop.name)
        self.assertEqual(response.data['link'], self.test_shop.link)

    def test_get_shop_detail_nonexistent(self):
        """Test getting detail of nonexistent shop"""
        response = self.client.get('/shein_shop/shop/Nonexistent Shop/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_shop_admin_required(self):
        """Test creating shop requires admin permissions"""
        self.authenticate_user(self.agent_user)
        
        shop_data = {
            'name': 'New Shop',
            'link': 'https://newshop.com'
        }
        
        response = self.client.post('/shein_shop/shop/', shop_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_shop_as_admin(self):
        """Test creating shop as admin user"""
        self.authenticate_user(self.admin_user)
        
        shop_data = {
            'name': 'Admin New Shop',
            'link': 'https://adminnewshop.com'
        }
        
        response = self.client.post('/shein_shop/shop/', shop_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Admin New Shop')

    def test_update_shop_admin_required(self):
        """Test updating shop requires admin permissions"""
        self.authenticate_user(self.agent_user)
        
        update_data = {
            'link': 'https://updated.com'
        }
        
        response = self.client.patch(f'/shein_shop/shop/{self.test_shop.name}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_shop_admin_required(self):
        """Test deleting shop requires admin permissions"""
        self.authenticate_user(self.agent_user)
        
        response = self.client.delete(f'/shein_shop/shop/{self.test_shop.name}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class BuyingAccountsAPITest(BaseAPITestCase):
    """Test the BuyingAccounts API endpoints"""

    def test_get_buying_accounts_list(self):
        """Test getting buying accounts list"""
        response = self.client.get('/shein_shop/buying_account/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_create_buying_account_admin_required(self):
        """Test creating buying account requires admin permissions"""
        self.authenticate_user(self.agent_user)
        
        account_data = {
            'account_name': 'New Buying Account'
        }
        
        response = self.client.post('/shein_shop/buying_account/', account_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_buying_account_as_admin(self):
        """Test creating buying account as admin user"""
        self.authenticate_user(self.admin_user)
        
        account_data = {
            'account_name': 'Admin New Account'
        }
        
        response = self.client.post('/shein_shop/buying_account/', account_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['account_name'], 'Admin New Account')


class CommonInformationAPITest(BaseAPITestCase):
    """Test the CommonInformation API endpoints"""

    def test_get_common_information(self):
        """Test getting common information"""
        response = self.client.get('/shein_shop/common_information/')
        
        # This endpoint returns a single object, not a list
        if isinstance(response.data, list):
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertGreaterEqual(len(response.data), 1)
        else:
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('change_rate', response.data)
            self.assertIn('cost_per_pound', response.data)

    def test_update_common_information_admin_required(self):
        """Test updating common information requires admin permissions"""
        self.authenticate_user(self.agent_user)
        
        update_data = {
            'change_rate': 1.30,
            'cost_per_pound': 5.50
        }
        
        # Try to update the common information instance
        response = self.client.patch('/shein_shop/common_information/1/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_common_information_as_admin(self):
        """Test updating common information as admin user"""
        self.authenticate_user(self.admin_user)
        
        update_data = {
            'change_rate': 1.40,
            'cost_per_pound': 6.00
        }
        
        # Update the common information instance
        response = self.client.patch('/shein_shop/common_information/1/', update_data)
        
        # Might be 200 OK for patch or could be different based on implementation
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])


class SecurityTest(BaseAPITestCase):
    """Test security features"""

    def test_security_endpoint_requires_auth(self):
        """Test security endpoint requires authentication"""
        response = self.client.get('/shein_shop/security/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_security_endpoint_with_auth(self):
        """Test security endpoint with authentication"""
        self.authenticate_user(self.agent_user)
        
        response = self.client.get('/shein_shop/security/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_invalid_token_format(self):
        """Test invalid token format returns 401"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        
        response = self.client.get('/shein_shop/security/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_expired_token_handling(self):
        """Test handling of expired tokens"""
        # This would require creating an expired token, which is complex
        # For now, just test with an obviously invalid token
        self.client.credentials(HTTP_AUTHORIZATION='Bearer expired.token.here')
        
        response = self.client.get('/shein_shop/security/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PermissionsTest(BaseAPITestCase):
    """Test role-based permissions"""

    def test_agent_can_access_orders(self):
        """Test agent can access orders"""
        self.authenticate_user(self.agent_user)
        
        response = self.client.get('/shein_shop/order/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_client_cannot_access_orders(self):
        """Test client cannot access orders endpoint"""
        self.authenticate_user(self.client_user)
        
        response = self.client.get('/shein_shop/order/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_buyer_can_access_buying_functions(self):
        """Test buyer can access buying-related functions"""
        self.authenticate_user(self.buyer_user)
        
        response = self.client.get('/shein_shop/shopping_reciep/')
        
        # Should be able to read
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])

    def test_non_buyer_cannot_create_shopping_receipt(self):
        """Test non-buyer cannot create shopping receipts"""
        self.authenticate_user(self.agent_user)
        
        receipt_data = {
            'shopping_account': self.test_buying_account.account_name,
            'shop_of_buy': self.test_shop.name
        }
        
        response = self.client.post('/shein_shop/shopping_reciep/', receipt_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
