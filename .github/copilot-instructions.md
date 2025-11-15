# 🤖 GitHub Copilot - Instrucciones para Shein Shop

## 📋 Información del Proyecto

**Shein Shop** es un sistema completo de gestión de tiendas e-commerce desarrollado como monorepo full-stack con las siguientes características:

### 🏗️ Arquitectura del Monorepo
- **Monorepo con pnpm workspaces** para gestión eficiente de dependencias
- **3 aplicaciones principales**: Admin Panel, Client App, Backend API
- **Arquitectura modular** con settings por entorno, servicios de negocio y middleware personalizado
- **Containerización completa** con Docker y docker-compose
- **CI/CD pipeline** con GitHub Actions y pre-commit hooks

### 📁 Estructura del Proyecto
```
📁 StartNew/ (Monorepo Root)
├── 📱 apps/
│   ├── 🎯 admin/          # Panel administrativo avanzado
│   │   ├── React 19 + TypeScript + Vite
│   │   ├── shadcn/ui + Tailwind CSS v4
│   │   ├── Supabase + Cloudinary + Recharts
│   │   └── Gestión completa del sistema
│   └── 👥 client/         # App cliente moderna
│       ├── React 19 + TypeScript + Vite
│       ├── shadcn/ui + TanStack Query
│       └── Interfaz de usuario cliente
├── 🔧 backend/            # API REST Django
│   ├── Django 5.1 + DRF 3.15
│   ├── Settings modulares (base/dev/prod)
│   ├── Servicios de negocio (scraping, profits)
│   ├── Middleware personalizado
│   └── Docker + PostgreSQL/Redis
├── 📄 .github/            # CI/CD y configuración
│   ├── workflows/ci.yml   # Pipeline automatizado
│   └── copilot-instructions.md
├── 📦 package.json        # Configuración monorepo
├── 📦 pnpm-workspace.yaml # Workspaces pnpm
└── 📖 README.md           # Documentación principal
```

## 🎯 Aplicaciones del Sistema

### 🎯 **Admin Panel** (`/apps/admin`)
- **Propósito**: Panel administrativo completo para gestión del sistema
- **Stack**: React 19, TypeScript, Vite, shadcn/ui, Tailwind CSS v4
- **Características**:
  - Dashboard con métricas en tiempo real
  - Gestión de usuarios, productos, órdenes
  - Analytics con gráficos (Recharts)
  - Sistema de QR codes y reportes
  - Integración Cloudinary para imágenes
  - Autenticación con Supabase

### 👥 **Client App** (`/apps/client`)
- **Propósito**: Interfaz de usuario para clientes finales
- **Stack**: React 19, TypeScript, Vite, shadcn/ui
- **Características**:
  - Catálogo de productos
  - Sistema de órdenes y seguimiento
  - Perfil de usuario
  - Tema oscuro/claro
  - Responsive design

### 🔧 **Backend API** (`/backend`)
- **Propósito**: API RESTful para todas las operaciones del sistema
- **Stack**: Django 5.1, DRF 3.15, PostgreSQL
- **Características**:
  - Autenticación JWT con roles
  - Endpoints para users, products, orders, deliveries
  - Scraping de Amazon integrado
  - Cálculos de ganancias automáticos
  - Documentación OpenAPI/Swagger

## 🚀 Mejores Prácticas Implementadas

### ✅ Arquitectura y Organización
- [x] **Settings modulares** por entorno (base/development/production)
- [x] **Servicios de negocio** separados de las vistas
- [x] **Middleware personalizado** para logging y manejo de errores
- [x] **Modelo de repositorio** con separación clara de responsabilidades
- [x] **Containerización** completa con Docker
- [x] **Monorepo management** con pnpm workspaces

### ✅ Calidad de Código
- [x] **Pre-commit hooks** (black, isort, flake8, mypy para Python)
- [x] **ESLint + TypeScript** estricto para JavaScript/TypeScript
- [x] **CI/CD pipeline** con GitHub Actions
- [x] **Testing framework** preparado (pytest para backend)
- [x] **Conventional commits** para mensajes de commit

### ✅ Documentación
- [x] **README específico** para cada aplicación
- [x] **Documentación API** con drf-spectacular (Swagger/ReDoc)
- [x] **Instrucciones de despliegue** detalladas
- [x] **Guías de configuración** para entornos

### ✅ DevOps y Despliegue
- [x] **Docker Compose** para desarrollo local
- [x] **Multi-stage builds** para producción
- [x] **Configuración de Nginx** incluida
- [x] **Variables de entorno** documentadas
- [x] **Health checks** y monitoreo básico

## 🛠️ Comandos de Desarrollo

### Monorepo (desde root)
```bash
# Instalar todas las dependencias
pnpm install

# Ejecutar comando en todos los workspaces
pnpm -r run lint

# Ejecutar en workspace específico
pnpm --filter admin run dev
pnpm --filter backend run test
```

### Backend
```bash
cd backend

# Desarrollo
python manage.py runserver

# Testing
python manage.py test
pytest --cov=api --cov-report=html

# Docker
docker-compose up --build
```

### Frontend (Admin/Client)
```bash
cd apps/admin  # o apps/client

# Desarrollo
pnpm dev

# Build
pnpm build

# Linting
pnpm lint
pnpm type-check
```

## 📋 Checklist de Desarrollo

### Antes de commits
- [ ] **Backend**: Ejecutar `python manage.py check`
- [ ] **Backend**: Ejecutar tests `python manage.py test`
- [ ] **Frontend**: Ejecutar `pnpm lint` y `pnpm type-check`
- [ ] **Pre-commit**: Ejecutar `pre-commit run --all-files`

### Antes de PRs
- [ ] **Documentación**: READMEs actualizados
- [ ] **Tests**: Cobertura adecuada
- [ ] **Linting**: Sin errores
- [ ] **Build**: Compilación exitosa
- [ ] **Docker**: Contenedores funcionales

### Para nuevas funcionalidades
- [ ] **Backend**: Crear servicio si es lógica de negocio compleja
- [ ] **Backend**: Agregar tests unitarios
- [ ] **Frontend**: Usar componentes shadcn/ui existentes
- [ ] **Frontend**: Implementar validación con Zod
- [ ] **Documentación**: Actualizar READMEs relevantes

## 🔧 Configuración de Entornos

### Variables de Entorno Requeridas

#### Backend (`.env`)
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Admin Panel (`.env.local`)
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

#### Client App (`.env.local`)
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🚀 Despliegue

### Desarrollo Local
```bash
# Todo el stack
docker-compose up --build

# Solo backend
cd backend && docker-compose up --build

# Frontend específico
cd apps/admin && pnpm dev
```

### Producción
- **Backend**: Docker + Gunicorn + PostgreSQL
- **Admin**: Cloudflare Pages
- **Client**: Vercel

## 📚 Documentación

- 📖 **[README Principal](../README.md)** - Información general del proyecto
- 📖 **[Backend API](../backend/README.md)** - Documentación específica del backend
- 📖 **[Admin Panel](../apps/admin/README.md)** - Documentación del panel administrativo
- 📖 **[Client App](../apps/client/README.md)** - Documentación de la app cliente

## 🎯 Roles y Responsabilidades

### 👨‍💻 Desarrollador Backend
- Mantener la API RESTful
- Implementar lógica de negocio en servicios
- Gestionar base de datos y migraciones
- Escribir tests unitarios y de integración

### 👨‍💻 Desarrollador Frontend
- Desarrollar componentes UI reutilizables
- Implementar lógica de estado con TanStack Query
- Gestionar formularios con React Hook Form + Zod
- Optimizar rendimiento y UX

### 👨‍💻 DevOps/Infrastructure
- Mantener Docker y CI/CD
- Gestionar despliegues
- Monitorear rendimiento
- Gestionar seguridad

## 📞 Comunicación y Colaboración

- **Issues**: Usar GitHub Issues para bugs y features
- **PRs**: Pull Requests con descripción detallada
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`)
- **Code Review**: Obligatorio antes de merge
- **Documentación**: Mantener actualizada con cada cambio

---

**💡 Recuerda**: Este proyecto sigue las mejores prácticas modernas de desarrollo full-stack. Mantén la calidad del código, documenta tus cambios y colabora efectivamente con el equipo.
