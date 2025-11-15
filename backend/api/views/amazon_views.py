from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema
from api.permissions.permissions import AdminPermission, AgentPermission
from api.serializers import AmazonScrapingSerializer
import requests
from bs4 import BeautifulSoup
import json


class AmazonScrapingView(APIView):
    """
    Vista para scraping de productos de Amazon.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Scraping de Amazon",
        description="Realiza scraping de productos desde Amazon usando URL.",
        request=AmazonScrapingSerializer,
        tags=["Amazon"]
    )
    def post(self, request):
        serializer = AmazonScrapingSerializer(data=request.data)
        if serializer.is_valid():
            url = serializer.validated_data['url']

            try:
                # Headers para simular un navegador real
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }

                # Realizar la petición
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()

                # Parsear el HTML
                soup = BeautifulSoup(response.content, 'html.parser')

                # Extraer información básica del producto
                product_data = {}

                # Título del producto
                title_elem = soup.find('span', {'id': 'productTitle'})
                if title_elem:
                    product_data['title'] = title_elem.get_text(strip=True)

                # Precio
                price_elem = soup.find('span', {'class': 'a-price-whole'})
                if price_elem:
                    product_data['price'] = price_elem.get_text(strip=True)

                # Imagen principal
                image_elem = soup.find('img', {'id': 'landingImage'})
                if image_elem:
                    product_data['image_url'] = image_elem.get('src')

                # Descripción
                desc_elem = soup.find('div', {'id': 'productDescription'})
                if desc_elem:
                    product_data['description'] = desc_elem.get_text(strip=True)

                # Rating
                rating_elem = soup.find('span', {'class': 'a-icon-alt'})
                if rating_elem:
                    product_data['rating'] = rating_elem.get_text(strip=True)

                return Response({
                    'success': True,
                    'product_data': product_data,
                    'url': url
                })

            except requests.RequestException as e:
                return Response({
                    'success': False,
                    'error': f'Error al acceder a Amazon: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                return Response({
                    'success': False,
                    'error': f'Error al procesar el producto: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateAdminView(APIView):
    """
    Vista para crear un usuario administrador.
    """
    permission_classes = [IsAuthenticated, AdminPermission]

    @extend_schema(
        summary="Crear administrador",
        description="Crea un nuevo usuario con rol de administrador.",
        tags=["Administración"]
    )
    def post(self, request):
        from api.serializers import UserCreateSerializer

        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.role = 'admin'
            user.is_staff = True
            user.save()

            return Response({
                'message': 'Administrador creado exitosamente',
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)