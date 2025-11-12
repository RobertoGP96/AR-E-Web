#!/usr/bin/env python
"""
Script de verificación del cálculo de ingresos.
Este script verifica que los ingresos se calculen correctamente sumando:
1. El costo total de todos los productos en pedidos pagados
2. El cobro al cliente de todas las entregas
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Order, DeliverReceip, Product
from api.enums import PaymentStatusEnum
from django.db.models import Sum
from datetime import datetime, timedelta

def test_revenue_calculation():
    """Prueba el cálculo de ingresos"""
    
    print("=" * 80)
    print("VERIFICACIÓN DEL CÁLCULO DE INGRESOS")
    print("=" * 80)
    print()
    
    # 1. Calcular ingresos de productos
    print("1. INGRESOS DE PRODUCTOS")
    print("-" * 80)
    
    paid_orders = Order.objects.filter(pay_status=PaymentStatusEnum.PAGADO.value)
    print(f"   Total de pedidos pagados: {paid_orders.count()}")
    
    revenue_products = paid_orders.aggregate(
        total=Sum('products__total_cost')
    )['total'] or 0
    
    print(f"   Ingresos de productos: ${revenue_products:,.2f}")
    print()
    
    # 2. Calcular ingresos de entregas
    print("2. INGRESOS DE ENTREGAS")
    print("-" * 80)
    
    all_deliveries = DeliverReceip.objects.all()
    print(f"   Total de entregas: {all_deliveries.count()}")
    
    revenue_deliveries = sum(float(d.client_charge) for d in all_deliveries)
    
    print(f"   Ingresos de entregas: ${revenue_deliveries:,.2f}")
    print()
    
    # 3. Calcular ingresos totales
    print("3. INGRESOS TOTALES")
    print("-" * 80)
    
    total_revenue = revenue_products + revenue_deliveries
    
    print(f"   Ingresos totales: ${total_revenue:,.2f}")
    print()
    
    # 4. Desglose porcentual
    print("4. DESGLOSE PORCENTUAL")
    print("-" * 80)
    
    if total_revenue > 0:
        products_percentage = (revenue_products / total_revenue) * 100
        deliveries_percentage = (revenue_deliveries / total_revenue) * 100
        
        print(f"   Productos:  {products_percentage:.2f}%")
        print(f"   Entregas:   {deliveries_percentage:.2f}%")
    else:
        print("   No hay ingresos registrados")
    print()
    
    # 5. Verificación por mes (últimos 3 meses)
    print("5. VERIFICACIÓN POR MES (Últimos 3 meses)")
    print("-" * 80)
    
    today = datetime.now().date()
    
    for i in range(3):
        if i == 0:
            month_start = today.replace(day=1)
            month_end = today
        else:
            # Calcular mes anterior
            if month_start.month == 1:
                month_start = month_start.replace(year=month_start.year - 1, month=12, day=1)
            else:
                month_start = month_start.replace(month=month_start.month - 1, day=1)
            
            # Calcular último día del mes
            if month_start.month == 12:
                month_end = month_start.replace(day=31)
            else:
                next_month = month_start.replace(month=month_start.month + 1, day=1)
                month_end = next_month - timedelta(days=1)
        
        # Ingresos de productos del mes
        revenue_products_month = Order.objects.filter(
            pay_status=PaymentStatusEnum.PAGADO.value,
            created_at__date__gte=month_start,
            created_at__date__lte=month_end
        ).aggregate(total=Sum('products__total_cost'))['total'] or 0
        
        # Ingresos de entregas del mes
        deliveries_month = DeliverReceip.objects.filter(
            deliver_date__gte=month_start,
            deliver_date__lte=month_end
        )
        revenue_deliveries_month = sum(float(d.client_charge) for d in deliveries_month)
        
        # Total del mes
        total_revenue_month = revenue_products_month + revenue_deliveries_month
        
        month_name = month_start.strftime("%B %Y")
        print(f"\n   {month_name}:")
        print(f"   - Productos:  ${revenue_products_month:,.2f}")
        print(f"   - Entregas:   ${revenue_deliveries_month:,.2f}")
        print(f"   - TOTAL:      ${total_revenue_month:,.2f}")
    
    print()
    print("=" * 80)
    print("VERIFICACIÓN COMPLETADA")
    print("=" * 80)
    
    return {
        'revenue_products': revenue_products,
        'revenue_deliveries': revenue_deliveries,
        'total_revenue': total_revenue
    }

def test_delivery_charges():
    """Prueba el cálculo de cobros de entrega"""
    
    print("\n" + "=" * 80)
    print("VERIFICACIÓN DE COBROS DE ENTREGA")
    print("=" * 80)
    print()
    
    deliveries = DeliverReceip.objects.all()[:10]  # Primeras 10 entregas
    
    print(f"Mostrando primeras {min(10, DeliverReceip.objects.count())} entregas:")
    print("-" * 80)
    print(f"{'ID':<5} {'Cliente':<20} {'Peso':<8} {'Cobro':<12} {'Gastos':<12} {'Profit Agente':<15}")
    print("-" * 80)
    
    for delivery in deliveries:
        print(f"{delivery.id:<5} "
              f"{delivery.client.full_name[:20]:<20} "
              f"{delivery.weight:<8.2f} "
              f"${delivery.client_charge:<11,.2f} "
              f"${delivery.delivery_expenses:<11,.2f} "
              f"${delivery.manager_profit:<14,.2f}")
    
    print()

if __name__ == '__main__':
    # Ejecutar pruebas
    results = test_revenue_calculation()
    test_delivery_charges()
    
    print("\nResultados guardados para referencia:")
    print(f"  - Ingresos de Productos: ${results['revenue_products']:,.2f}")
    print(f"  - Ingresos de Entregas:  ${results['revenue_deliveries']:,.2f}")
    print(f"  - Ingresos Totales:      ${results['total_revenue']:,.2f}")
