#!/usr/bin/env python
"""
Script para verificar que el endpoint /api_data/dashboard/stats/ 
devuelve métricas consistentes y sin problemas de recálculo de estados.

Este script verifica directamente la lógica que se usa en el endpoint
para asegurar que devuelve datos correctos.
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

def verify_dashboard_logic():
    """Verifica la lógica del dashboard sin necesidad de autenticación"""
    print_header("🎯 VERIFICACIÓN DE LA LÓGICA DEL DASHBOARD")
    
    # Simular la lógica del DashboardMetricsView
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)
    
    issues = []
    
    # PRODUCTOS
    print_section("📦 MÉTRICA: PRODUCTOS")
    
    products_metrics = {
        'total': Product.objects.count(),
        'ordered': Product.objects.filter(order__isnull=False).count(),
        'purchased': Product.objects.filter(status='Comprado').count(),
        'received': Product.objects.filter(status='Recibido').count(),
        'delivered': Product.objects.filter(status='Entregado').count(),
    }
    
    for key, value in products_metrics.items():
        print(f"  {key:15} -> {value}")
    
    # Verificar que no hay discrepancias
    total_by_status = (
        products_metrics['purchased'] + 
        products_metrics['received'] + 
        products_metrics['delivered'] +
        Product.objects.filter(status='Encargado').count() +
        Product.objects.filter(status='Cancelado').count()
    )
    
    if total_by_status != products_metrics['total']:
        issues.append({
            'metric': 'productos',
            'problem': f'Total ({products_metrics["total"]}) ≠ Suma de estados ({total_by_status})'
        })
        print(f"\n  ✗ ERROR: Total no coincide con suma de estados")
    else:
        print(f"\n  ✓ Total coincide con suma de estados")
    
    # ÓRDENES
    print_section("📋 MÉTRICA: ÓRDENES")
    
    orders_metrics = {
        'total': Order.objects.count(),
        'pending': Order.objects.filter(status='Encargado').count(),
        'completed': Order.objects.filter(status='Completado').count(),
        'today': Order.objects.filter(created_at__gte=today_start).count(),
        'this_week': Order.objects.filter(created_at__gte=week_start).count(),
        'this_month': Order.objects.filter(created_at__gte=month_start).count(),
    }
    
    for key, value in orders_metrics.items():
        print(f"  {key:15} -> {value}")
    
    # Verificar que pending + completed ≈ total (puede haber canceladas)
    accounted_orders = orders_metrics['pending'] + orders_metrics['completed'] + Order.objects.filter(status='Cancelado').count() + Order.objects.filter(status='Procesando').count()
    
    if accounted_orders != orders_metrics['total']:
        issues.append({
            'metric': 'órdenes',
            'problem': f'Total ({orders_metrics["total"]}) ≠ Suma de estados ({accounted_orders})'
        })
        print(f"\n  ✗ ERROR: Total no coincide")
    else:
        print(f"\n  ✓ Total coincide con suma de estados")
    
    # ENTREGAS
    print_section("📦 MÉTRICA: ENTREGAS")
    
    deliveries_metrics = {
        'total': DeliverReceip.objects.count(),
        'pending': DeliverReceip.objects.filter(status='Pendiente').count(),
        'in_transit': DeliverReceip.objects.filter(status='En transito').count(),
        'delivered': DeliverReceip.objects.filter(status='Entregado').count(),
    }
    
    for key, value in deliveries_metrics.items():
        print(f"  {key:15} -> {value}")
    
    # Verificar entregas
    total_delivery_status = (
        deliveries_metrics['pending'] + 
        deliveries_metrics['in_transit'] + 
        deliveries_metrics['delivered'] +
        DeliverReceip.objects.filter(status='Fallida').count()
    )
    
    if total_delivery_status != deliveries_metrics['total']:
        issues.append({
            'metric': 'entregas',
            'problem': f'Total ({deliveries_metrics["total"]}) ≠ Suma de estados ({total_delivery_status})'
        })
        print(f"\n  ✗ ERROR: Total no coincide")
    else:
        print(f"\n  ✓ Total coincide con suma de estados")
    
    return issues
        
        if data.get('success'):
            print("✓ Response exitoso\n")
            
            dashboard_data = data.get('data', {})
            
            # Extraer métricas de productos
            products_metrics = dashboard_data.get('products', {})
            
            print_section("📊 MÉTRICAS DE PRODUCTOS (del endpoint)")
            print(f"Total: {products_metrics.get('total')}")
            print(f"Comprado: {products_metrics.get('purchased')}")
            print(f"Recibido: {products_metrics.get('received')}")
            print(f"Entregado: {products_metrics.get('delivered')}")
            print(f"Encargado: {products_metrics.get('ordered')}")
            
            # Verificar contra BD
            print_section("📊 VERIFICACIÓN CONTRA BASE DE DATOS")
            
            bd_total = Product.objects.count()
            bd_purchased = Product.objects.filter(status='Comprado').count()
            bd_received = Product.objects.filter(status='Recibido').count()
            bd_delivered = Product.objects.filter(status='Entregado').count()
            bd_ordered = Product.objects.filter(order__isnull=False).count()
            
            print(f"BD Total: {bd_total}")
            print(f"BD Comprado: {bd_purchased}")
            print(f"BD Recibido: {bd_received}")
            print(f"BD Entregado: {bd_delivered}")
            print(f"BD Ordenado: {bd_ordered}")
            
            # Comparar
            print_section("🔍 COMPARACIÓN")
            
            comparisons = [
                ('Total', products_metrics.get('total'), bd_total),
                ('Comprado', products_metrics.get('purchased'), bd_purchased),
                ('Recibido', products_metrics.get('received'), bd_received),
                ('Entregado', products_metrics.get('delivered'), bd_delivered),
                ('Ordenado', products_metrics.get('ordered'), bd_ordered),
            ]
            
            issues = []
            for name, endpoint_val, bd_val in comparisons:
                match = endpoint_val == bd_val
                mark = "✓" if match else "✗"
                print(f"{mark} {name:12} -> Endpoint: {endpoint_val} | BD: {bd_val}")
                
                if not match:
                    issues.append({
                        'metric': name,
                        'endpoint': endpoint_val,
                        'database': bd_val
                    })
            
            # Métricas de órdenes
            print_section("📦 MÉTRICAS DE ÓRDENES")
            
            orders_metrics = dashboard_data.get('orders', {})
            print(f"Total: {orders_metrics.get('total')}")
            print(f"Pendiente: {orders_metrics.get('pending')}")
            print(f"Completado: {orders_metrics.get('completed')}")
            
            # Verificar órdenes
            bd_orders_total = Order.objects.count()
            bd_orders_pending = Order.objects.filter(status='Encargado').count()
            bd_orders_completed = Order.objects.filter(status='Completado').count()
            
            print_section("🔍 COMPARACIÓN ÓRDENES")
            
            order_comparisons = [
                ('Total', orders_metrics.get('total'), bd_orders_total),
                ('Pendiente', orders_metrics.get('pending'), bd_orders_pending),
                ('Completado', orders_metrics.get('completed'), bd_orders_completed),
            ]
            
            for name, endpoint_val, bd_val in order_comparisons:
                match = endpoint_val == bd_val
                mark = "✓" if match else "✗"
                print(f"{mark} {name:12} -> Endpoint: {endpoint_val} | BD: {bd_val}")
                
                if not match:
                    issues.append({
                        'metric': f'Order-{name}',
                        'endpoint': endpoint_val,
                        'database': bd_val
                    })
            
            return issues
        else:
            print("✗ Response no exitoso")
            print(f"Mensaje: {data.get('message')}")
            return [{'error': 'Response no exitoso'}]
    else:
        print(f"✗ Error en la request: {response.status_code}")
        print(response.data if hasattr(response, 'data') else str(response)[:500])
        return [{'error': f'HTTP {response.status_code}'}]

def main():
    """Ejecuta la verificación"""
    
    try:
        issues = verify_dashboard_endpoint()
        
        print_header("📊 RESUMEN FINAL")
        
        if issues:
            print(f"⚠️  Se encontraron {len(issues)} discrepancias:\n")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print("✓ EXCELENTE: El endpoint devuelve datos consistentes con la BD")
            print("\n  ✓ Las métricas de productos son correctas")
            print("  ✓ Las métricas de órdenes son correctas")
            print("  ✓ No hay problemas de recálculo de estados")
        
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
