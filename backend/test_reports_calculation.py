"""
Script para verificar los cálculos de reportes de ganancias
"""
import os
import django
import sys
from datetime import timedelta
from decimal import Decimal

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.db.models import Sum, Q
from api.models import Order, Product, DeliverReceip, User, ShoppingReceip
from api.constants import PaymentStatusEnum, OrderStatusEnum

def test_reports_calculation():
    """Verifica los cálculos de reportes"""
    
    print("\n" + "="*80)
    print("VERIFICACIÓN DE CÁLCULOS DE REPORTES DE GANANCIAS")
    print("="*80 + "\n")
    
    # Obtener el mes actual
    now = timezone.now()
    current_date = now.date()
    month_start = current_date.replace(day=1)
    month_end = current_date
    
    print(f"📅 Periodo analizado: {month_start} hasta {month_end}\n")
    
    # 1. INGRESOS DE PRODUCTOS
    print("1️⃣  INGRESOS DE PRODUCTOS")
    print("-" * 80)
    
    # Filtrar órdenes pagadas
    paid_orders = Order.objects.filter(
        pay_status=PaymentStatusEnum.PAGADO.value
    )
    
    print(f"   Total de órdenes pagadas en el sistema: {paid_orders.count()}")
    
    # Productos de órdenes pagadas en el rango de fechas
    products_in_paid_orders = Product.objects.filter(
        order__pay_status=PaymentStatusEnum.PAGADO.value,
        created_at__date__gte=month_start,
        created_at__date__lte=month_end
    )
    
    print(f"   Productos en órdenes pagadas (creados este mes): {products_in_paid_orders.count()}")
    
    # Calcular ingreso por productos
    revenue_products = sum(float(p.total_cost) for p in products_in_paid_orders)
    
    print(f"   💰 Ingresos por productos: ${revenue_products:,.2f}")
    
    # Mostrar detalle de algunos productos
    print("\n   📦 Detalle de productos (primeros 5):")
    for p in products_in_paid_orders[:5]:
        print(f"      - {p.name}: ${p.total_cost:,.2f} (Orden #{p.order.pk}, Creado: {p.created_at.date()})")
    
    # 2. INGRESOS DE ENTREGAS
    print("\n2️⃣  INGRESOS DE ENTREGAS")
    print("-" * 80)
    
    deliveries_in_month = DeliverReceip.objects.filter(
        deliver_date__gte=month_start,
        deliver_date__lte=month_end
    )
    
    print(f"   Total de entregas en el mes: {deliveries_in_month.count()}")
    
    revenue_deliveries = sum(float(d.client_charge) for d in deliveries_in_month)
    
    print(f"   💰 Ingresos por entregas (cobro al cliente): ${revenue_deliveries:,.2f}")
    
    # Mostrar detalle de algunas entregas
    print("\n   📦 Detalle de entregas (primeras 5):")
    for d in deliveries_in_month[:5]:
        print(f"      - Cliente: {d.client.full_name}, Peso: {d.weight}lbs, Cobro: ${d.client_charge:,.2f}, Fecha: {d.deliver_date}")
    
    # 3. TOTAL DE INGRESOS
    print("\n3️⃣  TOTAL DE INGRESOS")
    print("-" * 80)
    total_revenue = revenue_products + revenue_deliveries
    print(f"   💵 INGRESOS TOTALES: ${total_revenue:,.2f}")
    print(f"      └─ Productos: ${revenue_products:,.2f}")
    print(f"      └─ Entregas: ${revenue_deliveries:,.2f}")
    
    # 4. GASTOS DEL SISTEMA
    print("\n4️⃣  GASTOS DEL SISTEMA")
    print("-" * 80)
    
    # Gastos de productos
    product_expenses = sum(float(p.system_expenses) for p in products_in_paid_orders)
    print(f"   💸 Gastos de productos: ${product_expenses:,.2f}")
    
    # Gastos operativos de compras
    purchases_in_month = ShoppingReceip.objects.filter(
        buy_date__gte=month_start,
        buy_date__lte=month_end
    )
    purchase_operational_expenses = sum(float(p.operational_expenses) for p in purchases_in_month)
    print(f"   💸 Gastos operativos de compras: ${purchase_operational_expenses:,.2f}")
    
    # Gastos de entrega
    delivery_expenses = sum(float(d.delivery_expenses) for d in deliveries_in_month)
    print(f"   💸 Gastos de entrega: ${delivery_expenses:,.2f}")
    
    total_expenses = product_expenses + purchase_operational_expenses + delivery_expenses
    print(f"\n   💸 GASTOS TOTALES: ${total_expenses:,.2f}")
    
    # 5. GANANCIAS DE AGENTES
    print("\n5️⃣  GANANCIAS DE AGENTES")
    print("-" * 80)
    agent_profits = sum(float(d.agent_profit_calculated) for d in deliveries_in_month)
    print(f"   💰 Ganancias de agentes: ${agent_profits:,.2f}")
    
    # 6. GANANCIA DEL SISTEMA
    print("\n6️⃣  GANANCIA DEL SISTEMA")
    print("-" * 80)
    system_profit = total_revenue - total_expenses - agent_profits
    print(f"   ✅ GANANCIA DEL SISTEMA: ${system_profit:,.2f}")
    print(f"      └─ Ingresos: ${total_revenue:,.2f}")
    print(f"      └─ Gastos: ${total_expenses:,.2f}")
    print(f"      └─ Ganancia agentes: ${agent_profits:,.2f}")
    
    if total_revenue > 0:
        profit_margin = (system_profit / total_revenue) * 100
        print(f"   📊 Margen de ganancia: {profit_margin:.2f}%")
    
    # VERIFICACIÓN ADICIONAL: Todas las órdenes pagadas sin importar fecha
    print("\n\n" + "="*80)
    print("VERIFICACIÓN ADICIONAL: TODAS LAS ÓRDENES PAGADAS")
    print("="*80 + "\n")
    
    all_paid_orders = Order.objects.filter(pay_status=PaymentStatusEnum.PAGADO.value)
    print(f"Total de órdenes pagadas: {all_paid_orders.count()}")
    
    all_products_in_paid_orders = Product.objects.filter(
        order__pay_status=PaymentStatusEnum.PAGADO.value
    )
    print(f"Total de productos en órdenes pagadas: {all_products_in_paid_orders.count()}")
    
    total_revenue_all_products = sum(float(p.total_cost) for p in all_products_in_paid_orders)
    print(f"Ingresos totales de todos los productos pagados: ${total_revenue_all_products:,.2f}")
    
    # Todas las entregas
    all_deliveries = DeliverReceip.objects.all()
    print(f"\nTotal de entregas: {all_deliveries.count()}")
    
    total_revenue_all_deliveries = sum(float(d.client_charge) for d in all_deliveries)
    print(f"Ingresos totales de todas las entregas: ${total_revenue_all_deliveries:,.2f}")
    
    total_all = total_revenue_all_products + total_revenue_all_deliveries
    print(f"\n💵 INGRESOS TOTALES HISTÓRICOS: ${total_all:,.2f}")

if __name__ == "__main__":
    test_reports_calculation()
