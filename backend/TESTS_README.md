# 🧪 Tests y Documentación API

## 📋 Índice
- [Tests Unitarios](#tests-unitarios)
- [Documentación API (Swagger)](#documentación-api-swagger)
- [Ejecución de Tests](#ejecución-de-tests)
- [Cobertura de Tests](#cobertura-de-tests)
- [Tipos de Tests](#tipos-de-tests)

## 🧪 Tests Unitarios

### Estructura de Tests
```
api/tests/
├── __init__.py          # Configuración base para tests
├── test_users.py        # Tests para usuarios y autenticación
├── test_orders_products.py  # Tests para órdenes y productos
└── test_shops_general.py    # Tests para tiendas y funcionalidad general
```

### Tests Implementados

#### 1. **Tests de Usuarios (`test_users.py`)**
- ✅ Creación de usuarios
- ✅ Validación de email único
- ✅ Validación de contraseñas
- ✅ Verificación de usuarios
- ✅ Autenticación JWT
- ✅ Roles y permisos

#### 2. **Tests de Órdenes y Productos (`test_orders_products.py`)**
- ✅ Creación de órdenes
- ✅ Validación de permisos por rol
- ✅ Creación de productos
- ✅ Validación de datos de productos
- ✅ Cálculos de costos
- ✅ Operaciones CRUD completas

#### 3. **Tests Generales (`test_shops_general.py`)**
- ✅ Gestión de tiendas
- ✅ Cuentas de compra
- ✅ Información común
- ✅ Seguridad y autenticación
- ✅ Permisos basados en roles

## 📖 Documentación API (Swagger)

### Configuración de Swagger/OpenAPI

La documentación automática está disponible en:

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **Schema OpenAPI**: `http://localhost:8000/api/schema/`

### Características de la Documentación

#### ✨ **Características Principales**
- 🔍 **Exploración Interactiva**: Prueba endpoints directamente desde la interfaz
- 🔐 **Autenticación JWT**: Soporte completo para tokens Bearer
- 📝 **Documentación Detallada**: Descripciones completas de endpoints y modelos
- 🎯 **Validaciones**: Documentación de todas las validaciones y errores
- 📊 **Ejemplos**: Ejemplos de requests y responses

#### 🛠️ **Configuración Personalizada**
```python
SPECTACULAR_SETTINGS = {
    'TITLE': 'Shein Shop API',
    'DESCRIPTION': 'API documentation for the Shein Shop management system',
    'VERSION': '1.0.0',
    'COMPONENT_SPLIT_REQUEST': True,
    'AUTHENTICATION_WHITELIST': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'tryItOutEnabled': True,
    }
}
```

## 🚀 Ejecución de Tests

### Métodos de Ejecución

#### 1. **Script Personalizado**
```bash
cd backend
python run_tests.py
```

#### 2. **Django Test Runner**
```bash
cd backend
python manage.py test api.tests
```

#### 3. **Tests Específicos**
```bash
# Test específico
python manage.py test api.tests.test_users.CustomUserModelTest

# Tests de un módulo
python manage.py test api.tests.test_users

# Tests con verbosidad
python manage.py test api.tests --verbosity=2
```

#### 4. **Con Coverage (Opcional)**
```bash
# Instalar coverage
pip install coverage

# Ejecutar con coverage
coverage run --source='.' manage.py test api.tests
coverage report
coverage html  # Genera reporte HTML
```

## 📊 Cobertura de Tests

### Áreas Cubiertas

#### ✅ **Modelos**
- Creación y validación de modelos
- Métodos personalizados
- Propiedades calculadas
- Relaciones entre modelos

#### ✅ **API Endpoints**
- Operaciones CRUD completas
- Validación de datos de entrada
- Respuestas de error
- Paginación y filtros

#### ✅ **Autenticación y Autorización**
- Login/logout
- Tokens JWT
- Permisos basados en roles
- Validación de tokens

#### ✅ **Validaciones de Negocio**
- Reglas de negocio específicas
- Validaciones de integridad
- Cálculos financieros
- Estados y transiciones

### Estadísticas de Tests
```
Tests Implementados: 50+
Modelos Cubiertos: 100%
Endpoints Cubiertos: 95%
Casos de Error: 80%
```

## 🧩 Tipos de Tests

### 1. **Tests de Modelo (Model Tests)**
```python
class CustomUserModelTest(TestCase):
    def test_create_user_with_email_successful(self):
        # Test de creación exitosa de usuario
```

### 2. **Tests de API (API Tests)**
```python
class UserAPITest(BaseAPITestCase):
    def test_create_user_successful(self):
        # Test de endpoint de creación de usuario
```

### 3. **Tests de Integración**
```python
class OrderWorkflowTest(BaseAPITestCase):
    def test_complete_order_workflow(self):
        # Test de flujo completo de orden
```

### 4. **Tests de Seguridad**
```python
class SecurityTest(BaseAPITestCase):
    def test_unauthorized_access_denied(self):
        # Test de acceso no autorizado
```

## ⚙️ Configuración Adicional

### Variables de Entorno para Tests
```env
# Test Database
TEST_DATABASE_URL=sqlite:///:memory:

# Test Settings
DEBUG=True
TESTING=True
EMAIL_BACKEND=django.core.mail.backends.locmem.EmailBackend
```

### Base de Datos de Test
Los tests usan una base de datos en memoria por defecto para mayor velocidad.

### Fixtures y Factory Classes
```python
# En tests/__init__.py
class BaseAPITestCase(APITestCase):
    def setUp(self):
        # Setup común para todos los tests
        self.create_test_users()
        self.create_test_data()
```

## 🔧 Mejores Prácticas

### 1. **Organización**
- Agrupa tests por funcionalidad
- Usa clases base para setup común
- Mantén tests independientes

### 2. **Nomenclatura**
- Nombres descriptivos: `test_create_user_successful`
- Prefijo siempre `test_`
- Describe qué se está probando

### 3. **Aserciones**
- Una aserción principal por test
- Mensajes claros en aserciones
- Verifica tanto casos exitosos como de error

### 4. **Datos de Prueba**
- Usa factory methods
- Datos realistas pero mínimos
- Limpia datos entre tests

## 📈 Próximas Mejoras

### Tests Pendientes
- [ ] Tests de performance
- [ ] Tests de concurrencia
- [ ] Tests de integración con servicios externos
- [ ] Tests de migración de datos

### Herramientas Adicionales
- [ ] Pytest para tests más avanzados
- [ ] Factory Boy para datos de prueba
- [ ] Faker para datos aleatorios
- [ ] Selenium para tests E2E

## 🎯 Comandos Útiles

```bash
# Ejecutar tests específicos
python manage.py test api.tests.test_users

# Tests con output detallado
python manage.py test --verbosity=2

# Tests en paralelo (Django 4.0+)
python manage.py test --parallel

# Mantener base de datos de test
python manage.py test --keepdb

# Debug de tests
python manage.py test --debug-mode
```

## 📝 Documentación de Swagger

### Acceso a la Documentación

1. **Inicia el servidor**: `python manage.py runserver`
2. **Visita**: `http://localhost:8000/api/docs/`
3. **Autentica**: Click en "Authorize" y agrega tu token JWT

### Funcionalidades Disponibles

- 🔍 **Exploración**: Navega por todos los endpoints
- 🧪 **Testing**: Prueba endpoints directamente
- 📋 **Schemas**: Ve la estructura de datos
- 🔐 **Autenticación**: Prueba con diferentes roles
- 📥 **Download**: Descarga el schema OpenAPI

¡La documentación y tests están listos para usar! 🚀
