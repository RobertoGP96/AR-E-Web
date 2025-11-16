from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.db.models import Q, Count, Sum, Avg
from django.conf import settings
import platform
from django.db import connection
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

        # Solo administradores pueden ver métricas completas
        if user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Solo administradores pueden ver métricas del dashboard',
                'errors': [{'message': 'Solo administradores pueden ver métricas del dashboard'}]
            }, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        last_month_end = month_start - timedelta(days=1)

        # Orders
        orders = {
            'total': Order.objects.count(),
            'pending': Order.objects.filter(status='pending').count(),
            'completed': Order.objects.filter(status='completed').count(),
            'today': Order.objects.filter(created_at__gte=today_start).count(),
            'this_week': Order.objects.filter(created_at__gte=week_start).count(),
            'this_month': Order.objects.filter(created_at__gte=month_start).count(),
        }

        # Products
        products = {
            'total': Product.objects.count(),
            'ordered': Product.objects.filter(order__isnull=False).count(),
            'purchased': Product.objects.filter(status='Comprado').count(),
            'received': Product.objects.filter(status='Recibido').count(),
            'delivered': Product.objects.filter(status='Entregado').count(),
            'by_category': list(
                Product.objects.values('category__name')
                .annotate(count=Count('id'))
                .filter(category__name__isnull=False)
                .order_by('-count')
            ),
        }

        # Users
        users = {
            'total': CustomUser.objects.count(),
            'active': CustomUser.objects.filter(is_active=True).count(),
            'verified': CustomUser.objects.filter(is_verified=True).count(),
            'agents': CustomUser.objects.filter(role='agent').count(),
        }

        # Revenue
        revenue = {
            'total': Order.objects.aggregate(Sum('received_value_of_client'))['received_value_of_client__sum'] or 0,
            'today': Order.objects.filter(created_at__gte=today_start).aggregate(Sum('received_value_of_client'))['received_value_of_client__sum'] or 0,
            'this_week': Order.objects.filter(created_at__gte=week_start).aggregate(Sum('received_value_of_client'))['received_value_of_client__sum'] or 0,
            'this_month': Order.objects.filter(created_at__gte=month_start).aggregate(Sum('received_value_of_client'))['received_value_of_client__sum'] or 0,
            'last_month': Order.objects.filter(created_at__gte=last_month_start, created_at__lte=last_month_end).aggregate(Sum('received_value_of_client'))['received_value_of_client__sum'] or 0,
        }

        # Purchases (productos comprados)
        purchases = {
            'total': Product.objects.filter(status='Comprado').count(),
            'today': Product.objects.filter(created_at__gte=today_start, status='Comprado').count(),
            'this_week': Product.objects.filter(created_at__gte=week_start, status='Comprado').count(),
            'this_month': Product.objects.filter(created_at__gte=month_start, status='Comprado').count(),
        }

        # Packages
        packages = {
            'total': Package.objects.count(),
            'sent': Package.objects.filter(status_of_processing='Enviado').count(),
            'in_transit': Package.objects.filter(status_of_processing='Recibido').count(),
            'delivered': Package.objects.filter(status_of_processing='Procesado').count(),
            'delayed': 0,  # No hay estado 'delayed' en el modelo
        }

        # Deliveries
        deliveries = {
            'total': DeliverReceip.objects.count(),
            'today': DeliverReceip.objects.filter(created_at__gte=today_start).count(),
            'this_week': DeliverReceip.objects.filter(created_at__gte=week_start).count(),
            'this_month': DeliverReceip.objects.filter(created_at__gte=month_start).count(),
            'pending': DeliverReceip.objects.filter(status='Pendiente').count(),
            'in_transit': DeliverReceip.objects.filter(status='En transito').count(),
            'delivered': DeliverReceip.objects.filter(status='Entregado').count(),
        }

        return Response({
            'success': True,
            'data': {
                'orders': orders,
                'products': products,
                'users': users,
                'revenue': revenue,
                'purchases': purchases,
                'packages': packages,
                'deliveries': deliveries,
            },
            'message': 'Métricas del dashboard obtenidas exitosamente'
        })


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
            return Response({
                'success': False,
                'message': 'Solo administradores pueden ver reportes de ganancias',
                'errors': [{'message': 'Solo administradores pueden ver reportes de ganancias'}]
            }, status=status.HTTP_403_FORBIDDEN)

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
            'success': True,
            'data': {
                'monthly_reports': monthly_reports,
                'agent_reports': agent_reports,
                'summary': summary,
            },
            'message': 'Reportes de ganancias obtenidos exitosamente'
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
            return Response({
                'success': False,
                'message': 'Solo administradores pueden ver información del sistema',
                'errors': [{'message': 'Solo administradores pueden ver información del sistema'}]
            }, status=status.HTTP_403_FORBIDDEN)

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

        # Add application metadata (from Django settings) if available
        application_meta = {
            'version': getattr(settings, 'APP_VERSION', None),
            'last_updated': getattr(settings, 'LAST_UPDATED', None),
            'environment': getattr(settings, 'ENVIRONMENT', None),
        }

        # Technology info
        try:
            from django import get_version as get_django_version
            django_version = get_django_version()
        except Exception:
            django_version = None

        technology_info = {
            'django_version': django_version,
            'python_version': platform.python_version(),
            'database_type': connection.vendor if hasattr(connection, 'vendor') else None,
        }

        # Server information
        server_info = {
            'os': platform.system(),
            'os_version': platform.version(),
            'architecture': platform.machine(),
        }

        # Database details: tables count and approximate size if PostgreSQL
        try:
            with connection.cursor() as cursor:
                table_names = connection.introspection.table_names()
                tables_count = len(table_names)
                size_mb = None
                if connection.vendor == 'postgresql':
                    cursor.execute("SELECT pg_database_size(current_database())")
                    size_bytes = cursor.fetchone()[0]
                    size_mb = round(size_bytes / 1024 / 1024, 2)
        except Exception:
            tables_count = None
            size_mb = None

        database_info = {
            'engine': connection.settings_dict.get('ENGINE') if hasattr(connection, 'settings_dict') else None,
            'size_mb': size_mb,
            'tables_count': tables_count,
            # existing per-model stats are already included in system_info
            'record_counts': {
                'users': system_info.get('total_users'),
                'orders': system_info.get('total_orders'),
                'products': system_info.get('total_products'),
                'packages': system_info.get('total_deliveries'),
                'shops': None,
                'categories': None,
            },
            'total_records': system_info.get('total_products') + system_info.get('total_orders', 0) if isinstance(system_info.get('total_products'), int) else None,
        }

        # Attach new keys to the original system_info so existing consumers keep working
        system_info.update({
                'application': application_meta,
                'server': server_info,
                'technology': technology_info,
                'database': database_info,
            })
        return Response({
            'success': True,
            'data': system_info,
            'message': 'Información del sistema obtenida exitosamente'
        })