"""
Script de prueba para verificar que las métricas del dashboard funcionen correctamente
Ejecutar desde la raíz del proyecto backend: python test_metrics.py
"""

import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Product, Order, ProductBuyed, Package, DeliverReceip
from datetime import datetime

User = get_user_model()

def test_metrics():
    """Probar que los modelos existan y tengan datos"""
    
    print("=" * 60)
    print("VERIFICACIÓN DE MÉTRICAS DEL DASHBOARD")
    print("=" * 60)
    
    # Usuarios
    users_total = User.objects.count()
    users_active = User.objects.filter(is_active=True).count()
    users_verified = User.objects.filter(is_verified=True).count()
    users_agents = User.objects.filter(role='agent').count()
    
    print("\n📊 USUARIOS:")
    print(f"  ✓ Total: {users_total}")
    print(f"  ✓ Activos: {users_active}")
    print(f"  ✓ Verificados: {users_verified}")
    print(f"  ✓ Agentes: {users_agents}")
    
    # Productos
    products_total = Product.objects.count()
    
    print("\n📦 PRODUCTOS:")
    print(f"  ✓ Total: {products_total}")
    
    # Órdenes
    orders_total = Order.objects.count()
    orders_pending = Order.objects.filter(status__in=['Encargado', 'Comprado']).count()
    orders_completed = Order.objects.filter(status='Entregado').count()
    
    print("\n🛒 ÓRDENES:")
    print(f"  ✓ Total: {orders_total}")
    print(f"  ✓ Pendientes: {orders_pending}")
    print(f"  ✓ Completadas: {orders_completed}")
    
    # Compras (ProductBuyed)
    purchases_total = ProductBuyed.objects.count()
    
    print("\n🛍️  COMPRAS (ProductBuyed):")
    print(f"  ✓ Total: {purchases_total}")
    
    if purchases_total > 0:
        latest_purchase = ProductBuyed.objects.order_by('-buy_date').first()
        print(f"  ✓ Última compra: {latest_purchase.buy_date.strftime('%Y-%m-%d %H:%M')}")
        print(f"  ✓ Producto: {latest_purchase.original_product.name}")
    else:
        print("  ⚠️  No hay compras registradas")
    
    # Paquetes (Package)
    packages_total = Package.objects.count()
    packages_sent = Package.objects.filter(status_of_processing='Enviado').count()
    packages_in_transit = Package.objects.filter(status_of_processing='Recibido').count()
    packages_delivered = Package.objects.filter(status_of_processing='Procesado').count()
    
    print("\n📦 PAQUETES (Package):")
    print(f"  ✓ Total: {packages_total}")
    print(f"  ✓ Enviados: {packages_sent}")
    print(f"  ✓ Recibidos: {packages_in_transit}")
    print(f"  ✓ Procesados: {packages_delivered}")
    
    if packages_total > 0:
        latest_package = Package.objects.order_by('-created_at').first()
        print(f"  ✓ Último paquete: {latest_package.number_of_tracking}")
        print(f"  ✓ Estado: {latest_package.status_of_processing}")
    else:
        print("  ⚠️  No hay paquetes registrados")
    
    # Entregas (DeliverReceip)
    deliveries_total = DeliverReceip.objects.count()
    deliveries_pending = DeliverReceip.objects.filter(status='Pendiente').count()
    deliveries_in_transit = DeliverReceip.objects.filter(status='En transito').count()
    deliveries_delivered = DeliverReceip.objects.filter(status='Entregado').count()
    
    print("\n🚚 ENTREGAS (DeliverReceip):")
    print(f"  ✓ Total: {deliveries_total}")
    print(f"  ✓ Pendientes: {deliveries_pending}")
    print(f"  ✓ En tránsito: {deliveries_in_transit}")
    print(f"  ✓ Entregadas: {deliveries_delivered}")
    
    if deliveries_total > 0:
        latest_delivery = DeliverReceip.objects.order_by('-created_at').first()
        print(f"  ✓ Última entrega: {latest_delivery.created_at.strftime('%Y-%m-%d %H:%M')}")
        print(f"  ✓ Cliente: {latest_delivery.client.full_name}")
        print(f"  ✓ Peso: {latest_delivery.weight} lb")
        print(f"  ✓ Estado: {latest_delivery.status}")
    else:
        print("  ⚠️  No hay entregas registradas")
    
    print("\n" + "=" * 60)
    print("✅ VERIFICACIÓN COMPLETADA")
    print("=" * 60)
    
    # Verificar estructura de respuesta esperada
    print("\n📋 ESTRUCTURA DE RESPUESTA ESPERADA:")
    print("""
{
  "success": true,
  "data": {
    "users": { "total": N, "active": N, "verified": N, "agents": N },
    "products": { "total": N, ... },
    "orders": { "total": N, "pending": N, "completed": N, ... },
    "revenue": { "total": N, ... },
    "purchases": { "total": N, "today": N, "this_week": N, "this_month": N },
    "packages": { "total": N, "sent": N, "in_transit": N, "delivered": N, "delayed": 0 },
    "deliveries": { "total": N, "today": N, "this_week": N, "this_month": N, "pending": N, "in_transit": N, "delivered": N }
  },
  "message": "Métricas del dashboard obtenidas exitosamente"
}
    """)
    
    print("\n💡 ENDPOINTS DISPONIBLES:")
    print("  GET /api_data/dashboard/stats/")
    print("  Requiere: Token de autenticación de administrador")
    print("  Header: Authorization: Bearer <token>")

if __name__ == "__main__":
    try:
        test_metrics()
    except Exception as e:
        print(f"\n❌ Error al ejecutar el test: {e}")
        import traceback
        traceback.print_exc()
