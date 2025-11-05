"""
Script para verificar el funcionamiento completo del sistema
Incluye: Usuarios, Productos, Órdenes, Compras, Paquetes y Deliveries
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import (
    CustomUser, Product, Order, ProductBuyed,
    Package, DeliverReceip
)
from api.serializers import UserSerializer, UserProfileSerializer
import json
from decimal import Decimal

print("="*70)
print("VERIFICACIÓN COMPLETA DEL SISTEMA")
print("="*70)

def test_users():
    """Verificar usuarios"""
    print("\n🔍 PRUEBA 1: Verificando usuarios...")
    
    total = CustomUser.objects.count()
    agents = CustomUser.objects.filter(role='agent').count()
    clients = CustomUser.objects.filter(role='client').count()
    with_agent = CustomUser.objects.filter(role='client', assigned_agent__isnull=False).count()
    
    print(f"  ✓ Total usuarios: {total}")
    print(f"  ✓ Agentes: {agents}")
    print(f"  ✓ Clientes: {clients}")
    print(f"  ✓ Clientes con agente: {with_agent}")
    
    # Verificar un agente con sus clientes
    agent = CustomUser.objects.filter(role='agent').first()
    if agent:
        clients_count = CustomUser.objects.filter(assigned_agent=agent).count()
        print(f"\n  Agente ejemplo: {agent.full_name}")
        print(f"    • Clientes asignados: {clients_count}")
        print(f"    • Ganancia: {agent.agent_profit}%")
    
    return total > 0

def test_products():
    """Verificar productos"""
    print("\n🔍 PRUEBA 2: Verificando productos...")
    
    total = Product.objects.count()
    in_stock = Product.objects.filter(stock__gt=0).count()
    categories = Product.objects.values_list('category', flat=True).distinct()
    
    print(f"  ✓ Total productos: {total}")
    print(f"  ✓ Con stock: {in_stock}")
    print(f"  ✓ Categorías: {', '.join(categories)}")
    
    # Mostrar algunos productos
    products = Product.objects.all()[:3]
    print(f"\n  Productos de ejemplo:")
    for p in products:
        print(f"    • {p.name}: ${p.price} (Stock: {p.stock})")
    
    return total > 0

def test_orders():
    """Verificar órdenes"""
    print("\n🔍 PRUEBA 3: Verificando órdenes...")
    
    total = Order.objects.count()
    pending = Order.objects.filter(status='pending').count()
    processing = Order.objects.filter(status='processing').count()
    completed = Order.objects.filter(status='completed').count()
    
    print(f"  ✓ Total órdenes: {total}")
    print(f"  ✓ Pendientes: {pending}")
    print(f"  ✓ En proceso: {processing}")
    print(f"  ✓ Completadas: {completed}")
    
    # Verificar una orden completa
    order = Order.objects.first()
    if order:
        items_count = ProductBuyed.objects.filter(order=order).count()
        print(f"\n  Orden ejemplo #{order.id}:")
        print(f"    • Cliente: {order.client.full_name}")
        print(f"    • Items: {items_count}")
        print(f"    • Total: ${order.total_price}")
        print(f"    • Estado: {order.get_status_display()}")
        
        # Verificar que la orden tiene agente asignado al cliente
        if order.client.assigned_agent:
            print(f"    • Agente del cliente: {order.client.assigned_agent.full_name}")
        else:
            print(f"    • Sin agente asignado")
    
    return total > 0

def test_products_bought():
    """Verificar productos comprados"""
    print("\n🔍 PRUEBA 4: Verificando productos comprados...")
    
    total = ProductBuyed.objects.count()
    total_value = sum(pb.total_price for pb in ProductBuyed.objects.all())
    
    print(f"  ✓ Total items comprados: {total}")
    print(f"  ✓ Valor total: ${total_value}")
    
    # Mostrar algunos items
    items = ProductBuyed.objects.select_related('order', 'product')[:3]
    print(f"\n  Items de ejemplo:")
    for item in items:
        print(f"    • {item.product.name} x{item.quantity} = ${item.total_price}")
        print(f"      Orden #{item.order.id} - {item.order.client.full_name}")
    
    return total > 0

def test_packages():
    """Verificar paquetes"""
    print("\n🔍 PRUEBA 5: Verificando paquetes...")
    
    total = Package.objects.count()
    pending = Package.objects.filter(status='pending').count()
    in_transit = Package.objects.filter(status='in_transit').count()
    delivered = Package.objects.filter(status='delivered').count()
    
    print(f"  ✓ Total paquetes: {total}")
    print(f"  ✓ Pendientes: {pending}")
    print(f"  ✓ En tránsito: {in_transit}")
    print(f"  ✓ Entregados: {delivered}")
    
    # Mostrar algunos paquetes
    packages = Package.objects.select_related('order', 'order__client')[:3]
    print(f"\n  Paquetes de ejemplo:")
    for pkg in packages:
        print(f"    • Tracking: {pkg.tracking_number}")
        print(f"      Cliente: {pkg.order.client.full_name}")
        print(f"      Estado: {pkg.get_status_display()}")
        print(f"      Peso: {pkg.weight} kg")
    
    return total > 0

def test_deliveries():
    """Verificar deliveries"""
    print("\n🔍 PRUEBA 6: Verificando deliveries...")
    
    total = DeliverReceip.objects.count()
    pending = DeliverReceip.objects.filter(payment_status='pending').count()
    completed = DeliverReceip.objects.filter(payment_status='completed').count()
    
    total_revenue = sum(d.total_cost for d in DeliverReceip.objects.all())
    total_agent_profit = sum(d.agent_profit for d in DeliverReceip.objects.all())
    
    print(f"  ✓ Total deliveries: {total}")
    print(f"  ✓ Pagos pendientes: {pending}")
    print(f"  ✓ Pagos completados: {completed}")
    print(f"  ✓ Ingresos totales: ${total_revenue}")
    print(f"  ✓ Ganancia agentes: ${total_agent_profit}")
    
    # Mostrar algunos deliveries con detalle
    deliveries = DeliverReceip.objects.select_related('client', 'package')[:3]
    print(f"\n  Deliveries de ejemplo:")
    for delivery in deliveries:
        print(f"    • Cliente: {delivery.client.full_name}")
        print(f"      Tracking: {delivery.package.tracking_number}")
        print(f"      Total: ${delivery.total_cost}")
        print(f"      Ganancia agente: ${delivery.agent_profit}")
        print(f"      Pago: {delivery.get_payment_status_display()}")
        
        if delivery.client.assigned_agent:
            print(f"      Agente: {delivery.client.assigned_agent.full_name}")
    
    return total > 0

def test_relationships():
    """Verificar integridad de relaciones"""
    print("\n🔍 PRUEBA 7: Verificando relaciones entre modelos...")
    
    # Verificar que todas las órdenes tienen cliente y productos
    orders = Order.objects.all()
    orders_with_issues = []
    
    for order in orders:
        issues = []
        
        if not order.client:
            issues.append("sin cliente")
        
        items = ProductBuyed.objects.filter(order=order)
        if not items.exists():
            issues.append("sin productos")
        
        if issues:
            orders_with_issues.append((order.id, issues))
    
    if orders_with_issues:
        print(f"  ⚠ Órdenes con problemas: {len(orders_with_issues)}")
        for order_id, issues in orders_with_issues[:3]:
            print(f"    • Orden #{order_id}: {', '.join(issues)}")
    else:
        print(f"  ✓ Todas las órdenes tienen cliente y productos")
    
    # Verificar que todos los paquetes tienen orden
    packages_without_order = Package.objects.filter(order__isnull=True).count()
    print(f"  ✓ Paquetes sin orden: {packages_without_order}")
    
    # Verificar que todos los deliveries tienen cliente y paquete
    deliveries = DeliverReceip.objects.all()
    deliveries_with_issues = 0
    
    for delivery in deliveries:
        if not delivery.client or not delivery.package:
            deliveries_with_issues += 1
    
    print(f"  ✓ Deliveries con problemas: {deliveries_with_issues}")
    
    return len(orders_with_issues) == 0 and packages_without_order == 0 and deliveries_with_issues == 0

def test_agent_profit_calculation():
    """Verificar cálculo de ganancias de agente"""
    print("\n🔍 PRUEBA 8: Verificando cálculo de ganancias...")
    
    # Obtener deliveries con agente
    deliveries_with_agent = DeliverReceip.objects.filter(
        client__assigned_agent__isnull=False
    ).select_related('client', 'client__assigned_agent')
    
    print(f"  Total deliveries con agente: {deliveries_with_agent.count()}")
    
    # Verificar algunos cálculos
    correct_calculations = 0
    incorrect_calculations = 0
    
    for delivery in deliveries_with_agent[:5]:
        agent = delivery.client.assigned_agent
        expected_profit = (delivery.total_cost * Decimal(str(agent.agent_profit))) / Decimal('100')
        
        # Permitir pequeña diferencia por redondeo
        diff = abs(delivery.agent_profit - expected_profit)
        
        if diff < Decimal('0.01'):
            correct_calculations += 1
        else:
            incorrect_calculations += 1
            print(f"  ⚠ Delivery #{delivery.id}: esperado ${expected_profit}, actual ${delivery.agent_profit}")
    
    print(f"  ✓ Cálculos correctos: {correct_calculations}")
    print(f"  ✓ Cálculos incorrectos: {incorrect_calculations}")
    
    # Resumen por agente
    print(f"\n  Ganancias por agente:")
    agents = CustomUser.objects.filter(role='agent')
    for agent in agents:
        clients = CustomUser.objects.filter(assigned_agent=agent)
        deliveries = DeliverReceip.objects.filter(client__in=clients)
        total_profit = sum(d.agent_profit for d in deliveries)
        
        print(f"    • {agent.full_name}: ${total_profit} ({deliveries.count()} entregas)")
    
    return incorrect_calculations == 0

def test_data_integrity():
    """Verificar integridad general de datos"""
    print("\n🔍 PRUEBA 9: Verificando integridad de datos...")
    
    # Verificar que no hay precios negativos
    negative_prices = Product.objects.filter(price__lt=0).count()
    print(f"  ✓ Productos con precio negativo: {negative_prices}")
    
    # Verificar que no hay stock negativo
    negative_stock = Product.objects.filter(stock__lt=0).count()
    print(f"  ✓ Productos con stock negativo: {negative_stock}")
    
    # Verificar que no hay cantidades negativas
    negative_quantity = ProductBuyed.objects.filter(quantity__lt=0).count()
    print(f"  ✓ Items con cantidad negativa: {negative_quantity}")
    
    # Verificar que los totales de órdenes coinciden con sus items
    orders_mismatch = 0
    for order in Order.objects.all()[:10]:
        items_total = sum(pb.total_price for pb in ProductBuyed.objects.filter(order=order))
        if abs(order.total_price - items_total) > Decimal('0.01'):
            orders_mismatch += 1
    
    print(f"  ✓ Órdenes con total incorrecto: {orders_mismatch}")
    
    return (negative_prices == 0 and negative_stock == 0 and 
            negative_quantity == 0 and orders_mismatch == 0)

# Ejecutar todas las pruebas
try:
    results = []
    
    results.append(("Usuarios", test_users()))
    results.append(("Productos", test_products()))
    results.append(("Órdenes", test_orders()))
    results.append(("Productos comprados", test_products_bought()))
    results.append(("Paquetes", test_packages()))
    results.append(("Deliveries", test_deliveries()))
    results.append(("Relaciones", test_relationships()))
    results.append(("Cálculo de ganancias", test_agent_profit_calculation()))
    results.append(("Integridad de datos", test_data_integrity()))
    
    print("\n" + "="*70)
    print("RESUMEN DE PRUEBAS")
    print("="*70)
    
    all_passed = True
    for name, result in results:
        status = "✅ PASÓ" if result else "❌ FALLÓ"
        print(f"  {name}: {status}")
        if not result:
            all_passed = False
    
    # Estadísticas finales
    print("\n" + "="*70)
    print("ESTADÍSTICAS FINALES")
    print("="*70)
    
    print(f"\n  📊 Resumen de datos:")
    print(f"    • Usuarios: {CustomUser.objects.count()}")
    print(f"    • Productos: {Product.objects.count()}")
    print(f"    • Órdenes: {Order.objects.count()}")
    print(f"    • Items: {ProductBuyed.objects.count()}")
    print(f"    • Paquetes: {Package.objects.count()}")
    print(f"    • Deliveries: {DeliverReceip.objects.count()}")
    
    total_sales = sum(o.total_price for o in Order.objects.all())
    total_deliveries = sum(d.total_cost for d in DeliverReceip.objects.all())
    total_agent_profit = sum(d.agent_profit for d in DeliverReceip.objects.all())
    
    print(f"\n  💰 Resumen financiero:")
    print(f"    • Total ventas: ${total_sales}")
    print(f"    • Total deliveries: ${total_deliveries}")
    print(f"    • Ganancia agentes: ${total_agent_profit}")
    
    print("\n" + "="*70)
    if all_passed:
        print("✅ TODAS LAS PRUEBAS PASARON - SISTEMA FUNCIONANDO CORRECTAMENTE")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON - REVISAR ERRORES")
    print("="*70)
    
except Exception as e:
    print(f"\n❌ ERROR DURANTE LAS PRUEBAS: {e}")
    import traceback
    traceback.print_exc()
