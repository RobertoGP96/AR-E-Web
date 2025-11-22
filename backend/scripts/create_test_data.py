"""
Script para crear datos de prueba completos
Incluye: Usuarios, Productos, Órdenes, Compras, Paquetes y Deliveries
"""
import os
import django
from decimal import Decimal
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import (
    CustomUser, Product, Order, ProductBuyed,
    Package, DeliverReceip, Shop, Category,
    BuyingAccounts, ShoppingReceip, ProductReceived,
    ProductDelivery
)
from django.db import transaction
from django.utils import timezone
from django.db import models

print("="*70)
print("CREACIÓN DE DATOS DE PRUEBA COMPLETOS PARA EL SISTEMA")
print("="*70)

try:
    with transaction.atomic():
        # 1. Crear agentes de prueba
        print("\n📋 Creando agentes...")
        
        agents = []
        agent_data = [
            {
                'name': 'María',
                'last_name': 'García',
                'phone_number': '+1234567801',
                'email': 'maria.garcia@test.com',
                'home_address': 'Calle Principal #101',
                'role': 'agent',
                'agent_profit': 15.0
            },
            {
                'name': 'Juan',
                'last_name': 'Rodríguez',
                'phone_number': '+1234567802',
                'email': 'juan.rodriguez@test.com',
                'home_address': 'Avenida Central #202',
                'role': 'agent',
                'agent_profit': 12.5
            },
            {
                'name': 'Ana',
                'last_name': 'Martínez',
                'phone_number': '+1234567803',
                'email': None,  # Agente sin email
                'home_address': 'Plaza Mayor #303',
                'role': 'agent',
                'agent_profit': 18.0
            }
        ]
        
        for data in agent_data:
            # Verificar si ya existe
            if not CustomUser.objects.filter(phone_number=data['phone_number']).exists():
                agent = CustomUser.objects.create_user(
                    password='test123456',
                    **data
                )
                agents.append(agent)
                print(f"  ✓ Agente creado: {agent.full_name} (Ganancia: {agent.agent_profit}%)")
            else:
                agent = CustomUser.objects.get(phone_number=data['phone_number'])
                agents.append(agent)
                print(f"  ℹ Agente ya existe: {agent.full_name}")
        
        # 2. Crear clientes de prueba
        print("\n👥 Creando clientes...")
        
        clients = []
        client_data = [
            {
                'name': 'Pedro',
                'last_name': 'López',
                'phone_number': '+1234567811',
                'email': 'pedro.lopez@test.com',
                'home_address': 'Calle 1 #111',
                'role': 'client',
                'assigned_agent': agents[0] if agents else None
            },
            {
                'name': 'Laura',
                'last_name': 'Fernández',
                'phone_number': '+1234567812',
                'email': None,  # Cliente sin email
                'home_address': 'Calle 2 #222',
                'role': 'client',
                'assigned_agent': agents[0] if agents else None
            },
            {
                'name': 'Carlos',
                'last_name': 'Sánchez',
                'phone_number': '+1234567813',
                'email': 'carlos.sanchez@test.com',
                'home_address': 'Calle 3 #333',
                'role': 'client',
                'assigned_agent': agents[1] if len(agents) > 1 else None
            },
            {
                'name': 'Elena',
                'last_name': 'Torres',
                'phone_number': '+1234567814',
                'email': 'elena.torres@test.com',
                'home_address': '',  # Cliente sin dirección
                'role': 'client',
                'assigned_agent': agents[1] if len(agents) > 1 else None
            },
            {
                'name': 'Miguel',
                'last_name': 'Ramírez',
                'phone_number': '+1234567815',
                'email': 'miguel.ramirez@test.com',
                'home_address': 'Calle 5 #555',
                'role': 'client',
                'assigned_agent': agents[2] if len(agents) > 2 else None
            },
            {
                'name': 'Sofia',
                'last_name': 'Díaz',
                'phone_number': '+1234567816',
                'email': None,
                'home_address': 'Calle 6 #666',
                'role': 'client',
                'assigned_agent': None  # Cliente sin agente asignado
            }
        ]
        
        for data in client_data:
            if not CustomUser.objects.filter(phone_number=data['phone_number']).exists():
                client = CustomUser.objects.create_user(
                    password='test123456',
                    **data
                )
                clients.append(client)
                agent_name = client.assigned_agent.full_name if client.assigned_agent else "Sin agente"
                print(f"  ✓ Cliente creado: {client.full_name} → {agent_name}")
            else:
                client = CustomUser.objects.get(phone_number=data['phone_number'])
                clients.append(client)
                print(f"  ℹ Cliente ya existe: {client.full_name}")
        
        # 3. Crear otros roles
        print("\n👔 Creando otros usuarios...")
        
        other_users = [
            {
                'name': 'Roberto',
                'last_name': 'Contador',
                'phone_number': '+1234567821',
                'email': 'roberto.contador@test.com',
                'home_address': 'Oficina A',
                'role': 'accountant',
            },
            {
                'name': 'Patricia',
                'last_name': 'Compradora',
                'phone_number': '+1234567822',
                'email': 'patricia.buyer@test.com',
                'home_address': 'Oficina B',
                'role': 'buyer',
            },
            {
                'name': 'Luis',
                'last_name': 'Logística',
                'phone_number': '+1234567823',
                'email': None,
                'home_address': 'Almacén 1',
                'role': 'logistical',
            }
        ]
        
        for data in other_users:
            if not CustomUser.objects.filter(phone_number=data['phone_number']).exists():
                user = CustomUser.objects.create_user(
                    password='test123456',
                    **data
                )
                print(f"  ✓ {user.get_role_display()}: {user.full_name}")
            else:
                user = CustomUser.objects.get(phone_number=data['phone_number'])
                print(f"  ℹ Usuario ya existe: {user.full_name}")
        
        print("\n" + "="*70)
        print("✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE")
        print("="*70)
        
        # Resumen
        print("\n📊 RESUMEN:")
        print(f"  • Total de usuarios: {CustomUser.objects.count()}")
        print(f"  • Agentes: {CustomUser.objects.filter(role='agent').count()}")
        print(f"  • Clientes: {CustomUser.objects.filter(role='client').count()}")
        print(f"  • Clientes con agente asignado: {CustomUser.objects.filter(role='client', assigned_agent__isnull=False).count()}")
        print(f"  • Clientes sin agente: {CustomUser.objects.filter(role='client', assigned_agent__isnull=True).count()}")
        print(f"  • Otros roles: {CustomUser.objects.exclude(role__in=['agent', 'client', 'admin']).count()}")
        
        print("\n🔑 CREDENCIALES:")
        print("  Usuario: [cualquier teléfono de arriba]")
        print("  Contraseña: test123456")
        
        print("\n📝 CASOS DE PRUEBA CUBIERTOS:")
        print("  ✓ Usuarios con email")
        print("  ✓ Usuarios sin email (null)")
        print("  ✓ Usuarios con dirección")
        print("  ✓ Usuarios sin dirección")
        print("  ✓ Clientes con agente asignado")
        print("  ✓ Clientes sin agente asignado")
        print("  ✓ Agentes con diferentes ganancias")
        print("  ✓ Múltiples clientes por agente")
        print("  ✓ Diferentes roles del sistema")
        
        # 4. Crear shops y categorías de prueba
        print("\n🏪 Creando shops...")
        
        from api.models import Shop, Category
        
        # Crear shops con campos correctos
        shops_data = [
            {
                'name': 'Amazon',
                'link': 'https://www.amazon.com',
                'is_active': True,
                'tax_rate': 8.5
            },
            {
                'name': 'eBay',
                'link': 'https://www.ebay.com',
                'is_active': True,
                'tax_rate': 7.0
            },
            {
                'name': 'Walmart',
                'link': 'https://www.walmart.com',
                'is_active': True,
                'tax_rate': 6.5
            },
            {
                'name': 'Best Buy',
                'link': 'https://www.bestbuy.com',
                'is_active': True,
                'tax_rate': 8.0
            },
            {
                'name': 'Target',
                'link': 'https://www.target.com',
                'is_active': True,
                'tax_rate': 7.5
            }
        ]
        
        shops = []
        for shop_data in shops_data:
            shop, created = Shop.objects.get_or_create(
                name=shop_data['name'],
                defaults=shop_data
            )
            shops.append(shop)
            if created:
                print(f"  ✓ Shop creado: {shop.name} (Tax: {shop.tax_rate}%)")
            else:
                print(f"  ℹ Shop ya existe: {shop.name}")
        
        # Crear categorías con campos correctos
        print("\n📂 Creando categorías...")
        
        categories_data = [
            {
                'name': 'Electrónica',
                'shipping_cost_per_pound': 2.50,
            },
            {
                'name': 'Computadoras',
                'shipping_cost_per_pound': 3.00,
            },
            {
                'name': 'Gaming',
                'shipping_cost_per_pound': 2.75,
            },
            {
                'name': 'Accesorios',
                'shipping_cost_per_pound': 1.50,
            },
            {
                'name': 'Tablets',
                'shipping_cost_per_pound': 2.25,
            },
            {
                'name': 'Wearables',
                'shipping_cost_per_pound': 1.75,
            },
            {
                'name': 'Fotografía',
                'shipping_cost_per_pound': 3.50,
            },
            {
                'name': 'Audio',
                'shipping_cost_per_pound': 2.00,
            },
            {
                'name': 'Hogar',
                'shipping_cost_per_pound': 4.00,
            },
            {
                'name': 'Deportes',
                'shipping_cost_per_pound': 3.25,
            }
        ]
        
        categories = {}
        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            categories[cat_data['name']] = cat
            if created:
                print(f"  ✓ Categoría creada: {cat.name} (${cat.shipping_cost_per_pound}/lb)")
            else:
                print(f"  ℹ Categoría ya existe: {cat.name}")
        
        # 5. Crear productos dentro de órdenes
        print("\n📦 Los productos se crearán junto con las órdenes...")
        
        products = []  # Para mantener compatibilidad con el resto del script
        
        # 6. Crear órdenes de prueba con productos
        print("\n🛒 Creando órdenes con productos...")
        
        orders = []
        # Buscar sales_manager (puede ser admin o buyer)
        sales_managers = CustomUser.objects.filter(role__in=['buyer', 'admin'])
        sales_manager = sales_managers.first()
        
        if not sales_manager:
            print("  ⚠ No hay usuario sales manager, creando uno temporal...")
            sales_manager = CustomUser.objects.create_user(
                name='Temporal',
                last_name='Manager',
                phone_number='+9999999999',
                password='test123456',
                role='buyer'
            )
        
        product_templates = [
            {'name': 'iPhone 14 Pro', 'category': 'Electrónica', 'base_cost': (800, 1200)},
            {'name': 'Samsung Galaxy S23', 'category': 'Electrónica', 'base_cost': (700, 1000)},
            {'name': 'MacBook Air M2', 'category': 'Computadoras', 'base_cost': (1000, 1500)},
            {'name': 'AirPods Pro', 'category': 'Accesorios', 'base_cost': (200, 300)},
            {'name': 'iPad Air', 'category': 'Tablets', 'base_cost': (500, 700)},
            {'name': 'PlayStation 5', 'category': 'Gaming', 'base_cost': (450, 550)},
            {'name': 'Xbox Series X', 'category': 'Gaming', 'base_cost': (450, 550)},
            {'name': 'Apple Watch Series 8', 'category': 'Wearables', 'base_cost': (350, 450)},
            {'name': 'Canon EOS R6', 'category': 'Fotografía', 'base_cost': (2000, 2800)},
            {'name': 'Nintendo Switch OLED', 'category': 'Gaming', 'base_cost': (300, 400)},
            {'name': 'Sony WH-1000XM5', 'category': 'Audio', 'base_cost': (350, 450)},
            {'name': 'Dyson V15', 'category': 'Hogar', 'base_cost': (600, 800)},
            {'name': 'Peloton Bike', 'category': 'Deportes', 'base_cost': (1200, 1600)}
        ]
        
        # Crear órdenes para diferentes clientes
        for i, client in enumerate(clients[:4], 1):
            # Crear 2-3 órdenes por cliente
            num_orders = random.randint(2, 3)
            
            for j in range(num_orders):
                created_date = timezone.now() - timedelta(days=random.randint(1, 90))
                
                order = Order.objects.create(
                    client=client,
                    sales_manager=sales_manager,
                    status=random.choice(['encargado', 'procesando', 'completado', 'cancelado']),
                    pay_status=random.choice(['no pagado', 'parcial', 'pagado']),
                    observations=f'Orden de prueba #{i}-{j}',
                    created_at=created_date
                )
                
                # Crear 1-4 productos para esta orden
                num_products = random.randint(1, 4)
                
                selected_templates = random.sample(product_templates, min(num_products, len(product_templates)))
                
                for k, template in enumerate(selected_templates):
                    shop = random.choice(shops)
                    category = categories.get(template['category'])
                    
                    min_cost, max_cost = template['base_cost']
                    shop_cost = float(random.uniform(min_cost, max_cost))
                    shop_delivery_cost = float(random.uniform(10, 50))
                    shop_taxes = shop_cost * (shop.tax_rate / 100)
                    total_cost = shop_cost + shop_delivery_cost + shop_taxes
                    amount_requested = random.randint(1, 3)
                    
                    # Crear producto para esta orden
                    product = Product.objects.create(
                        name=template['name'],
                        sku=f'SKU-{order.id}-{k}',
                        link=f'https://{shop.link.split("//")[1]}/product/{order.id}-{k}',
                        shop=shop,
                        description=f'{template["name"]} - Producto de prueba',
                        observation=f'Observaciones sobre {template["name"]}',
                        category=category,
                        amount_requested=amount_requested,
                        amount_purchased=amount_requested if order.status in ['procesando', 'completado'] else 0,
                        amount_delivered=amount_requested if order.status == 'completado' else 0,
                        order=order,
                        status='delivered' if order.status == 'completado' else 'encargado',
                        shop_cost=shop_cost,
                        shop_delivery_cost=shop_delivery_cost,
                        shop_taxes=shop_taxes,
                        total_cost=total_cost
                    )
                    products.append(product)
                
                # Calcular total de la orden
                order_total = order.total_cost()
                orders.append(order)
                
                print(f"  ✓ Orden #{order.id} para {client.full_name}: {num_products} productos, ${order_total:.2f}")
                print(f"    Estado: {order.get_status_display()}, Pago: {order.get_pay_status_display()}")
        
        # 6. ProductBuyed ya no se usa en este modelo, los productos están directamente en Order
        print("\n🛍️ Productos creados como parte de las órdenes")
        print(f"  ✓ Total de productos en órdenes: {len(products)}")
        
        # 7. Crear paquetes
        print("\n📦 Creando paquetes...")
        
        packages = []
        
        # Agencias de envío comunes
        agencies = ['DHL', 'FedEx', 'UPS', 'USPS', 'Correos', 'Envialia']
        
        # Crear paquetes para órdenes completadas o en proceso
        eligible_orders = [o for o in orders if o.status in ['procesando', 'completado']]
        
        for i, order in enumerate(eligible_orders[:8], 1):  # Primeros 8 paquetes
            arrival_date = timezone.now() + timedelta(days=random.randint(-10, 10))
            
            package = Package.objects.create(
                agency_name=random.choice(agencies),
                number_of_tracking=f'TRK{random.randint(100000000, 999999999)}',
                status_of_processing=random.choice(['enviado', 'en transito', 'entregado', 'devuelto']),
                arrival_date=arrival_date.date()
            )
            packages.append(package)
            print(f"  ✓ Paquete creado: {package.number_of_tracking} ({package.agency_name})")
            print(f"    Estado: {package.get_status_of_processing_display()}, Llegada: {package.arrival_date}")
        
        # 8. Crear cuentas de compra (BuyingAccounts)
        print("\n💳 Creando cuentas de compra...")
        
        buying_accounts = []
        account_names = [
            'Cuenta Amazon Principal',
            'Cuenta eBay Business',
            'Cuenta Walmart Premium',
            'Cuenta Best Buy Rewards',
            'Cuenta Target Circle'
        ]
        
        for i, shop in enumerate(shops):
            if i < len(account_names):
                account, created = BuyingAccounts.objects.get_or_create(
                    account_name=account_names[i],
                    defaults={'shop': shop}
                )
                buying_accounts.append(account)
                if created:
                    print(f"  ✓ Cuenta creada: {account.account_name} ({shop.name})")
                else:
                    print(f"  ℹ Cuenta ya existe: {account.account_name}")
        
        # 9. Crear recibos de compra (ShoppingReceip) y productos comprados (ProductBuyed)
        print("\n🛍️ Creando recibos de compra y productos comprados...")
        
        shopping_receips = []
        products_buyed_list = []
        
        # Obtener productos de órdenes procesando o completadas que aún no han sido comprados
        from django.db.models import F
        eligible_products = Product.objects.filter(
            order__status__in=['procesando', 'completado', 'encargado']
        ).exclude(
            status='comprado'
        )[:20]  # Primeros 20 productos
        
        if not eligible_products.exists():
            print("  ℹ No hay productos elegibles, usando todos los productos disponibles")
            eligible_products = Product.objects.all()[:20]
        
        # Agrupar productos por shop para crear recibos
        from collections import defaultdict
        products_by_shop = defaultdict(list)
        
        for product in eligible_products:
            products_by_shop[product.shop].append(product)
        
        for shop, shop_products in products_by_shop.items():
            # Buscar cuenta de compra para este shop
            buying_account = next((acc for acc in buying_accounts if acc.shop == shop), None)
            
            if not buying_account:
                # Crear cuenta temporal si no existe
                buying_account = BuyingAccounts.objects.create(
                    account_name=f'Cuenta {shop.name}',
                    shop=shop
                )
                buying_accounts.append(buying_account)
            
            # Crear recibo de compra
            shopping_date = timezone.now() - timedelta(days=random.randint(1, 30))
            
            shopping_receip = ShoppingReceip.objects.create(
                shopping_account=buying_account,
                shop_of_buy=shop,
                status_of_shopping=random.choice(['pagado', 'no pagado', 'parcial']),
                buy_date=shopping_date
            )
            shopping_receips.append(shopping_receip)
            
            total_cost = 0
            products_count = 0
            
            # Crear productos comprados para este recibo
            for product in shop_products[:5]:  # Máximo 5 productos por recibo
                # Cantidad a comprar (puede ser parcial o total)
                pending_amount = product.amount_requested - product.amount_purchased
                if pending_amount <= 0:
                    continue
                    
                amount_to_buy = random.randint(1, max(1, pending_amount))
                
                # Calcular costos
                actual_cost = product.shop_cost
                shop_discount = actual_cost * random.uniform(0, 0.15)  # 0-15% descuento
                offer_discount = actual_cost * random.uniform(0, 0.10)  # 0-10% descuento adicional
                real_cost = actual_cost - shop_discount - offer_discount
                
                product_buyed = ProductBuyed.objects.create(
                    original_product=product,
                    actual_cost_of_product=actual_cost,
                    shop_discount=shop_discount,
                    offer_discount=offer_discount,
                    buy_date=shopping_date,
                    shoping_receip=shopping_receip,
                    amount_buyed=amount_to_buy,
                    real_cost_of_product=real_cost,
                    observation=f'Compra de {amount_to_buy} unidades con descuento'
                )
                products_buyed_list.append(product_buyed)
                total_cost += real_cost * amount_to_buy
                products_count += 1
                
                # IMPORTANTE: Actualizar amount_purchased del producto
                product.amount_purchased += amount_to_buy
                product.save(update_fields=['amount_purchased'])
            
            print(f"  ✓ Recibo de compra creado: {shop.name}")
            print(f"    {products_count} productos, Total: ${total_cost:.2f}")
            print(f"    Estado: {shopping_receip.get_status_of_shopping_display()}")
        
        # 10. Crear productos recibidos (ProductReceived)
        print("\n📥 Creando productos recibidos...")
        
        products_received_list = []
        
        # Obtener productos que ya fueron comprados
        bought_products = Product.objects.filter(
            amount_purchased__gt=0
        )[:20]  # Primeros 20 productos comprados
        
        for product in bought_products:
            # Crear 1-2 registros de recepción por producto
            num_receptions = random.randint(1, 2)
            
            for _ in range(num_receptions):
                # Cantidad recibida (puede ser parcial)
                max_receivable = product.amount_purchased - product.amount_delivered
                if max_receivable <= 0:
                    continue
                
                amount_received = random.randint(1, min(max_receivable, 3))
                
                # Buscar un paquete para asociar (si existe)
                available_package = packages[random.randint(0, len(packages)-1)] if packages else None
                
                product_received = ProductReceived.objects.create(
                    original_product=product,
                    package=available_package,
                    amount_received=amount_received,
                    observation=f'Recepción de {amount_received} unidades'
                )
                products_received_list.append(product_received)
                
                # Actualizar amount_delivered del producto
                product.amount_delivered += amount_received
                product.save(update_fields=['amount_delivered'])
        
        print(f"  ✓ Total productos recibidos: {len(products_received_list)}")
        for pr in products_received_list[:5]:  # Mostrar primeros 5
            pkg_info = f"Paquete: {pr.package.number_of_tracking}" if pr.package else "Sin paquete"
            print(f"    • {pr.original_product.name}: {pr.amount_received} unidades ({pkg_info})")
        
        # 11. Crear más deliveries (recibos de entrega)
        print("\n🚚 Creando más deliveries...")
        
        deliveries = []
        
        # Lista de categorías para asignar
        category_list = list(categories.values())
        
        # Crear deliveries para todos los clientes con más variedad
        for i, client in enumerate(clients, 1):
            # Crear 2-4 deliveries por cliente
            num_deliveries = random.randint(2, 4)
            
            for j in range(num_deliveries):
                delivery_date = timezone.now() - timedelta(days=random.randint(0, 60))
                
                # Asignar una categoría aleatoria
                category = random.choice(category_list)
                
                # Calcular costos basados en la categoría
                weight = float(random.uniform(1.0, 25.0))  # Peso en libras
                # Usar el costo de envío de la categoría
                weight_cost = weight * float(category.shipping_cost_per_pound)
                
                # Calcular ganancia del agente (si tiene)
                agent = client.assigned_agent
                manager_profit = 0.0
                if agent and agent.agent_profit:
                    # La ganancia del agente es un porcentaje del costo total
                    manager_profit = weight_cost * (agent.agent_profit / 100)
                
                delivery = DeliverReceip.objects.create(
                    client=client,
                    category=category,
                    weight=weight,
                    status=random.choice(['pendiente', 'en proceso', 'entregado', 'cancelado']),
                    deliver_date=delivery_date,
                    weight_cost=weight_cost,
                    manager_profit=manager_profit
                )
                deliveries.append(delivery)
                
                if j == 0:  # Solo mostrar el primero de cada cliente
                    agent_info = f" (Ganancia: ${manager_profit:.2f})" if agent else " (Sin agente)"
                    category_info = f" - {category.name} (${category.shipping_cost_per_pound}/lb)"
                    print(f"  ✓ {num_deliveries} Deliveries para {client.full_name}{agent_info}{category_info}")
        
        print(f"  ✓ Total de deliveries creados: {len(deliveries)}")
        
        # 12. Asociar productos con deliveries (ProductDelivery)
        print("\n📦 Asociando productos con deliveries...")
        
        product_deliveries = []
        
        # Para cada delivery que esté entregado o en proceso, agregar productos
        active_deliveries = [d for d in deliveries if d.status in ['entregado', 'en proceso']]
        
        # También agregar algunos deliveries pendientes para simular preparación
        pending_list = [d for d in deliveries if d.status == 'pendiente']
        pending_deliveries = pending_list[:len(pending_list)//2] if pending_list else []
        
        all_deliveries_to_process = active_deliveries + pending_deliveries
        
        for delivery in all_deliveries_to_process:
            # Obtener productos del cliente de este delivery
            client_orders = Order.objects.filter(
                client=delivery.client, 
                status__in=['completado', 'procesando', 'encargado']
            )
            
            if not client_orders.exists():
                continue
            
            # Aumentar la cantidad de productos por delivery: 2-6 productos
            num_products = random.randint(2, 6)
            
            # Tomar productos de las órdenes del cliente
            client_products = Product.objects.filter(
                order__in=client_orders,
                amount_purchased__gt=0
            ).order_by('?')[:num_products]  # Random order
            
            delivery_has_products = False
            
            for product in client_products:
                # Cantidad a entregar (máximo lo que se ha recibido y aún no se ha entregado)
                max_deliverable = product.amount_purchased - product.amount_delivered
                
                if max_deliverable <= 0:
                    continue
                
                # Aumentar la cantidad por producto: 1-5 unidades
                amount_to_deliver = random.randint(1, min(max_deliverable, 5))
                
                product_delivery = ProductDelivery.objects.create(
                    original_product=product,
                    deliver_receip=delivery,
                    amount_delivered=amount_to_deliver,
                    reception=delivery.deliver_date.date() if delivery.deliver_date else timezone.now().date()
                )
                product_deliveries.append(product_delivery)
                delivery_has_products = True
            
            # Mensaje de confirmación para deliveries con productos
            if delivery_has_products:
                products_count = ProductDelivery.objects.filter(deliver_receip=delivery).count()
                print(f"  ✓ Delivery #{delivery.id} ({delivery.client.full_name}): {products_count} productos asociados")
        
        print(f"\n  ✓ Total productos asociados a deliveries: {len(product_deliveries)}")
        total_units = sum(pd.amount_delivered for pd in product_deliveries)
        print(f"  ✓ Total unidades entregadas: {total_units}")
        
        if product_deliveries:
            print("\n  📋 Ejemplos de productos en deliveries:")
            for pd in product_deliveries[:8]:  # Mostrar primeros 8
                print(f"    • {pd.original_product.name}: {pd.amount_delivered} unidades → Delivery #{pd.deliver_receip.id} ({pd.deliver_receip.status})")
        
        print("\n" + "="*70)
        print("✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE")
        print("="*70)
        
        # Resumen completo
        print("\n📊 RESUMEN COMPLETO:")
        print(f"\n  👥 USUARIOS:")
        print(f"    • Total de usuarios: {CustomUser.objects.count()}")
        print(f"    • Agentes: {CustomUser.objects.filter(role='agent').count()}")
        print(f"    • Clientes: {CustomUser.objects.filter(role='client').count()}")
        print(f"    • Clientes con agente: {CustomUser.objects.filter(role='client', assigned_agent__isnull=False).count()}")
        print(f"    • Clientes sin agente: {CustomUser.objects.filter(role='client', assigned_agent__isnull=True).count()}")
        print(f"    • Otros roles: {CustomUser.objects.exclude(role__in=['agent', 'client', 'admin']).count()}")
        
        print(f"\n  🏪 SHOPS:")
        print(f"    • Total de shops: {Shop.objects.count()}")
        print(f"    • Shops activos: {Shop.objects.filter(is_active=True).count()}")
        for shop in Shop.objects.all()[:5]:
            print(f"      - {shop.name} (Tax: {shop.tax_rate}%)")
        
        print(f"\n  📂 CATEGORÍAS:")
        print(f"    • Total de categorías: {Category.objects.count()}")
        for cat in list(categories.values())[:5]:
            print(f"      - {cat.name} (${cat.shipping_cost_per_pound}/lb)")
        
        print(f"\n  📦 PRODUCTOS:")
        print(f"    • Total de productos en órdenes: {Product.objects.count()}")
        print(f"    • Productos entregados: {Product.objects.filter(status='delivered').count()}")
        print(f"    • Valor total productos: ${sum(Decimal(str(p.total_cost * p.amount_requested)) for p in Product.objects.all()):.2f}")
        
        print(f"\n  🛒 ÓRDENES:")
        print(f"    • Total de órdenes: {Order.objects.count()}")
        print(f"    • Encargadas: {Order.objects.filter(status='encargado').count()}")
        print(f"    • Procesando: {Order.objects.filter(status='procesando').count()}")
        print(f"    • Completadas: {Order.objects.filter(status='completado').count()}")
        print(f"    • Canceladas: {Order.objects.filter(status='cancelado').count()}")
        total_orders_value = sum(o.total_cost() for o in Order.objects.all())
        print(f"    • Valor total órdenes: ${total_orders_value:.2f}")
        
        print(f"\n  📦 PAQUETES:")
        print(f"    • Total de paquetes: {Package.objects.count()}")
        print(f"    • Enviados: {Package.objects.filter(status_of_processing='enviado').count()}")
        print(f"    • En tránsito: {Package.objects.filter(status_of_processing='en transito').count()}")
        print(f"    • Entregados: {Package.objects.filter(status_of_processing='entregado').count()}")
        print(f"    • Devueltos: {Package.objects.filter(status_of_processing='devuelto').count()}")
        
        print(f"\n  � CUENTAS DE COMPRA:")
        print(f"    • Total de cuentas: {BuyingAccounts.objects.count()}")
        for acc in BuyingAccounts.objects.all()[:5]:
            print(f"      - {acc.account_name}")
        
        print(f"\n  🛍️ RECIBOS DE COMPRA:")
        print(f"    • Total de recibos: {ShoppingReceip.objects.count()}")
        print(f"    • Pagados: {ShoppingReceip.objects.filter(status_of_shopping='pagado').count()}")
        print(f"    • No pagados: {ShoppingReceip.objects.filter(status_of_shopping='no pagado').count()}")
        print(f"    • Parciales: {ShoppingReceip.objects.filter(status_of_shopping='parcial').count()}")
        
        print(f"\n  🛒 PRODUCTOS COMPRADOS:")
        print(f"    • Total de productos comprados: {ProductBuyed.objects.count()}")
        total_buyed_cost = sum(pb.real_cost_of_product * pb.amount_buyed for pb in ProductBuyed.objects.all())
        total_saved = sum((pb.shop_discount + pb.offer_discount) * pb.amount_buyed for pb in ProductBuyed.objects.all())
        print(f"    • Costo total: ${total_buyed_cost:.2f}")
        print(f"    • Ahorrado en descuentos: ${total_saved:.2f}")
        
        print(f"\n  📥 PRODUCTOS RECIBIDOS:")
        print(f"    • Total de productos recibidos: {ProductReceived.objects.count()}")
        total_received_amount = sum(pr.amount_received for pr in ProductReceived.objects.all())
        print(f"    • Cantidad total recibida: {total_received_amount} unidades")
        with_package = ProductReceived.objects.filter(package__isnull=False).count()
        print(f"    • Con paquete asociado: {with_package}")
        
        print(f"\n  � DELIVERIES:")
        print(f"    • Total de entregas: {DeliverReceip.objects.count()}")
        print(f"    • Pendientes: {DeliverReceip.objects.filter(status='pendiente').count()}")
        print(f"    • En proceso: {DeliverReceip.objects.filter(status='en proceso').count()}")
        print(f"    • Entregados: {DeliverReceip.objects.filter(status='entregado').count()}")
        total_weight_cost = sum(d.weight_cost for d in DeliverReceip.objects.all())
        total_manager_profit = sum(d.manager_profit for d in DeliverReceip.objects.all())
        print(f"    • Costo total por peso: ${total_weight_cost:.2f}")
        print(f"    • Ganancia total agentes: ${total_manager_profit:.2f}")
        print(f"    • Total general: ${total_weight_cost + total_manager_profit:.2f}")
        
        print(f"\n  📦 PRODUCTOS EN DELIVERIES:")
        print(f"    • Total de productos entregados: {ProductDelivery.objects.count()}")
        total_delivered_units = sum(pd.amount_delivered for pd in ProductDelivery.objects.all())
        print(f"    • Unidades totales entregadas: {total_delivered_units}")
        deliveries_with_products = DeliverReceip.objects.filter(delivered_products__isnull=False).distinct().count()
        print(f"    • Deliveries con productos: {deliveries_with_products}")
        
        print("\n🔑 CREDENCIALES:")
        print("  Usuario: [cualquier teléfono de arriba]")
        print("  Contraseña: test123456")
        
        print("\n📝 CASOS DE PRUEBA CUBIERTOS:")
        print("  ✓ Usuarios con/sin email")
        print("  ✓ Usuarios con/sin dirección")
        print("  ✓ Clientes con/sin agente asignado")
        print("  ✓ Agentes con diferentes ganancias")
        print("  ✓ Múltiples shops con diferentes tasas de impuesto")
        print("  ✓ Categorías con diferentes costos de envío por libra")
        print("  ✓ Productos de diferentes categorías y shops")
        print("  ✓ Productos con cálculo de impuestos de shop")
        print("  ✓ Órdenes en diferentes estados (encargado, procesando, completado, cancelado)")
        print("  ✓ Órdenes con múltiples productos")
        print("  ✓ Órdenes con diferentes estados de pago")
        print("  ✓ Paquetes de diferentes agencias (DHL, FedEx, UPS, etc.)")
        print("  ✓ Paquetes en diferentes estados de procesamiento")
        print("  ✓ Cuentas de compra para diferentes shops")
        print("  ✓ Recibos de compra con múltiples productos")
        print("  ✓ Productos comprados con descuentos de shop y ofertas")
        print("  ✓ Productos recibidos asociados a paquetes")
        print("  ✓ Productos con seguimiento de cantidades (solicitado/comprado/recibido/entregado)")
        print("  ✓ Deliveries con cálculo de ganancia de agente basado en peso")
        print("  ✓ Deliveries en diferentes estados")
        print("  ✓ Productos asociados a deliveries (ProductDelivery)")
        print("  ✓ Deliveries con productos entregados")
        print("  ✓ Relaciones completas entre todos los modelos")
        
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
