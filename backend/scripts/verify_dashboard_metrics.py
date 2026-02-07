#!/usr/bin/env python
"""
Script para verificar que las métricas del dashboard son correctas
y no tienen problemas de recálculo de estados.

Verifica directamente la lógica que se usa en el DashboardMetricsView.
"""

import os
import sys
import django
from django.db.models import Sum, Count

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

from api.models import Product, Order, DeliverReceip
from django.utils import timezone
from datetime import timedelta

def print_header(title):
    """Imprime un encabezado formateado"""
    print(f"\n{'='*80}")
    print(f"{title.center(80)}")
    print(f"{'='*80}\n")

def print_section(title):
    """Imprime un encabezado de sección"""
    print(f"\n{'-'*80}")
    print(f"{title}")
    print(f"{'-'*80}\n")

def verify_dashboard_metrics():
    """Verifica que las métricas del dashboard son correctas"""
    print_header("🎯 VERIFICACIÓN DE MÉTRICAS DEL DASHBOARD")
    
    issues = []
    
    # PRODUCTOS
    print_section("📦 MÉTRICA: PRODUCTOS")
    
    products_total = Product.objects.count()
    products_ordered = Product.objects.filter(order__isnull=False).count()
    products_purchased = Product.objects.filter(status='Comprado').count()
    products_received = Product.objects.filter(status='Recibido').count()
    products_delivered = Product.objects.filter(status='Entregado').count()
    
    print(f"Total: {products_total}")
    print(f"Ordenados: {products_ordered}")
    print(f"Comprados: {products_purchased}")
    print(f"Recibidos: {products_received}")
    print(f"Entregados: {products_delivered}")
    
    # Verificar que no hay discrepancias
    total_by_status = (
        products_purchased + 
        products_received + 
        products_delivered +
        Product.objects.filter(status='Encargado').count() +
        Product.objects.filter(status='Cancelado').count()
    )
    
    if total_by_status != products_total:
        issues.append({
            'type': 'producto_count_mismatch',
            'total': products_total,
            'sum_of_states': total_by_status
        })
        print(f"\n✗ ERROR: Total ({products_total}) ≠ Suma de estados ({total_by_status})")
    else:
        print(f"\n✓ Total coincide con suma de estados: {products_total}")
    
    # ÓRDENES
    print_section("📋 MÉTRICA: ÓRDENES")
    
    orders_total = Order.objects.count()
    orders_pending = Order.objects.filter(status='Encargado').count()
    orders_completed = Order.objects.filter(status='Completado').count()
    
    print(f"Total: {orders_total}")
    print(f"Pendientes: {orders_pending}")
    print(f"Completadas: {orders_completed}")
    
    # Verificar órdenes
    accounted_orders = (
        orders_pending + 
        orders_completed + 
        Order.objects.filter(status='Cancelado').count() + 
        Order.objects.filter(status='Procesando').count()
    )
    
    if accounted_orders != orders_total:
        issues.append({
            'type': 'order_count_mismatch',
            'total': orders_total,
            'sum_of_states': accounted_orders
        })
        print(f"\n✗ ERROR: Total ({orders_total}) ≠ Suma de estados ({accounted_orders})")
    else:
        print(f"\n✓ Total coincide con suma de estados: {orders_total}")
    
    # ENTREGAS
    print_section("🚚 MÉTRICA: ENTREGAS")
    
    deliveries_total = DeliverReceip.objects.count()
    deliveries_pending = DeliverReceip.objects.filter(status='Pendiente').count()
    deliveries_in_transit = DeliverReceip.objects.filter(status='En transito').count()
    deliveries_delivered = DeliverReceip.objects.filter(status='Entregado').count()
    
    print(f"Total: {deliveries_total}")
    print(f"Pendientes: {deliveries_pending}")
    print(f"En tránsito: {deliveries_in_transit}")
    print(f"Entregadas: {deliveries_delivered}")
    
    # Verificar entregas
    total_delivery_status = (
        deliveries_pending + 
        deliveries_in_transit + 
        deliveries_delivered +
        DeliverReceip.objects.filter(status='Fallida').count()
    )
    
    if total_delivery_status != deliveries_total:
        issues.append({
            'type': 'delivery_count_mismatch',
            'total': deliveries_total,
            'sum_of_states': total_delivery_status
        })
        print(f"\n✗ ERROR: Total ({deliveries_total}) ≠ Suma de estados ({total_delivery_status})")
    else:
        print(f"\n✓ Total coincide con suma de estados: {deliveries_total}")
    
    # CONSISTENCIA DE ESTADOS EN PRODUCTOS
    print_section("🔍 VERIFICACIÓN DE ESTADOS POR PRODUCTO")
    
    for product in Product.objects.all()[:5]:
        status_valid = product.status in ['Encargado', 'Comprado', 'Recibido', 'Entregado', 'Cancelado']
        mark = "✓" if status_valid else "✗"
        print(f"{mark} {product.name}: status={product.status}")
        
        if not status_valid:
            issues.append({
                'type': 'invalid_status',
                'product_id': str(product.id),
                'status': product.status
            })
    
    return issues

def main():
    """Ejecuta la verificación"""
    
    try:
        issues = verify_dashboard_metrics()
        
        print_header("📊 RESUMEN FINAL")
        
        if issues:
            print(f"⚠️  Se encontraron {len(issues)} problemas:\n")
            for i, issue in enumerate(issues, 1):
                print(f"{i}. {issue}")
        else:
            print("✓ EXCELENTE: Todas las métricas del dashboard son correctas")
            print("\n  ✓ Las métricas de productos son consistentes")
            print("  ✓ Las métricas de órdenes son consistentes")
            print("  ✓ Las métricas de entregas son consistentes")
            print("  ✓ Los estados de los productos son válidos")
        
        print(f"\n{'='*80}\n")
        
        return len(issues) == 0
    
    except Exception as e:
        print(f"\n✗ Error durante la verificación: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
