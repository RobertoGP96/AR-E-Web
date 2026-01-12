# 🛒 Shein Shop Client

> **React SPA** para la interfaz de usuario del sistema de gestión de tiendas Shein Shop

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)](https://typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.11-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## 📋 Descripción

Aplicación web de una sola página (SPA) desarrollada con React y TypeScript para la gestión completa de operaciones de e-commerce, incluyendo paneles administrativos, gestión de usuarios, órdenes y productos.

## 🚀 Características

- ✅ **React 19** - Última versión con nuevas características
- ✅ **TypeScript** - Tipado fuerte y desarrollo robusto
- ✅ **Vite** - Build tool ultrarrápido
- ✅ **TanStack Query** - Gestión de estado del servidor
- ✅ **React Router v7** - Navegación moderna
- ✅ **shadcn/ui** - Componentes UI accesibles y hermosos
- ✅ **Tailwind CSS v4** - Framework CSS utilitario
- ✅ **React Hook Form** - Formularios eficientes con validación
- ✅ **Zod** - Validación de esquemas TypeScript-first
- ✅ **Axios** - Cliente HTTP con interceptores
- ✅ **Lucide React** - Iconos modernos y consistentes
- ✅ **Next Themes** - Gestión de temas oscuro/claro
- ✅ **Sonner** - Notificaciones toast elegantes

## 🏗️ Arquitectura

```
📁 apps/client/
├── 📁 public/                   # Archivos estáticos
├── 📁 src/
│   ├── 📁 components/           # Componentes reutilizables
│   │   ├── ui/                  # Componentes base shadcn/ui
│   │   ├── forms/               # Componentes de formularios
│   │   ├── layout/              # Layout y navegación
│   │   └── dashboard/           # Componentes del dashboard
│   ├── 📁 hooks/                # Hooks personalizados
│   ├── 📁 lib/                  # Utilidades y configuraciones
│   │   ├── api/                 # Cliente API y queries
│   │   ├── utils/               # Funciones utilitarias
│   │   └── validations/         # Esquemas de validación Zod
│   ├── 📁 pages/                # Páginas de la aplicación
│   │   ├── auth/                # Páginas de autenticación
│   │   ├── admin/               # Panel administrativo
│   │   ├── agent/               # Panel de agentes
│   │   ├── buyer/               # Panel de compradores
│   │   └── client/              # Panel de clientes
│   ├── 📁 types/                # Definiciones TypeScript
│   ├── 📁 contexts/             # Contextos React
│   ├── App.tsx                  # Componente raíz
│   ├── main.tsx                 # Punto de entrada
│   └── index.css                # Estilos globales
├── 📁 dist/                     # Build de producción
├── package.json                 # Dependencias y scripts
├── vite.config.ts               # Configuración Vite
├── tsconfig.json                # Configuración TypeScript
├── tailwind.config.js           # Configuración Tailwind
├── components.json              # Configuración shadcn/ui
├── postcss.config.js            # Configuración PostCSS
└── eslint.config.js             # Configuración ESLint
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- pnpm (recomendado) o npm/yarn

### Instalación

1. **Instalar dependencias**
   ```bash
   cd apps/client
   pnpm install
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   # Editar .env.local con tus configuraciones
   ```

3. **Ejecutar en desarrollo**
   ```bash
   pnpm dev
   ```

4. **Build de producción**
   ```bash
   pnpm build
   ```

## 🐳 Despliegue

### Vercel (Recomendado)

```bash
# Build para Vercel
pnpm build:vercel

# Desplegar
pnpm deploy:check
```

### GitHub Pages

```bash
# Build para GitHub
pnpm build:github
```

### Nginx

```bash
# Build de producción
pnpm build

# Servir con nginx
nginx -c nginx.conf
```

## 📱 Características de la UI

### Componentes Principales

- **Dashboard Administrativo** - Gestión completa del sistema
- **Panel de Agentes** - Gestión de órdenes y clientes
- **Panel de Compradores** - Catálogo y órdenes
- **Panel de Clientes** - Seguimiento de órdenes
- **Sistema de Autenticación** - Login/registro seguro
- **Gestión de Usuarios** - CRUD completo con roles
- **Catálogo de Productos** - Búsqueda y filtros avanzados
- **Sistema de Órdenes** - Ciclo completo de órdenes
- **Gestión de Entregas** - Seguimiento logístico

### Tema y Diseño

- **Modo Oscuro/Claro** - Soporte completo de temas
- **Responsive Design** - Optimizado para móvil y desktop
- **Accesibilidad** - Cumple estándares WCAG
- **Animaciones Suaves** - Transiciones elegantes
- **Iconografía Consistente** - Lucide React

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base de la API | http://localhost:8000/api |
| `VITE_APP_NAME` | Nombre de la aplicación | Shein Shop |
| `VITE_DEPLOY_TARGET` | Plataforma de despliegue | local |

### Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Servidor de desarrollo
pnpm preview          # Vista previa de producción

# Build
pnpm build            # Build de producción
pnpm build:vercel     # Build optimizado para Vercel
pnpm build:github     # Build para GitHub Pages

# Calidad de código
pnpm lint             # Verificar linting
pnpm lint:fix         # Corregir problemas de linting
pnpm type-check       # Verificar tipos TypeScript

# Utilidades
pnpm clean            # Limpiar archivos generados
pnpm clean:dist       # Limpiar solo dist
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén configurados)
pnpm test

# Con watch mode
pnpm test -- --watch
```

## 📚 API Integration

### Cliente HTTP

- **Axios** con interceptores para auth y errores
- **TanStack Query** para cache y sincronización
- **React Hook Form + Zod** para validación

### Endpoints Principales

- `GET /api/users/` - Lista de usuarios
- `POST /api/auth/login/` - Autenticación
- `GET /api/products/` - Catálogo de productos
- `POST /api/orders/` - Crear orden
- `GET /api/deliveries/` - Seguimiento de entregas

## 🎨 Personalización

### Agregar Componentes shadcn/ui

```bash
# Agregar un componente
pnpm dlx shadcn@latest add button

# Agregar múltiples componentes
pnpm dlx shadcn@latest add dialog dropdown-menu
```

### Tema Personalizado

```typescript
// src/lib/theme.ts
export const theme = {
  colors: {
    primary: '#your-color',
    // ... más colores
  }
}
```

## 🚀 Optimizaciones

- **Code Splitting** - Carga lazy de rutas
- **Tree Shaking** - Eliminación de código no usado
- **Image Optimization** - Optimización automática de imágenes
- **Bundle Analysis** - Análisis de tamaño del bundle
- **PWA Ready** - Preparado para Progressive Web App

## 🔒 Seguridad

- **TypeScript** - Prevención de errores en tiempo de compilación
- **Validación de Input** - Zod schemas para todas las entradas
- **Sanitización** - Limpieza automática de datos
- **CSRF Protection** - Protección contra ataques CSRF
- **XSS Prevention** - Sanitización de contenido dinámico

## 📊 Rendimiento

- **Lazy Loading** - Carga diferida de componentes
- **Memoización** - Optimización con React.memo
- **Virtual Scrolling** - Para listas grandes
- **Image Lazy Loading** - Carga diferida de imágenes
- **Bundle Splitting** - División inteligente del código

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