"""
Service: Client-specific financial reports
Provides detailed analysis of customer accounts, including outstanding balances and surplus.
"""
from typing import Dict, Any, List
from django.db import models
from django.db.models import Sum, Q, Subquery, OuterRef, F
from api.models import Order, DeliverReceip, CustomUser
from decimal import Decimal
from datetime import datetime

def get_client_balance_report(client_id: int) -> Dict[str, Any]:
    """
    Generates a financial report for a specific client.
    
    Args:
        client_id: ID of the client
        
    Returns:
        Dictionary containing client info, order details, delivery details, and overall summary.
    """
    try:
        client = CustomUser.objects.get(pk=client_id)
    except CustomUser.DoesNotExist:
        return {"error": f"Cliente con ID {client_id} no encontrado."}

    # 1. Orders Analysis
    orders = Order.objects.filter(client=client).order_by('-created_at')
    
    orders_list = []
    total_orders_cost = 0.0
    total_orders_received = 0.0
    
    for order in orders:
        total_orders_cost += float(order.total_costs or 0.0)
        total_orders_received += float(order.received_value_of_client or 0.0)
        
        orders_list.append({
            "id": order.id,
            "date": order.created_at.strftime('%Y-%m-%d'),
            "total_cost": float(order.total_costs or 0.0),
            "received": float(order.received_value_of_client or 0.0),
            "balance": float(order.balance),
            "status": order.status,
            "pay_status": order.pay_status
        })

    # 2. Deliveries (Shipping) Analysis
    deliveries = DeliverReceip.objects.filter(client=client).order_by('-deliver_date')
    
    deliveries_list = []
    total_shipping_cost = 0.0
    total_shipping_received = 0.0
    
    for delivery in deliveries:
        total_shipping_cost += float(delivery.weight_cost or 0.0)
        total_shipping_received += float(delivery.payment_amount or 0.0)
        
        deliveries_list.append({
            "id": delivery.id,
            "date": delivery.deliver_date.strftime('%Y-%m-%d'),
            "weight": float(delivery.weight or 0.0),
            "shipping_cost": float(delivery.weight_cost or 0.0),
            "received": float(delivery.payment_amount or 0.0),
            "status": delivery.status,
            "payment_status": delivery.payment_status,
            "category": delivery.category.name if delivery.category else "Sin categoría"
        })

    # 3. Overall Summary
    order_balance = total_orders_received - total_orders_cost
    shipping_balance = total_shipping_received - total_shipping_cost
    
    # Total balance considers both order balances and shipping balances
    total_balance = order_balance + shipping_balance
    
    status = "AL DÍA"
    if total_balance < -0.01: # Use a small epsilon for float precision
        status = "DEUDA"
    elif total_balance > 0.01:
        status = "SALDO A FAVOR"

    return {
        "client": {
            "id": client.id,
            "name": client.full_name,
            "phone": client.phone_number,
            "email": client.email,
            "agent_name": client.assigned_agent.full_name if client.assigned_agent else None,
            "balance": client.balance,
        },
        "orders": {
            "list": orders_list,
            "summary": {
                "total_cost": round(total_orders_cost, 2),
                "total_received": round(total_orders_received, 2),
                "balance": round(order_balance, 2)
            }
        },
        "deliveries": {
            "list": deliveries_list,
            "summary": {
                "total_shipping_cost": round(total_shipping_cost, 2),
                "total_shipping_received": round(total_shipping_received, 2),
                "balance": round(shipping_balance, 2)
            }
        },
        "report_summary": {
            "total_balance": round(total_balance, 2),
            "status": status,
            "pending_to_pay": round(abs(total_balance) if total_balance < 0 else 0.0, 2),
            "surplus_balance": round(total_balance if total_balance > 0 else 0.0, 2)
        }
    }


def get_all_clients_balances_summary() -> List[Dict[str, Any]]:
    """
    Generates a financial summary for all clients with their outstanding balances.
    
    Returns:
        List of dictionaries with summary data for each client.
    """
    # Subqueries to avoid Cartesian product and ensure accurate sums
    order_costs = Order.objects.filter(
        client=OuterRef('pk')
    ).values('client').annotate(
        total=Sum('total_costs')
    ).values('total')
    
    order_received = Order.objects.filter(
        client=OuterRef('pk')
    ).values('client').annotate(
        total=Sum('received_value_of_client')
    ).values('total')
    
    delivery_costs = DeliverReceip.objects.filter(
        client=OuterRef('pk')
    ).values('client').annotate(
        total=Sum('weight_cost')
    ).values('total')

    delivery_received = DeliverReceip.objects.filter(
        client=OuterRef('pk')
    ).values('client').annotate(
        total=Sum('payment_amount')
    ).values('total')

    # Query all clients and annotate with calculated sums
    clients = CustomUser.objects.filter(role='client').annotate(
        computed_order_cost=Subquery(order_costs, output_field=models.FloatField()),
        computed_order_received=Subquery(order_received, output_field=models.FloatField()),
        computed_deliver_cost=Subquery(delivery_costs, output_field=models.FloatField()),
        computed_deliver_received=Subquery(delivery_received, output_field=models.FloatField()),
    ).order_by('name', 'last_name')

    report = []
    for client in clients:
        order_cost = float(client.computed_order_cost or 0.0)
        order_received = float(client.computed_order_received or 0.0)
        deliver_cost = float(client.computed_deliver_cost or 0.0)
        deliver_received = float(client.computed_deliver_received or 0.0)
        client_balance = float(client.balance or 0.0)
        
        # Balance formula: (Order Received + Delivery Received) - (Order Cost + Delivery Cost)
        total_balance = (order_received + deliver_received) - (order_cost + deliver_cost)
        
        # Determine status
        if total_balance < -0.01:
            status = "DEUDA"
        elif total_balance > 0.01:
            status = "SALDO A FAVOR"
        else:
            status = "AL DÍA"

        report.append({
            "id": client.id,
            "name": client.full_name,
            "phone": client.phone_number,
            "email": client.email,
            "agent_name": client.agent_name,
            "balance": client_balance,
            "total_order_cost": round(order_cost, 2),
            "total_order_received": round(order_received, 2),
            "total_deliver_cost": round(deliver_cost, 2),
            "total_deliver_received": round(deliver_received, 2),
            "total_balance": round(total_balance, 2),
            "status": status,
            "pending_to_pay": round(abs(total_balance) if total_balance < 0 else 0.0, 2),
            "surplus_balance": round(total_balance if total_balance > 0 else 0.0, 2)
        })
    
    return report


def get_client_operations_statement(client_id: int) -> Dict[str, Any]:
    """
    Genera un estado de cuenta de operaciones del cliente ordenado por fecha.
    
    Cada transacción se registra como una operación separada:
    - Pedido: 2 operaciones (creación del pedido con costo, pago del pedido)
    - Entrega: 2 operaciones (creación de la entrega con costo, pago de la entrega)
    
    Args:
        client_id: ID del cliente
        
    Returns:
        Dictionary con el estado de cuenta detallado por operaciones
    """
    try:
        client = CustomUser.objects.get(pk=client_id)
    except CustomUser.DoesNotExist:
        return {"error": f"Cliente con ID {client_id} no encontrado."}

    operations = []
    running_balance = 0.0

    # 1. Operaciones de Pedidos - Creación (débito)
    orders = Order.objects.filter(client=client).order_by('created_at')
    for order in orders:
        if order.total_costs and order.total_costs > 0:
            operation_date = order.created_at
            operations.append({
                "id": f"order_{order.id}_creation",
                "date": operation_date.strftime('%Y-%m-%d %H:%M:%S'),
                "type": "PEDIDO",
                "description": f"Pedido #{order.id} - Creación",
                "debit": float(order.total_costs),
                "credit": 0.0,
                "balance": 0.0,  # Se calculará después
                "reference_id": order.id,
                "status": order.status,
                "payment_status": order.pay_status
            })

    # 2. Operaciones de Pedidos - Pagos (crédito)
    for order in orders:
        if order.received_value_of_client and order.received_value_of_client > 0:
            operation_date = order.payment_date if order.payment_date else order.created_at
            operations.append({
                "id": f"order_{order.id}_payment",
                "date": operation_date.strftime('%Y-%m-%d') + (" 12:00:00" if not order.payment_date else ""),
                "type": "PAGO PEDIDO",
                "description": f"Pago Pedido #{order.id}",
                "debit": 0.0,
                "credit": float(order.received_value_of_client),
                "balance": 0.0,  # Se calculará después
                "reference_id": order.id,
                "status": order.status,
                "payment_status": order.pay_status
            })

    # 3. Operaciones de Entregas - Creación (débito)
    deliveries = DeliverReceip.objects.filter(client=client).order_by('deliver_date')
    for delivery in deliveries:
        if delivery.weight_cost and delivery.weight_cost > 0:
            operation_date = delivery.deliver_date
            operations.append({
                "id": f"delivery_{delivery.id}_creation",
                "date": operation_date.strftime('%Y-%m-%d %H:%M:%S'),
                "type": "ENTREGA",
                "description": f"Entrega #{delivery.id} - Creación",
                "debit": float(delivery.weight_cost),
                "credit": 0.0,
                "balance": 0.0,  # Se calculará después
                "reference_id": delivery.id,
                "status": delivery.status,
                "payment_status": delivery.payment_status
            })

    # 4. Operaciones de Entregas - Pagos (crédito)
    for delivery in deliveries:
        if delivery.payment_amount and delivery.payment_amount > 0:
            operation_date = delivery.payment_date if delivery.payment_date else delivery.deliver_date
            operations.append({
                "id": f"delivery_{delivery.id}_payment",
                "date": operation_date.strftime('%Y-%m-%d %H:%M:%S') if delivery.payment_date else operation_date.strftime('%Y-%m-%d') + " 13:00:00",
                "type": "PAGO ENTREGA",
                "description": f"Pago Entrega #{delivery.id}",
                "debit": 0.0,
                "credit": float(delivery.payment_amount),
                "balance": 0.0,  # Se calculará después
                "reference_id": delivery.id,
                "status": delivery.status,
                "payment_status": delivery.payment_status
            })

    # Ordenar todas las operaciones por fecha
    operations.sort(key=lambda x: x['date'])

    # Calcular saldo acumulado
    for operation in operations:
        running_balance += operation['credit'] - operation['debit']
        operation['balance'] = round(running_balance, 2)

    # Calcular totales
    total_debits = sum(op['debit'] for op in operations)
    total_credits = sum(op['credit'] for op in operations)
    final_balance = total_credits - total_debits

    # Determinar estado final
    if final_balance < -0.01:
        status = "DEUDA"
    elif final_balance > 0.01:
        status = "SALDO A FAVOR"
    else:
        status = "AL DÍA"

    return {
        "client": {
            "id": client.id,
            "name": client.full_name,
            "phone": client.phone_number,
            "email": client.email,
            "agent_name": client.assigned_agent.full_name if client.assigned_agent else None,
            "balance": float(client.balance or 0.0)
        },
        "statement": {
            "operations": operations,
            "summary": {
                "total_operations": len(operations),
                "total_debits": round(total_debits, 2),
                "total_credits": round(total_credits, 2),
                "final_balance": round(final_balance, 2),
                "status": status,
                "pending_to_pay": round(abs(final_balance) if final_balance < 0 else 0.0, 2),
                "surplus_balance": round(final_balance if final_balance > 0 else 0.0, 2)
            }
        },
        "generated_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

