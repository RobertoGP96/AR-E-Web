"""Views for Card Operations"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from datetime import datetime

from api.services.purchases_service import get_card_operations
from api.permissions.permissions import AdminPermission, AccountantPermission


class CardOperationsView(APIView):
    """API View to get card operations with filtering by date range and card ID"""
    
    permission_classes = [IsAuthenticated, AdminPermission | AccountantPermission]
    
    def get(self, request):
        """
        Get card operations with optional date range and card ID filtering
        
        Query Parameters:
            start_date (str, optional): Start date in YYYY-MM-DD format
            end_date (str, optional): End date in YYYY-MM-DD format
            card_id (str, optional): Specific card ID to filter by
            
        Returns:
            Response: JSON with card operations data
        """
        try:
            # Get query parameters
            start_date_str = request.query_params.get('start_date')
            end_date_str = request.query_params.get('end_date')
            card_id = request.query_params.get('card_id')
            
            # Convert string dates to datetime objects if provided
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else None
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else None
            
            # Get card operations data
            operations = get_card_operations(
                start_date=start_date,
                end_date=end_date,
                card_id=card_id
            )
            
            return Response(operations, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
