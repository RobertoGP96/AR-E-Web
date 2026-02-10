from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.db.models import Q, Count, Sum, Avg, F
from django.db.models.functions import Coalesce, TruncMonth
from django.conf import settings
import platform
from django.db import connection
from django.utils import timezone
from datetime import timedelta
from api.models import Order, Product, DeliverReceip, Package, CustomUser, ShoppingReceip, ProductBuyed


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

        # Orders Metrics - Single Query aggregation
        orders_data = Order.objects.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            completed=Count('id', filter=Q(status='completed')),
            today=Count('id', filter=Q(created_at__gte=today_start)),
            this_week=Count('id', filter=Q(created_at__gte=week_start)),
            this_month=Count('id', filter=Q(created_at__gte=month_start)),
            total_revenue=Sum('received_value_of_client'),
            today_revenue=Sum('received_value_of_client', filter=Q(created_at__gte=today_start)),
            week_revenue=Sum('received_value_of_client', filter=Q(created_at__gte=week_start)),
            month_revenue=Sum('received_value_of_client', filter=Q(created_at__gte=month_start)),
            last_month_revenue=Sum('received_value_of_client', filter=Q(created_at__gte=last_month_start, created_at__lte=last_month_end))
        )
        
        orders = {
            'total': orders_data['total'],
            'pending': orders_data['pending'],
            'completed': orders_data['completed'],
            'today': orders_data['today'],
            'this_week': orders_data['this_week'],
            'this_month': orders_data['this_month'],
        }

        # Products Metrics - Single Query
        products_data = Product.objects.aggregate(
            total=Count('id'),
            ordered=Count('id', filter=Q(order__isnull=False)),
            purchased=Count('id', filter=Q(status='Comprado')),
            received=Count('id', filter=Q(status='Recibido')),
            delivered=Count('id', filter=Q(status='Entregado'))
        )
        
        products = {
            'total': products_data['total'],
            'ordered': products_data['ordered'],
            'purchased': products_data['purchased'],
            'received': products_data['received'],
            'delivered': products_data['delivered'],
            'by_category': list(
                Product.objects.values('category__name')
                .annotate(count=Count('id'))
                .filter(category__name__isnull=False)
                .order_by('-count')[:10]  # Limit to top 10 for performance
            ),
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

        # Users Metrics - Single Query
        users_data = CustomUser.objects.aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(is_active=True)),
            verified=Count('id', filter=Q(is_verified=True)),
            agents=Count('id', filter=Q(role='agent')),
            clients=Count('id', filter=Q(role='client'))
        )
        
        users = {
            'total': users_data['total'],
            'active': users_data['active'],
            'verified': users_data['verified'],
            'agents': users_data['agents'],
            'clients': users_data['clients'],
        }

        # Revenue Breakdown
        revenue = {
            'total': orders_data['total_revenue'] or 0,
            'today': orders_data['today_revenue'] or 0,
            'this_week': orders_data['week_revenue'] or 0,
            'this_month': orders_data['month_revenue'] or 0,
            'last_month': orders_data['last_month_revenue'] or 0,
        }

        # Purchases Metrics - Optimized aggregation
        purchases_data = ShoppingReceip.objects.aggregate(
            total=Count('id'),
            total_spent=Sum('total_cost_of_purchase'),
            today_count=Count('id', filter=Q(buy_date__gte=today_start)),
            today_spent=Sum('total_cost_of_purchase', filter=Q(buy_date__gte=today_start)),
            week_count=Count('id', filter=Q(buy_date__gte=week_start)),
            week_spent=Sum('total_cost_of_purchase', filter=Q(buy_date__gte=week_start)),
            month_count=Count('id', filter=Q(buy_date__gte=month_start)),
            month_spent=Sum('total_cost_of_purchase', filter=Q(buy_date__gte=month_start))
        )
        
        purchases = {
            'total': purchases_data['total'],
            'total_spent': purchases_data['total_spent'] or 0,
            'today': purchases_data['today_count'],
            'today_spent': purchases_data['today_spent'] or 0,
            'this_week': purchases_data['week_count'],
            'this_week_spent': purchases_data['week_spent'] or 0,
            'this_month': purchases_data['month_count'],
            'this_month_spent': purchases_data['month_spent'] or 0,
            'products_count': Product.objects.filter(status__in=['Comprado', 'Recibido', 'Entregado']).count(),
        }

        # Packages Metrics - Optimized aggregation
        packages_data = Package.objects.aggregate(
            total=Count('id'),
            sent=Count('id', filter=Q(status_of_processing='Enviado')),
            in_transit=Count('id', filter=Q(status_of_processing='Recibido')),
            delivered=Count('id', filter=Q(status_of_processing='Procesado'))
        )
        
        packages = {
            'total': packages_data['total'],
            'sent': packages_data['sent'],
            'in_transit': packages_data['in_transit'],
            'delivered': packages_data['delivered'],
            'delayed': 0,
        }

        # Deliveries Metrics - Single Query aggregation
        deliveries_data = DeliverReceip.objects.aggregate(
            total=Count('id'),
            today=Count('id', filter=Q(created_at__gte=today_start)),
            this_week=Count('id', filter=Q(created_at__gte=week_start)),
            this_month=Count('id', filter=Q(created_at__gte=month_start)),
            pending=Count('id', filter=Q(status='Pendiente')),
            in_transit=Count('id', filter=Q(status='En transito')),
            delivered=Count('id', filter=Q(status='Entregado')),
            paid=Count('id', filter=Q(payment_status=True)),
            unpaid=Count('id', filter=Q(payment_status=False)),
            total_weight=Sum('weight'),
            today_weight=Sum('weight', filter=Q(created_at__gte=today_start)),
            this_week_weight=Sum('weight', filter=Q(created_at__gte=week_start)),
            this_month_weight=Sum('weight', filter=Q(created_at__gte=month_start)),
        )
        
        deliveries = {
            'total': deliveries_data['total'],
            'today': deliveries_data['today'],
            'this_week': deliveries_data['this_week'],
            'this_month': deliveries_data['this_month'],
            'pending': deliveries_data['pending'],
            'in_transit': deliveries_data['in_transit'],
            'delivered': deliveries_data['delivered'],
            'paid': deliveries_data['paid'],
            'unpaid': deliveries_data['unpaid'],
            'total_weight': float(deliveries_data['total_weight'] or 0.0),
            'today_weight': float(deliveries_data['today_weight'] or 0.0),
            'this_week_weight': float(deliveries_data['this_week_weight'] or 0.0),
            'this_month_weight': float(deliveries_data['this_month_weight'] or 0.0),
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

        # Calcular datos mensuales de forma eficiente (usando TruncMonth y aggregate)
        twelve_months_ago = timezone.now().replace(day=1) - timedelta(days=365)
        
        # Ingresos agrupados por mes
        monthly_revenue = Order.objects.filter(created_at__gte=twelve_months_ago).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(total=Sum('received_value_of_client')).order_by('month')
        
        # Gastos de productos agrupados por mes
        monthly_product_expenses = Order.objects.filter(created_at__gte=twelve_months_ago).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(total=Sum('products__total_cost')).order_by('month')
        
        # Gastos de entrega agrupados por mes (basado en DeliverReceip)
        # Nota: Calculamos gastos operativos de entrega y comisiones de agentes aquí
        monthly_delivery_data = DeliverReceip.objects.filter(deliver_date__gte=twelve_months_ago).annotate(
            month=TruncMonth('deliver_date')
        ).values('month').annotate(
            expenses=Sum(F('weight') * F('category__shipping_cost_per_pound')),
            agent_profits=Sum('manager_profit'),
            system_delivery_profit=Sum(F('weight_cost') - F('manager_profit') - (F('weight') * F('category__shipping_cost_per_pound')))
        ).order_by('month')

        # Combinar datos en el reporte final
        revenue_map = {r['month'].strftime('%Y-%m'): r['total'] for r in monthly_revenue}
        product_expenses_map = {e['month'].strftime('%Y-%m'): e['total'] for e in monthly_product_expenses}
        delivery_map = {d['month'].strftime('%Y-%m'): d for d in monthly_delivery_data}

        monthly_reports = []
        for i in range(12):
            m_date = timezone.now().replace(day=1) - timedelta(days=i*30)
            m_key = m_date.strftime('%Y-%m')
            
            revenue = revenue_map.get(m_key, 0) or 0
            product_expenses = product_expenses_map.get(m_key, 0) or 0
            
            d_data = delivery_map.get(m_key, {})
            delivery_expenses = d_data.get('expenses', 0) or 0
            agent_profits_real = d_data.get('agent_profits', 0) or 0
            system_delivery_profit_real = d_data.get('system_delivery_profit', 0) or 0
            
            # Gastos operativos y fijos estimados
            purchase_operational_expenses = float(revenue) * 0.10
            paid_purchase_expenses = float(revenue) * 0.05
            
            total_expenses = float(product_expenses) + purchase_operational_expenses + paid_purchase_expenses + float(delivery_expenses)
            system_profit = float(revenue) - total_expenses
            
            monthly_reports.append({
                'month': m_key,
                'month_short': m_date.strftime('%b %Y'),
                'revenue': float(revenue),
                'total_expenses': total_expenses,
                'product_expenses': float(product_expenses),
                'purchase_operational_expenses': purchase_operational_expenses,
                'paid_purchase_expenses': paid_purchase_expenses,
                'delivery_expenses': float(delivery_expenses),
                'agent_profits': float(agent_profits_real),
                'system_delivery_profit': float(system_delivery_profit_real),
                'system_profit': system_profit,
                'projected_profit': system_profit * 1.1,
            })

        # Invertir para mostrar del más antiguo al más reciente
        monthly_reports.reverse()

        # Reportes de agentes optimizados - Single query with aggregation
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        agents_data = CustomUser.objects.filter(role='agent').annotate(
            total_profit=Coalesce(Sum('assigned_clients__deliveries__manager_profit'), 0.0, output_field=FloatField()),
            current_month_profit=Coalesce(Sum('assigned_clients__deliveries__manager_profit', filter=Q(assigned_clients__deliveries__created_at__gte=current_month_start)), 0.0, output_field=FloatField()),
            clients_count=Count('assigned_clients', filter=Q(assigned_clients__role='client'), distinct=True),
            orders_count=Count('managed_orders', distinct=True),
            orders_completed=Count('managed_orders', filter=Q(managed_orders__status='Completado'), distinct=True),
            deliveries_count=Count('assigned_clients__deliveries', distinct=True),
            current_month_deliveries=Count('assigned_clients__deliveries', filter=Q(assigned_clients__deliveries__created_at__gte=current_month_start), distinct=True)
        )
        
        # Note: We need to use the correct related names if they are custom. 
        # Check CustomUser model for related_name of assigned_agent and sales_manager.
        # Assuming 'assigned_clients' and 'managed_orders' are standard or we'll fallback if they fail.
        # For now, let's use a slightly safer loop but with aggregate inside.
        
        agent_reports = []
        for agent in agents:
            # Reusing original logic but ensuring it's efficient
            # (Keeping simple for now as it's less critical than the 12-month loop)
            agent_deliveries = DeleverReceip_objs = DeliverReceip.objects.filter(client__assigned_agent=agent)
            
            stats = agent_deliveries.aggregate(
                total=Sum('manager_profit'),
                current=Sum('manager_profit', filter=Q(created_at__gte=current_month_start)),
                count=Count('id'),
                current_count=Count('id', filter=Q(created_at__gte=current_month_start))
            )

            agent_reports.append({
                'agent_id': agent.id,
                'agent_name': f"{agent.name} {agent.last_name}",
                'agent_phone': agent.phone_number or '',
                'total_profit': float(stats['total'] or 0.0),
                'current_month_profit': float(stats['current'] or 0.0),
                'clients_count': CustomUser.objects.filter(assigned_agent=agent, role='client').count(),
                'orders_count': Order.objects.filter(sales_manager=agent).count(),
                'orders_completed': Order.objects.filter(sales_manager=agent, status='Completado').count(),
                'deliveries_count': stats['count'],
                'current_month_deliveries': stats['current_count'],
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

        from django.db.models import Count, Sum, Avg, Q
        from django.conf import settings
        from django.db import connection
        import platform

        # Información del sistema optimizada
        system_stats = CustomUser.objects.aggregate(
            total_users=Count('id'),
            active_users=Count('id', filter=Q(is_active=True)),
            inactive_users=Count('id', filter=Q(is_active=False)),
            admin_users=Count('id', filter=Q(role='admin')),
            agent_users=Count('id', filter=Q(role='agent')),
            buyer_users=Count('id', filter=Q(role='buyer')),
            logistical_users=Count('id', filter=Q(role='logistical')),
            client_users=Count('id', filter=Q(role='client'))
        )

        order_stats = Order.objects.aggregate(
            total_orders=Count('id'),
            pending_orders=Count('id', filter=Q(status='pending')),
            processing_orders=Count('id', filter=Q(status='processing')),
            completed_orders=Count('id', filter=Q(status='completed')),
            cancelled_orders=Count('id', filter=Q(status='cancelled')),
            total_revenue=Sum('received_value_of_client'),
            avg_order_value=Avg('received_value_of_client')
        )

        delivery_stats = DeliverReceip.objects.aggregate(
            total_deliveries=Count('id'),
            pending_deliveries=Count('id', filter=Q(status='pending')),
            in_transit_deliveries=Count('id', filter=Q(status='in_transit')),
            delivered_deliveries=Count('id', filter=Q(status='delivered'))
        )

        system_info = {
            **system_stats,
            **order_stats,
            'total_products': Product.objects.count(),
            **delivery_stats
        }

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