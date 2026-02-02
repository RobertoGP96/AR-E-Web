"""
Service: Client-specific financial reports
Provides detailed analysis of customer accounts, including outstanding balances and surplus.
"""
from typing import Dict, Any, List
from django.db import models
from django.db.models import Sum, Q, Subquery, OuterRef, F
from api.models import Order, DeliverReceip, CustomUser
from decimal import Decimal

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
    # We assume weight_cost is a separate charge unless otherwise specified in later business logic
    deliveries = DeliverReceip.objects.filter(client=client).order_by('-deliver_date')
    
    deliveries_list = []
    total_shipping_cost = 0.0
    
    for delivery in deliveries:
        total_shipping_cost += float(delivery.weight_cost or 0.0)
        
        deliveries_list.append({
            "id": delivery.id,
            "date": delivery.deliver_date.strftime('%Y-%m-%d'),
            "weight": float(delivery.weight or 0.0),
            "shipping_cost": float(delivery.weight_cost or 0.0),
            "status": delivery.status,
            "category": delivery.category.name if delivery.category else "Sin categoría"
        })

    # 3. Overall Summary
    order_balance = total_orders_received - total_orders_cost
    # Total balance considers both order balances and shipping costs
    # Shipping cost is treated as a debt (negative in balance calculation)
    total_balance = order_balance - total_shipping_cost
    
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
            "agent_name": client.assigned_agent.full_name if client.assigned_agent else None
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
                "total_shipping_cost": round(total_shipping_cost, 2)
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

    # Query all clients and annotate with calculated sums
    clients = CustomUser.objects.filter(role='client').annotate(
        computed_order_cost=Subquery(order_costs, output_field=models.FloatField()),
        computed_order_received=Subquery(order_received, output_field=models.FloatField()),
        computed_deliver_cost=Subquery(delivery_costs, output_field=models.FloatField()),
        agent_name=F('assigned_agent__full_name')
    ).order_by('name', 'last_name')

    report = []
    for client in clients:
        order_cost = float(client.computed_order_cost or 0.0)
        order_received = float(client.computed_order_received or 0.0)
        deliver_cost = float(client.computed_deliver_cost or 0.0)
        
        # Balance formula: Received - (Order Costs + Delivery Costs)
        total_balance = order_received - (order_cost + deliver_cost)
        
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
            "total_order_cost": round(order_cost, 2),
            "total_order_received": round(order_received, 2),
            "total_deliver_cost": round(deliver_cost, 2),
            "total_balance": round(total_balance, 2),
            "status": status,
            "pending_to_pay": round(abs(total_balance) if total_balance < 0 else 0.0, 2),
            "surplus_balance": round(total_balance if total_balance > 0 else 0.0, 2)
        })
    
    return report
