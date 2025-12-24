from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema
from api.permissions.permissions import AdminPermission, AgentPermission
from api.serializers.amazon_serializers import AmazonScrapingRequestSerializer, AmazonScrapingResponseSerializer
from api.utils.amazon_scraper import amazon_scraper
import logging

logger = logging.getLogger(__name__)


class AmazonScrapingView(APIView):
    """
    Vista para scraping de productos de Amazon.
    Utiliza el scraper robusto con manejo de reintentos, rotación de User-Agents y proxies.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Scraping de Amazon",
        description="Realiza scraping de productos o carritos desde Amazon usando URL. "
                    "Soporta productos individuales y carritos de compra.",
        request=AmazonScrapingRequestSerializer,
        responses={200: AmazonScrapingResponseSerializer},
        tags=["Amazon"]
    )
    def post(self, request):
        serializer = AmazonScrapingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': 'URL inválida. Debe ser una URL válida de Amazon (producto o carrito).'
            }, status=status.HTTP_400_BAD_REQUEST)

        url = serializer.validated_data['url']

        try:
            logger.info(f"Iniciando scraping de Amazon para URL: {url}")
            
            # Usar el scraper robusto
            result = amazon_scraper.scrape_product(url)
            
            if not result.get('success', False):
                error_message = result.get('error', 'Error desconocido al hacer scraping')
                logger.warning(f"Error en scraping de Amazon: {error_message}")
                return Response({
                    'success': False,
                    'error': error_message
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # El resultado ya viene en el formato correcto con 'success' y 'data'
            logger.info(f"Scraping exitoso. Tipo: {result.get('data', {}).get('type', 'unknown')}")
            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            error_message = f'Error inesperado al procesar la solicitud: {str(e)}'
            logger.error(f"Error en AmazonScrapingView: {error_message}", exc_info=True)
            return Response({
                'success': False,
                'error': error_message
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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