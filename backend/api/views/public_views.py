"""Public API views - no authentication required"""
from rest_framework import generics
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema
from api.models import Category, Shop
from api.serializers import PublicCategorySerializer, PublicShopSerializer


class PublicCategoryListView(generics.ListAPIView):
    """Public read-only list of categories with client shipping charges."""
    queryset = Category.objects.all().order_by('name')
    serializer_class = PublicCategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None

    @extend_schema(
        summary="Listar categorías (público)",
        description="Lista pública de categorías con tarifas de envío para clientes.",
        tags=["Público"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class PublicShopListView(generics.ListAPIView):
    """Public read-only list of active shops with tax rates."""
    queryset = Shop.objects.filter(is_active=True).order_by('name')
    serializer_class = PublicShopSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    @extend_schema(
        summary="Listar tiendas (público)",
        description="Lista pública de tiendas activas con tasas de impuestos.",
        tags=["Público"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
