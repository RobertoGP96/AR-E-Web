# 🏗️ API Structure Documentation

## 📁 Estructura Organizada de la API

Esta documentación describe la estructura modular y organizada de la aplicación Django API.

### 📂 Estructura General

```
api/
├── 📄 admin.py                 # Configuración Django Admin
├── 📄 api_urls.py              # URLs principales de la API
├── 📄 apps.py                  # Configuración de la aplicación Django
├── 📄 enums.py                 # Enumeraciones globales del sistema
├── 📄 forms.py                 # Formularios Django
├── 📄 managers.py              # Managers personalizados de modelos
├── 📁 management/              # Comandos de management Django
├── 📁 middleware/              # Middleware personalizado
├── 📁 migrations/              # Migraciones de base de datos
├── 📁 models/                  # Modelos de datos organizados por dominio
├── 📁 notifications/           # Sistema completo de notificaciones
├── 📁 permissions/             # Permisos personalizados
├── 📁 serializers/             # Serializers para API REST
├── 📁 services/                # Lógica de negocio (servicios)
├── 📁 signals/                 # Señales Django
├── 📁 templates/               # Plantillas de email y otros
├── 📁 tests/                   # Tests automatizados
├── 📁 utils/                   # Utilidades y helpers
├── 📁 views/                   # Vistas y ViewSets de la API
└── 📄 __init__.py
```

---

## 📋 Descripción de Carpetas

### 🎯 **Archivos en la Raíz**

| Archivo | Propósito |
|---------|-----------|
| `admin.py` | Configuración del panel de administración Django |
| `api_urls.py` | Definición de rutas URL principales de la API |
| `apps.py` | Configuración de la aplicación Django |
| `enums.py` | Enumeraciones y constantes globales del sistema |
| `forms.py` | Formularios Django para validación y procesamiento |
| `managers.py` | Managers personalizados para consultas complejas |

### 📁 **models/** - Modelos de Datos

Modelos organizados por dominio de negocio:

```
models/
├── common.py           # Modelos compartidos (CommonInformation)
├── deliveries.py       # Modelos de entregas (DeliverReceip, ProductDelivery)
├── orders.py           # Modelos de pedidos (Order)
├── products.py         # Modelos de productos (Product, ProductBuyed, etc.)
├── shops.py            # Modelos de tiendas (Shop)
├── users.py            # Modelos de usuarios (CustomUser)
└── models_expected_metrics.py  # Modelos de métricas esperadas
```

### 📁 **notifications/** - Sistema de Notificaciones

Módulo completo para manejo de notificaciones:

```
notifications/
├── email_notifications.py      # Envío de emails
├── examples_notifications_usage.py  # Ejemplos de uso
├── grouping_notifications.py   # Agrupación de notificaciones
├── models_notifications.py     # Modelos de notificaciones
├── realtime_notifications.py   # Notificaciones en tiempo real
├── serializers_notifications.py # Serializers para notificaciones
├── signals_notifications.py    # Señales para notificaciones
├── throttling_notifications.py # Control de frecuencia
├── urls_notifications.py       # URLs de notificaciones
├── views_notifications.py      # Vistas de notificaciones
└── __init__.py
```

### 📁 **serializers/** - Serializers REST

Serializers organizados por funcionalidad:

```
serializers/
├── amazon_serializers.py       # Serializers para Amazon API
├── common_serializers.py       # Serializers comunes
├── deliveries_serializers.py   # Serializers de entregas
├── orders_serializers.py       # Serializers de pedidos
├── products_serializers.py     # Serializers de productos
├── serializers_expected_metrics.py  # Serializers de métricas
├── shops_serializers.py        # Serializers de tiendas
├── users_serializers.py        # Serializers de usuarios
└── __init__.py
```

### 📁 **views/** - Vistas y ViewSets

Vistas organizadas por dominio:

```
views/
├── amazon_views.py             # Vistas de Amazon API
├── auth_views.py               # Vistas de autenticación
├── common_views.py             # Vistas comunes
├── dashboard_views.py          # Vistas del dashboard
├── delivery_views.py           # Vistas de entregas
├── order_views.py              # Vistas de pedidos
├── product_views.py            # Vistas de productos
├── shop_views.py               # Vistas de tiendas
├── user_views.py               # Vistas de usuarios
├── views_expected_metrics.py   # Vistas de métricas esperadas
└── __init__.py
```

### 📁 **services/** - Lógica de Negocio

Servicios que encapsulan la lógica de negocio:

```
services/
├── amazon_scraping_service.py  # Servicio de scraping de Amazon
├── expected_metrics_service.py # Servicio de métricas esperadas
├── profit_service.py           # Servicio de cálculos de ganancias
└── __init__.py
```

---

## 🎯 Principios de Organización

### ✅ **Separación por Responsabilidades**
- **Modelos**: Solo definición de datos y lógica básica
- **Serializers**: Solo transformación de datos
- **Views**: Solo manejo de requests/responses HTTP
- **Services**: Toda la lógica de negocio compleja

### ✅ **Organización por Dominio**
- Archivos agrupados por funcionalidad/feature
- Nombres descriptivos que indican el propósito
- Estructura jerárquica clara

### ✅ **Consistencia de Nomenclatura**
- `*_views.py` para vistas
- `*_serializers.py` para serializers
- `*_service.py` para servicios
- `models_*.py` para modelos específicos

### ✅ **Módulos Bien Definidos**
- Cada carpeta es un módulo Python válido
- `__init__.py` en cada carpeta
- Imports organizados y documentados

---

## 🚀 Beneficios de Esta Organización

### 📈 **Mantenibilidad**
- Fácil localizar archivos relacionados
- Cambios isolados por funcionalidad
- Menos conflictos en desarrollo colaborativo

### 🔍 **Descubribilidad**
- Estructura intuitiva
- Nombres descriptivos
- Documentación clara por módulo

### 🧪 **Testabilidad**
- Tests organizados por módulo
- Fácil identificar qué probar
- Cobertura por funcionalidad

### 👥 **Colaboración**
- Trabajo paralelo en diferentes módulos
- Interfaces claras entre componentes
- Menos dependencias entre desarrolladores

---

## 📝 Guías de Desarrollo

### 🆕 **Agregando Nueva Funcionalidad**
1. Identificar el dominio (ej: `orders`, `products`)
2. Crear archivos en las carpetas correspondientes
3. Seguir la nomenclatura establecida
4. Actualizar imports y documentación

### 🔧 **Modificando Funcionalidad Existente**
1. Localizar archivos en la estructura organizada
2. Verificar dependencias entre módulos
3. Actualizar tests correspondientes
4. Mantener interfaces consistentes

### 🧪 **Agregando Tests**
1. Tests en `tests/` organizados por funcionalidad
2. Nombrado: `test_*.py`
3. Cobertura completa de nuevos módulos

---

**Esta estructura proporciona una base sólida para el crecimiento y mantenimiento del proyecto. 🎯**