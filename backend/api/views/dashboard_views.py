from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from api.models import Order, Product, DeliverReceip, Package, CustomUser


class DashboardMetricsView(APIView):
    """
    Vista para métricas del dashboard.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Métricas del dashboard",
        description="Obtiene métricas generales del sistema para el dashboard.",
        tags=["Dashboard"]
    )
    def get(self, request):
        user = request.user
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        # Métricas básicas
        metrics = {
            'total_users': CustomUser.objects.count(),
            'active_users': CustomUser.objects.filter(is_active=True).count(),
            'total_orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(status='pending').count(),
            'completed_orders': Order.objects.filter(status='completed').count(),
            'total_products': Product.objects.count(),
            'total_deliveries': DeliverReceip.objects.count(),
        }

        # Filtros por rol
        if user.role == 'agent':
            agent_orders = Order.objects.filter(agent=user)
            agent_products = Product.objects.filter(order__agent=user)
            agent_deliveries = DeliverReceip.objects.filter(order__agent=user)

            metrics.update({
                'agent_orders': agent_orders.count(),
                'agent_pending_orders': agent_orders.filter(status='pending').count(),
                'agent_completed_orders': agent_orders.filter(status='completed').count(),
                'agent_products': agent_products.count(),
                'agent_deliveries': agent_deliveries.count(),
                'agent_profit': user.agent_profit,
            })

            # Métricas adicionales para admin
            recent_orders = Order.objects.filter(created_at__gte=thirty_days_ago)
            metrics.update({
                'recent_orders': recent_orders.count(),
                'total_revenue': Order.objects.aggregate(total=Sum('received_value_of_client'))['total'] or 0,
                'recent_revenue': recent_orders.aggregate(total=Sum('received_value_of_client'))['total'] or 0,
            })

        return Response(metrics)


class ProfitReportsView(APIView):
    """
    Vista para reportes de ganancias.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Reportes de ganancias",
        description="Obtiene reportes de ganancias por período.",
        tags=["Reportes"]
    )
    def get(self, request):
        user = request.user

        if user.role != 'admin':
            return Response(
                {"error": "Solo administradores pueden ver reportes de ganancias"},
                status=status.HTTP_403_FORBIDDEN
            )

        from django.db.models.functions import TruncMonth
        from django.db.models import Sum, Count, Avg
        from datetime import datetime

        # Calcular datos mensuales (últimos 12 meses)
        monthly_reports = []
        for i in range(12):
            month_start = timezone.now().replace(day=1) - timedelta(days=i*30)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            month_orders = Order.objects.filter(
                created_at__gte=month_start,
                created_at__lte=month_end
            )

            # Calcular ingresos
            revenue = month_orders.aggregate(total=Sum('received_value_of_client'))['total'] or 0

            # Calcular gastos de productos
            product_expenses = 0
            for order in month_orders:
                for product in order.products.all():
                    product_expenses += float(product.total_cost)

            # Gastos operativos (estimados como 10% de ingresos)
            purchase_operational_expenses = float(revenue) * 0.10

            # Gastos pagados de compra (estimados como 5% de ingresos)
            paid_purchase_expenses = float(revenue) * 0.05

            # Calcular gastos de entrega (basado en categorías)
            delivery_expenses = 0
            for order in month_orders:
                for product in order.products.all():
                    if product.category and product.category.shipping_cost_per_pound:
                        # Estimar peso y calcular envío
                        delivery_expenses += product.category.shipping_cost_per_pound * 2  # Estimar 2 libras por producto

            # Total gastos
            total_expenses = product_expenses + purchase_operational_expenses + paid_purchase_expenses + delivery_expenses

            # Ganancias de agentes (estimadas como 15% de ingresos)
            agent_profits = float(revenue) * 0.15

            # Ganancia de entrega del sistema (estimada como 5% de ingresos)
            system_delivery_profit = float(revenue) * 0.05

            # Ganancia total del sistema
            system_profit = revenue - total_expenses

            # Ganancia proyectada (simplificada)
            projected_profit = system_profit * 1.1

            monthly_reports.append({
                'month': month_start.strftime('%Y-%m'),
                'month_short': month_start.strftime('%b %Y'),
                'revenue': float(revenue),
                'total_expenses': float(total_expenses),
                'product_expenses': float(product_expenses),
                'purchase_operational_expenses': float(purchase_operational_expenses),
                'paid_purchase_expenses': float(paid_purchase_expenses),
                'delivery_expenses': float(delivery_expenses),
                'agent_profits': float(agent_profits),
                'system_delivery_profit': float(system_delivery_profit),
                'system_profit': float(system_profit),
                'projected_profit': float(projected_profit),
            })

        # Invertir para mostrar del más antiguo al más reciente
        monthly_reports.reverse()

        # Reportes de agentes
        agents = CustomUser.objects.filter(role='agent')
        agent_reports = []
        for agent in agents:
            # Órdenes del agente (como sales_manager)
            agent_orders = Order.objects.filter(sales_manager=agent)
            current_month_orders = agent_orders.filter(
                created_at__gte=timezone.now().replace(day=1)
            )

            agent_reports.append({
                'agent_id': agent.id,
                'agent_name': f"{agent.name} {agent.last_name}",
                'agent_phone': agent.phone_number or '',
                'total_profit': float(agent.agent_profit or 0),
                'current_month_profit': float(current_month_orders.aggregate(
                    total=Sum('received_value_of_client')
                )['total'] or 0) * 0.15,  # Estimar 15% de comisión
                'clients_count': agent_orders.values('client').distinct().count(),
                'orders_count': agent_orders.count(),
                'orders_completed': agent_orders.filter(status='Completado').count(),
            })

        # Resumen total
        total_revenue = sum(r['revenue'] for r in monthly_reports)
        total_expenses = sum(r['total_expenses'] for r in monthly_reports)
        total_product_expenses = sum(r['product_expenses'] for r in monthly_reports)
        total_purchase_operational_expenses = sum(r['purchase_operational_expenses'] for r in monthly_reports)
        total_paid_purchase_expenses = sum(r['paid_purchase_expenses'] for r in monthly_reports)
        total_delivery_expenses = sum(r['delivery_expenses'] for r in monthly_reports)
        total_agent_profits = sum(r['agent_profits'] for r in monthly_reports)
        total_system_delivery_profit = sum(r['system_delivery_profit'] for r in monthly_reports)
        total_system_profit = sum(r['system_profit'] for r in monthly_reports)

        profit_margin = (total_system_profit / total_revenue * 100) if total_revenue > 0 else 0

        summary = {
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'total_product_expenses': float(total_product_expenses),
            'total_purchase_operational_expenses': float(total_purchase_operational_expenses),
            'total_paid_purchase_expenses': float(total_paid_purchase_expenses),
            'total_delivery_expenses': float(total_delivery_expenses),
            'total_agent_profits': float(total_agent_profits),
            'total_system_delivery_profit': float(total_system_delivery_profit),
            'total_system_profit': float(total_system_profit),
            'profit_margin': float(profit_margin),
        }

        return Response({
            'monthly_reports': monthly_reports,
            'agent_reports': agent_reports,
            'summary': summary,
        })


class SystemInfoView(APIView):
    """
    Vista para información del sistema.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Información del sistema",
        description="Obtiene información general del sistema.",
        tags=["Sistema"]
    )
    def get(self, request):
        user = request.user

        if user.role != 'admin':
            return Response(
                {"error": "Solo administradores pueden ver información del sistema"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Información del sistema
        system_info = {
            'total_users': CustomUser.objects.count(),
            'active_users': CustomUser.objects.filter(is_active=True).count(),
            'inactive_users': CustomUser.objects.filter(is_active=False).count(),
            'admin_users': CustomUser.objects.filter(role='admin').count(),
            'agent_users': CustomUser.objects.filter(role='agent').count(),
            'buyer_users': CustomUser.objects.filter(role='buyer').count(),
            'logistical_users': CustomUser.objects.filter(role='logistical').count(),
            'client_users': CustomUser.objects.filter(role='client').count(),
            'total_orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(status='pending').count(),
            'processing_orders': Order.objects.filter(status='processing').count(),
            'completed_orders': Order.objects.filter(status='completed').count(),
            'cancelled_orders': Order.objects.filter(status='cancelled').count(),
            'total_products': Product.objects.count(),
            'total_deliveries': DeliverReceip.objects.count(),
            'pending_deliveries': DeliverReceip.objects.filter(status='pending').count(),
            'in_transit_deliveries': DeliverReceip.objects.filter(status='in_transit').count(),
            'delivered_deliveries': DeliverReceip.objects.filter(status='delivered').count(),
        }

        # Estadísticas financieras
        financial_stats = Order.objects.aggregate(
            total_revenue=Sum('received_value_of_client'),
            avg_order_value=Avg('received_value_of_client')
        )
        system_info.update(financial_stats)

        return Response(system_info)