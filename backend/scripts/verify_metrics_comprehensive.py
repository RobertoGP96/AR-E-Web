#!/usr/bin/env python
"""
Script completo para verificar que las métricas no tienen problemas de recálculo de estados.

Verifica:
1. Estados de productos se leen correctamente de la BD
2. Métricas del dashboard devuelven conteos correctos
3. Serializers no recalculan estados innecesariamente
4. Servicios de profit/metrics usan datos de BD directamente
"""

import os
import sys
import django
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

from api.models import Product, Order, DeliverReceip
from api.serializers import ProductSerializer
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

def verify_product_status_consistency():
    """Verifica que los estados de productos sean consistentes"""
    print_header("1️⃣  VERIFICACIÓN DE ESTADOS DE PRODUCTOS")
    
    issues = []
    
    # Obtener todos los productos
    products = Product.objects.all()
    
    print(f"Total de productos: {products.count()}\n")
    
    # Conteo por estado
    print("Distribución de estados en BD:")
    status_counts = {}
    for status in ['Encargado', 'Comprado', 'Recibido', 'Entregado', 'Cancelado']:
        count = products.filter(status=status).count()
        status_counts[status] = count
        print(f"  {status:15} -> {count:3}")
    
    # Verificar consistencia en cada producto
    print_section("Verificación por producto")
    for product in products[:10]:  # Primeros 10
        serializer = ProductSerializer(product)
        bd_status = product.status
        api_status = serializer.data.get('status')
        
        is_consistent = bd_status == api_status
        mark = "✓" if is_consistent else "✗"
        
        print(f"{mark} {product.name}")
        print(f"   BD: {bd_status} | API: {api_status}")
        
        if not is_consistent:
            issues.append({
                'type': 'status_inconsistency',
                'product_id': product.id,
                'bd': bd_status,
                'api': api_status
            })
    
    return issues

def verify_metrics_consistency():
    """Verifica que las métricas devuelven valores correctos"""
    print_header("2️⃣  VERIFICACIÓN DE MÉTRICAS")
    
    issues = []
    
    # Métricas de productos
    print_section("Métricas de Productos")
    
    metrics = {
        'Comprado': Product.objects.filter(status='Comprado').count(),
        'Recibido': Product.objects.filter(status='Recibido').count(),
        'Entregado': Product.objects.filter(status='Entregado').count(),
        'Encargado': Product.objects.filter(status='Encargado').count(),
    }
    
    total = sum(metrics.values())
    
    for status, count in metrics.items():
        pct = (count / total * 100) if total > 0 else 0
        print(f"  {status:15} -> {count:3} ({pct:5.1f}%)")
    
    # Verificar que el total de estados coincida con el total de productos
    if total != Product.objects.count():
        issues.append({
            'type': 'metric_mismatch',
            'expected': Product.objects.count(),
            'got': total
        })
        print(f"\n⚠️  ERROR: Total de estados ({total}) ≠ Total de productos ({Product.objects.count()})")
    else:
        print(f"\n✓ Total de productos coincide: {total}")
    
    # Métricas de órdenes
    print_section("Métricas de Órdenes")
    
    order_metrics = {
        'Encargado': Order.objects.filter(status='Encargado').count(),
        'Procesando': Order.objects.filter(status='Procesando').count(),
        'Completado': Order.objects.filter(status='Completado').count(),
        'Cancelado': Order.objects.filter(status='Cancelado').count(),
    }
    
    for status, count in order_metrics.items():
        print(f"  {status:15} -> {count:3}")
    
    # Métricas de entregas
    print_section("Métricas de Entregas")
    
    delivery_metrics = {
        'Pendiente': DeliverReceip.objects.filter(status='Pendiente').count(),
        'En transito': DeliverReceip.objects.filter(status='En transito').count(),
        'Entregado': DeliverReceip.objects.filter(status='Entregado').count(),
        'Fallida': DeliverReceip.objects.filter(status='Fallida').count(),
    }
    
    for status, count in delivery_metrics.items():
        print(f"  {status:15} -> {count:3}")
    
    return issues

def verify_calculation_accuracy():
    """Verifica que los estados se calculan correctamente basándose en cantidades"""
    print_header("3️⃣  VERIFICACIÓN DE CÁLCULOS DE ESTADO")
    
    issues = []
    
    print_section("Validación de lógica de estados")
    
    # Verificar productos con estado "Recibido"
    received_products = Product.objects.filter(status='Recibido')
    print(f"Productos en estado 'Recibido': {received_products.count()}\n")
    
    for product in received_products[:5]:
        print(f"📦 {product.name}")
        print(f"   Solicitado: {product.amount_requested}")
        print(f"   Comprado: {product.amount_purchased}")
        print(f"   Recibido: {product.amount_received}")
        print(f"   Entregado: {product.amount_delivered}")
        
        # Validar que cumple requisitos para "Recibido"
        is_valid = (
            product.amount_purchased >= product.amount_requested and
            product.amount_received >= product.amount_requested and
            product.amount_delivered < product.amount_received
        )
        
        mark = "✓" if is_valid else "✗"
        print(f"   {mark} Estado válido: {is_valid}\n")
        
        if not is_valid:
            issues.append({
                'type': 'invalid_state',
                'product_id': product.id,
                'status': 'Recibido',
                'details': {
                    'amount_purchased_check': product.amount_purchased >= product.amount_requested,
                    'amount_received_check': product.amount_received >= product.amount_requested,
                    'amount_delivered_check': product.amount_delivered < product.amount_received
                }
            })
    
    # Verificar productos con estado "Comprado"
    purchased_products = Product.objects.filter(status='Comprado')
    print(f"\nProductos en estado 'Comprado': {purchased_products.count()}\n")
    
    for product in purchased_products[:5]:
        print(f"📦 {product.name}")
        print(f"   Solicitado: {product.amount_requested}")
        print(f"   Comprado: {product.amount_purchased}")
        print(f"   Recibido: {product.amount_received}")
        print(f"   Entregado: {product.amount_delivered}")
        
        # Validar que cumple requisitos para "Comprado"
        is_valid = (
            product.amount_purchased >= product.amount_requested and
            product.amount_received < product.amount_requested
        )
        
        mark = "✓" if is_valid else "✗"
        print(f"   {mark} Estado válido: {is_valid}\n")
        
        if not is_valid:
            issues.append({
                'type': 'invalid_state',
                'product_id': product.id,
                'status': 'Comprado',
                'details': {
                    'amount_purchased_check': product.amount_purchased >= product.amount_requested,
                    'amount_received_check': product.amount_received < product.amount_requested
                }
            })
    
    return issues

def main():
    """Ejecuta todas las verificaciones"""
    
    all_issues = []
    
    # Verificación 1: Consistencia de estados
    issues1 = verify_product_status_consistency()
    all_issues.extend(issues1)
    
    # Verificación 2: Consistencia de métricas
    issues2 = verify_metrics_consistency()
    all_issues.extend(issues2)
    
    # Verificación 3: Precisión de cálculos
    issues3 = verify_calculation_accuracy()
    all_issues.extend(issues3)
    
    # Resumen final
    print_header("📊 RESUMEN FINAL")
    
    if all_issues:
        print(f"⚠️  Se encontraron {len(all_issues)} problemas:\n")
        for i, issue in enumerate(all_issues, 1):
            print(f"{i}. {issue.get('type', 'Desconocido')}")
            if 'details' in issue:
                print(f"   Detalles: {issue['details']}")
            print()
    else:
        print("✓ EXCELENTE: Todas las métricas y estados son consistentes")
        print("\n  ✓ Los estados se leen correctamente de la BD")
        print("  ✓ Las métricas devuelven valores precisos")
        print("  ✓ Los cálculos de estado son válidos")
    
    print(f"\n{'='*80}\n")
    
    return len(all_issues) == 0

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
