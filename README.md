# AR-E Web - Monorepo# 🏪 Shein Shop Management System



[![Deploy Apps](https://github.com/RobertoGP96/AR-E-Web/actions/workflows/jekyll-gh-pages.yml/badge.svg)](https://github.com/RobertoGP96/AR-E-Web/actions/workflows/jekyll-gh-pages.yml)> **Monorepo Full-Stack** para el sistema de gestión de tiendas con React + Django



Aplicación web completa construida con React, TypeScript, Django y optimizada para deployment en Cloudflare Pages y Render.[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://reactjs.org/)

[![Django](https://img.shields.io/badge/Django-5.1.1-092E20?logo=django)](https://djangoproject.com/)

## 🏗️ Arquitectura del Proyecto[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)](https://typescriptlang.org/)

[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.11-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

```[![Vite](https://img.shields.io/badge/Vite-7.1.0-646CFF?logo=vite)](https://vitejs.dev/)

AR-E-Web/

├── apps/                     # Aplicaciones frontend## 📋 Descripción del Proyecto

│   ├── client/              # App cliente (React + Vite)

│   └── admin/               # App admin (React + Vite)Sistema completo de gestión para tiendas que incluye manejo de usuarios, órdenes, productos, tiendas y cuentas de compra. Desarrollado con arquitectura moderna separando completamente frontend y backend.

├── backend/                 # API Django

├── scripts/                 # Scripts de desarrollo---

├── .github/workflows/       # CI/CD automatizado

└── docs/                    # Documentación## 🏗️ Arquitectura del Proyecto

```

```

## 🚀 Stack Tecnológico📁 StartNew/

├── 📱 apps/

### Frontend│   ├── 🎯 admin/          # Panel administrativo (React + shadcn/ui)

- **React 19** con TypeScript│   └── 👥 client/         # Aplicación cliente básica

- **Vite 7** para build y desarrollo├── 🔧 backend/            # API REST con Django

- **TailwindCSS v4** para estilos├── 📄 .gitignore          # Configuración de Git

- **shadcn/ui** para componentes└── 📖 README.md           # Este archivo

- **TanStack Query** para manejo de estado del servidor```

- **React Router 7** para navegación

---

### Backend

- **Django 5.1** con Django REST Framework## 🎯 Aplicaciones Frontend

- **PostgreSQL** para producción

- **SQLite** para desarrollo### 🎯 **Admin Panel** (`/apps/admin`)

- **JWT** para autenticaciónPanel administrativo completo con interfaz moderna y componentes reutilizables.



### DevOps#### **📦 Stack Tecnológico:**

- **pnpm workspaces** para gestión de monorepo- **React 19.1.1** - Biblioteca principal

- **GitHub Actions** para CI/CD- **TypeScript 5.8.3** - Tipado estático

- **Cloudflare Pages** para frontend- **Vite 7.1.0** - Build tool y dev server

- **Render** para backend- **TailwindCSS 4.1.11** - Framework CSS utility-first

- **shadcn/ui** - Componentes UI modernos

## ⚡ Inicio Rápido- **TanStack Query 5.84.2** - Gestión de estado del servidor

- **React Router DOM 7.8.0** - Enrutamiento

### Prerrequisitos- **Axios 1.11.0** - Cliente HTTP

- Node.js 18+- **Lucide React** - Iconografía

- Python 3.11+

- pnpm 8+#### **🧩 Componentes Principales:**

```

### 1. Instalación📁 src/components/

```bash├── 🎨 ui/                 # Componentes base (shadcn/ui)

# Clonar repositorio├── 📊 dashboard/          # Componentes del dashboard

git clone https://github.com/RobertoGP96/AR-E-Web.git├── 🚚 delivery/           # Gestión de entregas

cd AR-E-Web├── 🧭 navigation/         # Navegación y menús

├── 🔔 notifications/      # Sistema de notificaciones

# Instalar dependencias├── 📦 package/            # Gestión de paquetes

pnpm install├── 🛍️ product/           # Gestión de productos

├── 🏪 shop/              # Gestión de tiendas

# Configurar entorno├── 🏬 store/             # Gestión de almacenes

cp .env.example .env.local├── 🔐 ProtectedRoute.tsx  # Rutas protegidas

# Editar .env.local con tus valores├── ⚠️ ErrorMessage.tsx   # Manejo de errores

```└── ⏳ LoadingSpinner.tsx # Estados de carga

```

### 2. Configurar Backend

```bash#### **⚙️ Configuración:**

cd backend- **ESLint** - Linting y formateo

python -m venv venv- **PostCSS** - Procesamiento CSS

- **TypeScript** - Configuración estricta

# Windows- **shadcn/ui** - Sistema de diseño

venv\Scripts\activate

### 👥 **Client App** (`/apps/client`)

# Linux/macOSAplicación cliente básica preparada para desarrollo.

source venv/bin/activate

#### **📦 Stack Tecnológico:**

pip install -r requirements.txt- **React 19.1.1** - Base mínima

python manage.py migrate- **TypeScript 5.8.3** - Tipado

python manage.py createsuperuser  # Opcional- **Vite 7.1.0** - Build tool

```

---

### 3. Iniciar Desarrollo

## 🔧 Backend API (`/backend`)

**Opción 1: Todo en uno**

```bashAPI REST completa desarrollada con Django y Django REST Framework.

# Desde la raíz del proyecto

pnpm dev### **📦 Stack Tecnológico:**

```- **Django 5.1.1** - Framework web

- **Django REST Framework 3.15.2** - API REST

**Opción 2: Scripts individuales (Windows)**- **Django CORS Headers** - Manejo de CORS

```powershell- **SimpleJWT** - Autenticación JWT

# Todas las apps- **Cloudinary** - Gestión de medios

.\scripts\dev.ps1 all- **PostgreSQL** - Base de datos (producción)

- **SQLite** - Base de datos (desarrollo)

# Solo cliente- **Gunicorn** - Servidor WSGI

.\scripts\dev.ps1 client- **WhiteNoise** - Archivos estáticos



# Solo admin### **🗄️ Modelos de Datos:**

.\scripts\dev.ps1 admin

#### **👤 CustomUser**

# Solo backend```python

.\scripts\dev.ps1 backend- email (único, requerido)

```- first_name, last_name

- phone_number

**Opción 3: Scripts individuales (Linux/macOS)**- role (admin, agent, client)

```bash- is_verified, verification_secret

# Hacer ejecutable (primera vez)- métodos: full_name, has_role, verify

chmod +x scripts/dev.sh```



# Todas las apps#### **🏪 Shop**

./scripts/dev.sh all```python

- name (único)

# Apps individuales- description

./scripts/dev.sh client- location

./scripts/dev.sh admin- is_active

./scripts/dev.sh backend- created_at, updated_at

``````



## 🌐 URLs de Desarrollo#### **📦 Order**

```python

- **Cliente:** http://localhost:5173- client (ForeignKey a CustomUser)

- **Admin:** http://localhost:5174- shop (ForeignKey a Shop)

- **API:** http://localhost:8000/api- agent (ForeignKey a CustomUser)

- **Django Admin:** http://localhost:8000/admin- total_cost

- status (pending, processing, completed, cancelled)

## 📦 Scripts Disponibles- created_at, updated_at

```

```bash

# Desarrollo#### **🛍️ Product**

pnpm dev                 # Iniciar todas las apps```python

pnpm dev:client         # Solo cliente- name

pnpm dev:admin          # Solo admin- shop (ForeignKey a Shop)

pnpm dev:backend        # Solo backend- order (ForeignKey a Order, opcional)

- cost_per_product, amount

# Build- total_cost (calculado)

pnpm build              # Build todas las apps- created_at, updated_at

pnpm build:client       # Solo cliente```

pnpm build:admin        # Solo admin

#### **💳 BuyingAccounts**

# Calidad de código```python

pnpm lint               # Linting- shop (OneToOne a Shop)

pnpm lint:fix           # Fix automático- account_details (JSON)

pnpm type-check         # Verificación de tipos- is_active

```

# Utilidades

pnpm clean              # Limpiar builds y node_modules#### **ℹ️ CommonInformation**

pnpm install:all        # Instalar todo (frontend + backend)```python

```- shop (OneToOne a Shop)

- extra_info (JSON)

## 🚀 Deployment- last_updated

```

### Configuración Automática

El proyecto incluye CI/CD automático con GitHub Actions:### **🔐 Sistema de Autenticación:**

- **JWT Tokens** - Access y Refresh tokens

1. **Push a `main`** → Deploy automático a producción- **Roles de Usuario** - Admin, Agent, Client

2. **Pull Request** → Tests y builds de verificación- **Permisos Granulares** - Por endpoint y modelo

3. **Deployment selectivo** → Solo se despliegan apps que cambiaron- **Verificación de Email** - Sistema de códigos



### Configuración Manual### **📋 Endpoints API Principales:**



#### Frontend (Cloudflare Pages)#### **👤 Usuarios (`/api/users/`)**

```bash```

# Client AppGET    /api/users/              # Lista usuarios

Build command: cd apps/client && pnpm install && pnpm buildPOST   /api/users/              # Crear usuario

Build output: apps/client/distGET    /api/users/{id}/         # Detalle usuario

Root directory: /PUT    /api/users/{id}/         # Actualizar usuario

POST   /api/users/verify/       # Verificar email

# Admin App```

Build command: cd apps/admin && pnpm install && pnpm build

Build output: apps/admin/dist#### **🔑 Autenticación (`/api/auth/`)**

Root directory: /```

```POST   /api/auth/token/         # Obtener tokens

POST   /api/auth/token/refresh/ # Renovar token

#### Backend (Render)```

```bash

Build command: pip install -r requirements.txt#### **🏪 Tiendas (`/api/shops/`)**

Start command: cd backend && gunicorn config.wsgi:application```

```GET    /api/shops/              # Lista tiendas

POST   /api/shops/              # Crear tienda

Ver [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) para más detalles.GET    /api/shops/{id}/         # Detalle tienda

PUT    /api/shops/{id}/         # Actualizar tienda

## 🔧 ConfiguraciónDELETE /api/shops/{id}/         # Eliminar tienda

```

### Variables de Entorno

#### **📦 Órdenes (`/api/orders/`)**

#### Cliente```

```envGET    /api/orders/             # Lista órdenes

VITE_API_URL=http://localhost:8000/apiPOST   /api/orders/             # Crear orden

VITE_ADMIN_URL=http://localhost:5174GET    /api/orders/{id}/        # Detalle orden

VITE_APP_TITLE=AR-E Web ClientPUT    /api/orders/{id}/        # Actualizar orden

``````



#### Admin#### **🛍️ Productos (`/api/products/`)**

```env```

VITE_API_URL=http://localhost:8000/apiGET    /api/products/           # Lista productos

VITE_CLIENT_URL=http://localhost:5173POST   /api/products/           # Crear producto

VITE_ADMIN_TITLE=AR-E Web AdminGET    /api/products/{id}/      # Detalle producto

```PUT    /api/products/{id}/      # Actualizar producto

DELETE /api/products/{id}/      # Eliminar producto

#### Backend```

```env

DEBUG=True### **📖 Documentación API:**

SECRET_KEY=tu-clave-secreta- **Swagger UI**: `http://localhost:8000/api/docs/`

DATABASE_URL=sqlite:///db.sqlite3- **ReDoc**: `http://localhost:8000/api/redoc/`

ALLOWED_HOSTS=localhost,127.0.0.1- **Schema OpenAPI**: `http://localhost:8000/api/schema/`

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

```### **🧪 Testing:**

- **50+ Tests Unitarios** implementados

## 🧪 Testing- **Cobertura completa** de modelos y endpoints

- **Tests de seguridad** y validaciones

```bash- **Ejecución**: `python manage.py test api.tests`

# Frontend tests (cuando se configuren)

pnpm test---



# Backend tests## 🚀 Instalación y Configuración

cd backend

python manage.py test### **📋 Prerrequisitos:**

```- **Node.js** 18+ y **pnpm**

- **Python** 3.11+ y **pip**

## 📁 Estructura de Archivos- **Git**



```### **⚡ Instalación Rápida:**

AR-E-Web/

├── apps/#### **1️⃣ Clonar el repositorio:**

│   ├── client/                 # App cliente```bash

│   │   ├── src/git clone <repo-url>

│   │   │   ├── components/     # Componentes Reactcd StartNew

│   │   │   ├── pages/         # Páginas/rutas```

│   │   │   ├── services/      # API calls

│   │   │   ├── hooks/         # Custom hooks#### **2️⃣ Configurar Frontend (Admin):**

│   │   │   └── utils/         # Utilidades```bash

│   │   ├── public/           # Assets estáticoscd apps/admin

│   │   └── vite.config.ts    # Configuración Vitepnpm install

│   └── admin/                # App admin (estructura similar)pnpm dev

├── backend/```

│   ├── api/                  # App Django principal📍 **URL**: `http://localhost:5173`

│   │   ├── models.py        # Modelos de datos

│   │   ├── views.py         # Vistas/endpoints#### **3️⃣ Configurar Backend:**

│   │   ├── serializers.py   # Serializers DRF```bash

│   │   └── urls.py          # URLs de la APIcd backend

│   ├── config/              # Configuración Django

│   └── requirements.txt     # Dependencias Python# Crear entorno virtual

├── scripts/                 # Scripts de desarrollopython -m venv .venv

├── .github/workflows/       # CI/CD.venv\Scripts\activate  # Windows

└── docs/                   # Documentación adicional# source .venv/bin/activate  # Linux/Mac

```

# Instalar dependencias

## 🤝 Contribuciónpip install -r requirements.txt



1. Fork el proyecto# Configurar base de datos

2. Crea una rama para tu feature (`git checkout -b feature/nueva-feature`)python manage.py migrate

3. Commit tus cambios (`git commit -m 'feat: agregar nueva feature'`)

4. Push a la rama (`git push origin feature/nueva-feature`)# Crear superusuario

5. Abre un Pull Requestpython manage.py createsuperuser



### Convenciones de Commit# Ejecutar servidor

- `feat:` Nueva funcionalidadpython manage.py runserver

- `fix:` Corrección de bugs```

- `docs:` Cambios en documentación📍 **API**: `http://localhost:8000`

- `style:` Cambios de formato/estilo📍 **Admin**: `http://localhost:8000/admin`

- `refactor:` Refactorización de código📍 **Docs**: `http://localhost:8000/api/docs/`

- `test:` Agregar/modificar tests

### **🔧 Variables de Entorno:**

## 📄 Licencia

#### **Backend (`.env`):**

Este proyecto está bajo la licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.```env

DEBUG=True

## 📞 SoporteSECRET_KEY=your-secret-key

DATABASE_URL=sqlite:///db.sqlite3

- **Issues:** [GitHub Issues](https://github.com/RobertoGP96/AR-E-Web/issues)CLOUDINARY_CLOUD_NAME=your-cloud-name

- **Documentación:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)CLOUDINARY_API_KEY=your-api-key

- **Scripts:** [scripts/README.md](./scripts/README.md)CLOUDINARY_API_SECRET=your-api-secret

RESEND_API_KEY=your-resend-key

---```



**Desarrollado con ❤️ por [RobertoGP96](https://github.com/RobertoGP96)**---

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
