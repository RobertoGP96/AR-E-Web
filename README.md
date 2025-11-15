# 🏪 Shein Shop Management System

> **Monorepo Full-Stack** para el sistema de gestión de tiendas con React + Django

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.1.1-092E20?logo=django)](https://djangoproject.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)](https://typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.11-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com/)

## 📋 Descripción del Proyecto

Sistema completo de gestión para tiendas que incluye manejo de usuarios, órdenes, productos, tiendas y cuentas de compra. Desarrollado con arquitectura moderna separando completamente frontend y backend, utilizando un monorepo con pnpm workspaces para una gestión eficiente de dependencias.

## ✨ Características Destacadas

- ✅ **Arquitectura Modular** - Settings por entorno, servicios de negocio, middleware personalizado
- ✅ **Monorepo con pnpm** - Gestión eficiente de workspaces y dependencias
- ✅ **Containerización** - Docker completo para desarrollo y producción
- ✅ **CI/CD Pipeline** - GitHub Actions con calidad de código automatizada
- ✅ **Testing Framework** - pytest para backend, preparado para frontend
- ✅ **Documentación Completa** - README específico para cada aplicación
- ✅ **TypeScript Estricto** - Tipado fuerte en todo el frontend
- ✅ **APIs Modernas** - RESTful con documentación OpenAPI/Swagger

---

## 🏗️ Arquitectura del Proyecto

```
📁 StartNew/ (Monorepo con pnpm workspaces)
├── 📱 apps/                          # Aplicaciones Frontend
│   ├── 🎯 admin/                     # Panel administrativo avanzado
│   │   ├── 📖 README.md              # Documentación específica
│   │   ├── src/components/           # Componentes shadcn/ui
│   │   ├── src/pages/                # Páginas administrativas
│   │   └── package.json              # Dependencias específicas
│   └── 👥 client/                    # Aplicación cliente
│       ├── 📖 README.md              # Documentación específica
│       ├── src/components/           # Componentes React
│       └── package.json              # Dependencias específicas
├── 🔧 backend/                       # API REST Django
│   ├── 📖 README.md                  # Documentación específica
│   ├── config/settings/              # Settings modulares
│   ├── api/services/                 # Lógica de negocio
│   ├── api/middleware/               # Middleware personalizado
│   ├── requirements.txt              # Dependencias Python
│   ├── Dockerfile                    # Containerización
│   └── docker-compose.yml            # Orquestación
├── 📄 .github/                       # GitHub Actions & Config
│   ├── workflows/ci.yml              # Pipeline CI/CD
│   └── copilot-instructions.md       # Instrucciones para Copilot
├── 📖 README.md                      # Este archivo principal
├── 📦 package.json                   # Configuración del monorepo
├── 📦 pnpm-workspace.yaml            # Workspaces pnpm
└── 📦 pnpm-lock.yaml                 # Lockfile del monorepo
```

---

## 🎯 Aplicaciones Frontend

### 🎯 **Admin Panel** (`/apps/admin`)
Panel administrativo completo con interfaz moderna, analytics, gestión avanzada y componentes reutilizables.

#### **📦 Stack Tecnológico:**
- **React 19.1.1** + **TypeScript 5.8.3**
- **Vite 7.1.0** + **TailwindCSS 4.1.11**
- **shadcn/ui** + **Radix UI** + **Lucide Icons**
- **TanStack Query** + **React Hook Form** + **Zod**
- **Supabase** + **Cloudinary** + **Recharts**
- **React Router v7** + **Axios**

#### **🚀 Características:**
- Dashboard con métricas en tiempo real
- Gestión completa de usuarios, productos y órdenes
- Analytics con gráficos interactivos
- Sistema de QR codes y reportes PDF/Excel
- Upload de imágenes con Cloudinary
- Tema oscuro/claro automático

📖 **[Leer documentación completa →](apps/admin/README.md)**

### 👥 **Client App** (`/apps/client`)
Aplicación cliente preparada para desarrollo con arquitectura moderna y componentes reutilizables.

#### **📦 Stack Tecnológico:**
- **React 19.1.1** + **TypeScript 5.8.3**
- **Vite 7.1.0** + **TailwindCSS 4.1.11**
- **shadcn/ui** + **Radix UI** + **Lucide Icons**
- **TanStack Query** + **React Hook Form** + **Zod**
- **React Router v7** + **Axios**

#### **🚀 Características:**
- Arquitectura modular y escalable
- Componentes UI consistentes
- Gestión de estado moderna
- Formularios con validación automática
- Tema y navegación responsive

📖 **[Leer documentación completa →](apps/client/README.md)**

---

## 🔧 Backend API (`/backend`)

API REST completa desarrollada con Django, arquitectura modular y mejores prácticas de producción.

### **📦 Stack Tecnológico:**
- **Django 5.1.1** + **DRF 3.15.2**
- **PostgreSQL** (prod) / **SQLite** (dev)
- **Redis** (cache opcional)
- **Cloudinary** (medios)
- **JWT Authentication**
- **Docker** + **Gunicorn**
- **pytest** + **coverage**

### **🏗️ Arquitectura Mejorada:**
```
📁 backend/
├── 📁 config/
│   ├── settings/
│   │   ├── __init__.py          # Settings dinámicos
│   │   ├── base.py              # Configuración base
│   │   ├── development.py       # Desarrollo
│   │   └── production.py        # Producción
│   └── wsgi.py
├── 📁 api/
│   ├── models/                  # Modelos modulares
│   ├── serializers/             # Serializers modulares
│   ├── views/                   # Vistas modulares
│   ├── services/                # Lógica de negocio
│   │   ├── amazon_scraping_service.py
│   │   └── profit_service.py
│   ├── middleware/              # Middleware personalizado
│   │   ├── __init__.py
│   │   └── custom_middleware.py
│   └── tests/                   # Tests organizados
├── 📁 scripts/                  # Automatización
├── 📁 logs/                     # Sistema de logs
├── Dockerfile                   # Containerización
├── docker-compose.yml           # Orquestación
├── pytest.ini                   # Configuración tests
└── requirements.txt             # Dependencias limpias
```

### **🔐 Sistema de Autenticación:**
- **JWT Tokens** con refresh automático
- **Roles**: Admin, Agent, Buyer, Logistical, Client
- **Permisos granulares** por endpoint
- **Verificación de email** con códigos

### **📋 Endpoints API Principales:**
- `GET/POST /api/users/` - Gestión de usuarios
- `POST /api/auth/login/` - Autenticación
- `GET/POST /api/products/` - Catálogo de productos
- `GET/POST /api/orders/` - Sistema de órdenes
- `GET/POST /api/deliveries/` - Gestión de entregas

### **📖 Documentación API:**
- **Swagger UI**: `http://localhost:8000/api/schema/swagger-ui/`
- **ReDoc**: `http://localhost:8000/api/schema/redoc/`
- **OpenAPI Schema**: `http://localhost:8000/api/schema/`

📖 **[Leer documentación completa →](backend/README.md)**

---

## 🚀 Instalación y Configuración

### **📋 Prerrequisitos:**
- **Node.js** 18+ y **pnpm**
- **Python** 3.11+ y **pip**
- **Docker** (opcional pero recomendado)
- **Git**

### **⚡ Instalación Rápida:**

#### **1️⃣ Clonar el repositorio:**
```bash
git clone <repo-url>
cd StartNew
```

#### **2️⃣ Instalar dependencias del monorepo:**
```bash
# Instalar todas las dependencias
pnpm install

# Ver workspaces disponibles
pnpm ls --depth=0
```

#### **3️⃣ Configurar Backend:**
```bash
cd backend

# Con Docker (recomendado)
docker-compose up --build

# O manualmente
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
📍 **API**: `http://localhost:8000`
📍 **Docs**: `http://localhost:8000/api/schema/swagger-ui/`

#### **4️⃣ Configurar Frontend:**
```bash
# Admin Panel
cd apps/admin
pnpm dev
```
📍 **Admin**: `http://localhost:5173`

```bash
# Client App
cd apps/client
pnpm dev
```
📍 **Client**: `http://localhost:5174`

### **🐳 Docker Development:**
```bash
# Todo el stack
docker-compose up --build

# Solo backend
docker-compose up backend --build

# Con logs
docker-compose logs -f
```

---

## 🛠️ Comandos de Desarrollo

### **Monorepo (pnpm):**
```bash
# Instalar dependencias en todos los workspaces
pnpm install

# Ejecutar comando en todos los workspaces
pnpm -r run build

# Ejecutar en workspace específico
pnpm --filter admin run dev
pnpm --filter client run build
```

### **Backend:**
```bash
cd backend

# Desarrollo
python manage.py runserver
python manage.py shell

# Base de datos
python manage.py makemigrations
python manage.py migrate

# Testing
python manage.py test
pytest --cov=api --cov-report=html

# Docker
docker-compose exec web python manage.py shell
```

### **Frontend (Admin/Client):**
```bash
cd apps/admin  # o apps/client

pnpm dev         # Desarrollo
pnpm build       # Build producción
pnpm preview     # Vista previa
pnpm lint        # Linting
pnpm type-check  # Verificación tipos
```

---

## 🔧 Calidad de Código

### **Pre-commit Hooks:**
```bash
# Instalar hooks
pip install pre-commit
pre-commit install

# Ejecutar manualmente
pre-commit run --all-files
```

### **CI/CD Pipeline:**
- **GitHub Actions** automático en cada PR
- **ESLint** + **Prettier** para JavaScript/TypeScript
- **Black** + **isort** + **flake8** + **mypy** para Python
- **Tests** automatizados con cobertura
- **Build** verificado antes de merge

---

## 🌐 Despliegue

### **🎯 Admin Panel - Cloudflare Pages**
```bash
cd apps/admin
pnpm build:cloudflare
pnpm deploy:cloudflare
```

### **👥 Client App - Vercel**
```bash
cd apps/client
pnpm build:vercel
# Deploy automático desde GitHub
```

### **🔧 Backend - Render/Docker**
```bash
cd backend
docker build -t shein-shop-api .
docker run -p 8000:8000 shein-shop-api
```

### **🐳 Producción Completa:**
```bash
# Docker Compose producción
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Monitoreo y Logs

### **Backend:**
- **Logs estructurados** en `backend/logs/`
- **Middleware de logging** de requests
- **Health checks** integrados
- **Django Debug Toolbar** en desarrollo

### **Frontend:**
- **Console logging** en desarrollo
- **Error boundaries** para manejo de errores
- **Performance monitoring** preparado

---

## 🤝 Contribución

### **📋 Workflow:**
1. Fork del repositorio
2. Crear rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request con descripción detallada

### **🎯 Estándares:**
- **Conventional Commits** para mensajes
- **Tests** obligatorios para nuevas funcionalidades
- **Documentación** actualizada en cada cambio
- **Code Review** requerido antes de merge

---

## 📞 Soporte y Documentación

### **🔗 Enlaces Útiles:**
- **API Docs**: `http://localhost:8000/api/schema/swagger-ui/`
- **Admin Panel**: `http://localhost:5173`
- **Client App**: `http://localhost:5174`

### **📁 Documentación Específica:**
- 📖 **[Backend API →](backend/README.md)**
- 📖 **[Admin Panel →](apps/admin/README.md)**
- 📖 **[Client App →](apps/client/README.md)**

### **📋 Guías Adicionales:**
- `IMPLEMENTATION_CHECKLIST.md` - Checklist de implementación
- `ENVIRONMENT_CONFIG.md` - Configuración de entornos
- `DOCKER_DEPLOYMENT_GUIDE.md` - Guía de Docker

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**✨ Desarrollado con ❤️ usando tecnologías modernas y mejores prácticas de desarrollo**
```
GET    /api/users/              # Lista usuarios
POST   /api/users/              # Crear usuario
GET    /api/users/{id}/         # Detalle usuario
PUT    /api/users/{id}/         # Actualizar usuario
POST   /api/users/verify/       # Verificar email
```

#### **🔑 Autenticación (`/api/auth/`)**
```
POST   /api/auth/             # Obtener tokens
POST   /api/auth/refresh/     # Renovar token
```

#### **🏪 Tiendas (`/api/shops/`)**
```
GET    /api/shops/              # Lista tiendas
POST   /api/shops/              # Crear tienda
GET    /api/shops/{id}/         # Detalle tienda
PUT    /api/shops/{id}/         # Actualizar tienda
DELETE /api/shops/{id}/         # Eliminar tienda
```

#### **📦 Órdenes (`/api/orders/`)**
```
GET    /api/orders/             # Lista órdenes
POST   /api/orders/             # Crear orden
GET    /api/orders/{id}/        # Detalle orden
PUT    /api/orders/{id}/        # Actualizar orden
```

#### **🛍️ Productos (`/api/products/`)**
```
GET    /api/products/           # Lista productos
POST   /api/products/           # Crear producto
GET    /api/products/{id}/      # Detalle producto
PUT    /api/products/{id}/      # Actualizar producto
DELETE /api/products/{id}/      # Eliminar producto
```

### **📖 Documentación API:**
- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **Schema OpenAPI**: `http://localhost:8000/api/schema/`

### **🧪 Testing:**
- **50+ Tests Unitarios** implementados
- **Cobertura completa** de modelos y endpoints
- **Tests de seguridad** y validaciones
- **Ejecución**: `python manage.py test api.tests`

---

## 🚀 Instalación y Configuración

### **📋 Prerrequisitos:**
- **Node.js** 18+ y **pnpm**
- **Python** 3.11+ y **pip**
- **Git**

### **⚡ Instalación Rápida:**

#### **1️⃣ Clonar el repositorio:**
```bash
git clone <repo-url>
cd StartNew
```

#### **2️⃣ Configurar Frontend (Admin):**
```bash
cd apps/admin
pnpm install
pnpm dev
```
📍 **URL**: `http://localhost:5173`

#### **3️⃣ Configurar Backend:**
```bash
cd backend

# Crear entorno virtual
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver
```
📍 **API**: `http://localhost:8000`
📍 **Admin**: `http://localhost:8000/admin`
📍 **Docs**: `http://localhost:8000/api/docs/`

### **🔧 Variables de Entorno:**

#### **Backend (`.env`):**
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
RESEND_API_KEY=your-resend-key
```

---

## 🛠️ Comandos de Desarrollo

### **Frontend (Admin Panel):**
```bash
cd apps/admin

pnpm dev         # Servidor de desarrollo
pnpm build       # Build para producción
pnpm preview     # Vista previa del build
pnpm lint        # Linting con ESLint
```

### **Backend:**
```bash
cd backend

# Desarrollo
python manage.py runserver
python manage.py shell

# Base de datos
python manage.py makemigrations
python manage.py migrate
python manage.py dbshell

# Testing
python manage.py test
python manage.py test api.tests
python run_tests.py

# Documentación
python manage.py spectacular --file schema.yml

# Producción
python manage.py collectstatic
gunicorn config.wsgi
```

---

## 📊 Scripts y Utilidades

### **🧪 Testing:**
```bash
# Script personalizado de tests
python run_tests.py

# Tests específicos
python manage.py test api.tests.test_users
python manage.py test api.tests.test_orders_products

# Con verbosidad
python manage.py test --verbosity=2
```

### **📋 Logs y Debugging:**
- **Logs Django**: `backend/logs/django.log`
- **Debug Toolbar**: Habilitado en desarrollo
- **Django Admin**: Panel de administración completo

---

## 🌐 Despliegue

### **� Cliente App - Deploy Automático en Vercel**

#### **Configuración (Una sola vez):**

1. **Conecta tu repositorio a Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Importa el repositorio `RobertoGP96/AR-E-Web`
   - Usa la configuración del `vercel.json` (ya incluido)

2. **Variables de Entorno en Vercel:**
   ```
   VITE_API_URL=https://ar-e-web.onrender.com/arye_system
   VITE_APP_ENV=production
   VITE_APP_NAME=AR-E-Web Client
   VITE_DEPLOY_TARGET=vercel
   ```

3. **Deploy Automático:**
   - Cada push a `main` → Deploy automático
   - Cada Pull Request → Preview deploy

#### **Pre-Deploy Check:**
```powershell
cd apps/client
.\pre-deploy-check.ps1  # Verifica que todo esté listo
```

📖 **Guía completa**: [`VERCEL_DEPLOY_CLIENT.md`](./VERCEL_DEPLOY_CLIENT.md)

---

### **🔧 Admin Panel:**
- **Cloudflare Pages** - Configurado con Wrangler
- **Deploy automático** desde GitHub
- Ver `apps/admin/CLOUDFLARE_DEPLOYMENT_GUIDE.md`

---

### **🔧 Backend:**
- **Render.com** - Configurado con Gunicorn
- **PostgreSQL** - Base de datos de producción
- **Cloudinary** - Almacenamiento de medios
- **WhiteNoise** - Archivos estáticos
- Ver `backend/RENDER_DEPLOYMENT_GUIDE.md`

---

## 🤝 Contribución

### **📋 Workflow:**
1. Fork del repositorio
2. Crear rama de feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit de cambios: `git commit -m 'Add: nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### **🎯 Estándares:**
- **ESLint** para código JavaScript/TypeScript
- **Black** para código Python
- **Tests** obligatorios para nuevas funcionalidades
- **Documentación** actualizada

---

## 📞 Soporte

### **🔗 Enlaces Útiles:**
- **API Docs**: `http://localhost:8000/api/docs/`
- **Admin Panel**: `http://localhost:8000/admin/`
- **Frontend**: `http://localhost:5173`

### **📁 Documentación Adicional:**
- `backend/IMPLEMENTATION_SUMMARY.md` - Resumen de implementación
- `backend/TESTS_README.md` - Documentación de tests
- `apps/admin/RESUMEN_CONFIGURACION.md` - Configuración del admin

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**✨ Desarrollado con ❤️ usando tecnologías modernas de desarrollo web**
