# 🏪 Shein Shop Management System

> **Monorepo Full-Stack** para el sistema de gestión de tiendas con React + Django

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.1.1-092E20?logo=django)](https://djangoproject.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)](https://typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.11-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1.0-646CFF?logo=vite)](https://vitejs.dev/)

## 📋 Descripción del Proyecto

Sistema completo de gestión para tiendas que incluye manejo de usuarios, órdenes, productos, tiendas y cuentas de compra. Desarrollado con arquitectura moderna separando completamente frontend y backend.

---

## 🏗️ Arquitectura del Proyecto

```
📁 StartNew/
├── 📱 apps/
│   ├── 🎯 admin/          # Panel administrativo (React + shadcn/ui)
│   └── 👥 client/         # Aplicación cliente básica
├── 🔧 backend/            # API REST con Django
├── 📄 .gitignore          # Configuración de Git
└── 📖 README.md           # Este archivo
```

---

## 🎯 Aplicaciones Frontend

### 🎯 **Admin Panel** (`/apps/admin`)
Panel administrativo completo con interfaz moderna y componentes reutilizables.

#### **📦 Stack Tecnológico:**
- **React 19.1.1** - Biblioteca principal
- **TypeScript 5.8.3** - Tipado estático
- **Vite 7.1.0** - Build tool y dev server
- **TailwindCSS 4.1.11** - Framework CSS utility-first
- **shadcn/ui** - Componentes UI modernos
- **TanStack Query 5.84.2** - Gestión de estado del servidor
- **React Router DOM 7.8.0** - Enrutamiento
- **Axios 1.11.0** - Cliente HTTP
- **Lucide React** - Iconografía

#### **🧩 Componentes Principales:**
```
📁 src/components/
├── 🎨 ui/                 # Componentes base (shadcn/ui)
├── 📊 dashboard/          # Componentes del dashboard
├── 🚚 delivery/           # Gestión de entregas
├── 🧭 navigation/         # Navegación y menús
├── 🔔 notifications/      # Sistema de notificaciones
├── 📦 package/            # Gestión de paquetes
├── 🛍️ product/           # Gestión de productos
├── 🏪 shop/              # Gestión de tiendas
├── 🏬 store/             # Gestión de almacenes
├── 🔐 ProtectedRoute.tsx  # Rutas protegidas
├── ⚠️ ErrorMessage.tsx   # Manejo de errores
└── ⏳ LoadingSpinner.tsx # Estados de carga
```

#### **⚙️ Configuración:**
- **ESLint** - Linting y formateo
- **PostCSS** - Procesamiento CSS
- **TypeScript** - Configuración estricta
- **shadcn/ui** - Sistema de diseño

### 👥 **Client App** (`/apps/client`)
Aplicación cliente básica preparada para desarrollo.

#### **📦 Stack Tecnológico:**
- **React 19.1.1** - Base mínima
- **TypeScript 5.8.3** - Tipado
- **Vite 7.1.0** - Build tool

---

## 🔧 Backend API (`/backend`)

API REST completa desarrollada con Django y Django REST Framework.

### **📦 Stack Tecnológico:**
- **Django 5.1.1** - Framework web
- **Django REST Framework 3.15.2** - API REST
- **Django CORS Headers** - Manejo de CORS
- **SimpleJWT** - Autenticación JWT
- **Cloudinary** - Gestión de medios
- **PostgreSQL** - Base de datos (producción)
- **SQLite** - Base de datos (desarrollo)
- **Gunicorn** - Servidor WSGI
- **WhiteNoise** - Archivos estáticos

### **🗄️ Modelos de Datos:**

#### **👤 CustomUser**
```python
- email (único, requerido)
- first_name, last_name
- phone_number
- role (admin, agent, client)
- is_verified, verification_secret
- métodos: full_name, has_role, verify
```

#### **🏪 Shop**
```python
- name (único)
- description
- location
- is_active
- created_at, updated_at
```

#### **📦 Order**
```python
- client (ForeignKey a CustomUser)
- shop (ForeignKey a Shop)
- agent (ForeignKey a CustomUser)
- total_cost
- status (pending, processing, completed, cancelled)
- created_at, updated_at
```

#### **🛍️ Product**
```python
- name
- shop (ForeignKey a Shop)
- order (ForeignKey a Order, opcional)
- cost_per_product, amount
- total_cost (calculado)
- created_at, updated_at
```

#### **💳 BuyingAccounts**
```python
- shop (OneToOne a Shop)
- account_details (JSON)
- is_active
```

#### **ℹ️ CommonInformation**
```python
- shop (OneToOne a Shop)
- extra_info (JSON)
- last_updated
```

### **🔐 Sistema de Autenticación:**
- **JWT Tokens** - Access y Refresh tokens
- **Roles de Usuario** - Admin, Agent, Client
- **Permisos Granulares** - Por endpoint y modelo
- **Verificación de Email** - Sistema de códigos

### **📋 Endpoints API Principales:**

#### **👤 Usuarios (`/api/users/`)**
```
GET    /api/users/              # Lista usuarios
POST   /api/users/              # Crear usuario
GET    /api/users/{id}/         # Detalle usuario
PUT    /api/users/{id}/         # Actualizar usuario
POST   /api/users/verify/       # Verificar email
```

#### **🔑 Autenticación (`/api/auth/`)**
```
POST   /api/auth/token/         # Obtener tokens
POST   /api/auth/token/refresh/ # Renovar token
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

### **🔧 Frontend:**
- **Vercel/Netlify** - Recomendado para React apps
- **Build estático** con `pnpm build`

### **🔧 Backend:**
- **Railway/Heroku** - Configurado con Gunicorn
- **PostgreSQL** - Base de datos de producción
- **Cloudinary** - Almacenamiento de medios
- **WhiteNoise** - Archivos estáticos

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
