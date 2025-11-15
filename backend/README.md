# 🏪 Shein Shop API - Backend

> **Django REST API** para el sistema de gestión de tiendas Shein Shop

[![Django](https://img.shields.io/badge/Django-5.1.1-092E20?logo=django)](https://djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.15.2-FF1709?logo=django-rest-framework)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://postgresql.org/)

## 📋 Descripción

API RESTful desarrollada con Django REST Framework para gestionar operaciones de e-commerce incluyendo usuarios, órdenes, productos, entregas y scraping de Amazon.

## 🚀 Características

- ✅ **Autenticación JWT** - Tokens seguros con refresh
- ✅ **Gestión de usuarios** - Roles (Admin, Agent, Buyer, Logistical, Client)
- ✅ **Sistema de órdenes** - Ciclo completo de pedidos
- ✅ **Catálogo de productos** - Gestión completa de inventario
- ✅ **Sistema de entregas** - Seguimiento y gestión logística
- ✅ **Scraping de Amazon** - Extracción automática de datos
- ✅ **Carga de imágenes** - Integración con Cloudinary
- ✅ **Documentación API** - Swagger/OpenAPI con drf-spectacular
- ✅ **Logs estructurados** - Sistema completo de logging
- ✅ **Configuración modular** - Settings por entorno
- ✅ **Tests automatizados** - Cobertura completa
- ✅ **Docker support** - Contenedorización completa

## 🏗️ Arquitectura

```
📁 backend/
├── 📁 config/                    # Configuración Django
│   ├── settings/
│   │   ├── __init__.py          # Settings dinámicos por entorno
│   │   ├── base.py              # Configuración base
│   │   ├── development.py       # Config desarrollo
│   │   └── production.py        # Config producción
│   ├── urls.py                  # URLs principales
│   └── wsgi.py
├── 📁 api/                      # Aplicación principal
│   ├── models/                  # Modelos modulares
│   ├── serializers/             # Serializers modulares
│   ├── views/                   # Vistas modulares
│   ├── services/                # Lógica de negocio
│   │   ├── amazon_scraping_service.py
│   │   └── profit_service.py
│   ├── middleware/              # Middleware personalizado
│   ├── permissions/             # Permisos personalizados
│   ├── tests/                   # Tests organizados
│   └── utils/                   # Utilidades
├── 📁 scripts/                  # Scripts de automatización
├── 📁 logs/                     # Archivos de log
├── requirements.txt             # Dependencias Python
├── pytest.ini                  # Configuración de tests
├── Dockerfile                  # Contenedor Docker
├── docker-compose.yml          # Orquestación
└── manage.py
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Python 3.12+
- PostgreSQL 15+ (opcional, usa SQLite por defecto)
- Redis (opcional, para caching)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Crear entorno virtual**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # o
   venv\Scripts\activate     # Windows
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

5. **Ejecutar migraciones**
   ```bash
   python manage.py migrate
   ```

6. **Crear superusuario**
   ```bash
   python manage.py createsuperuser
   ```

7. **Ejecutar servidor**
   ```bash
   python manage.py runserver
   ```

## 🐳 Docker

### Desarrollo con Docker Compose

```bash
# Construir y ejecutar
docker-compose up --build

# Ejecutar en background
docker-compose up -d

# Ver logs
docker-compose logs -f web

# Ejecutar comandos
docker-compose exec web python manage.py shell
```

### Producción

```bash
# Construir imagen
docker build -t shein-shop-api .

# Ejecutar contenedor
docker run -p 8000:8000 shein-shop-api
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
python manage.py test

# Con cobertura
pytest --cov=api --cov-report=html

# Tests específicos
python manage.py test api.tests.test_users
```

## 📚 API Documentation

La documentación completa de la API está disponible en:

- **Swagger UI**: `http://localhost:8000/api/schema/swagger-ui/`
- **ReDoc**: `http://localhost:8000/api/schema/redoc/`
- **OpenAPI Schema**: `http://localhost:8000/api/schema/`

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DJANGO_ENV` | Entorno (development/production) | development |
| `DEBUG` | Modo debug | True |
| `SECRET_KEY` | Clave secreta Django | - |
| `DATABASE_URL` | URL de base de datos | SQLite local |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `EMAIL_BACKEND` | Backend de email | console |

### Comandos Útiles

```bash
# Verificar configuración
python manage.py check

# Crear migraciones
python manage.py makemigrations

# Ejecutar migraciones
python manage.py migrate

# Recopilar archivos estáticos
python manage.py collectstatic

# Crear admin
python manage.py create_admin
```

## 🔒 Seguridad

- Autenticación JWT con refresh tokens
- Permisos granulares por rol
- Validación de entrada
- Protección CSRF
- Headers de seguridad
- Rate limiting (configurable)

## 📊 Monitoreo

- Logs estructurados
- Middleware de logging de requests
- Health checks
- Métricas de sistema
- Alertas de errores

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- 📧 Email: support@sheinshop.com
- 📖 Docs: [Documentación completa](docs/)
- 🐛 Issues: [GitHub Issues](issues/)

---

**Desarrollado con ❤️ por el equipo de Shein Shop**