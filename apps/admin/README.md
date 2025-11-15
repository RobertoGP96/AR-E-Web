# 👑 Shein Shop Admin Panel

> **Panel Administrativo** para gestión completa del sistema Shein Shop

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)](https://typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.81.1-3ECF8E?logo=supabase)](https://supabase.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-1.22.0-3448C5?logo=cloudinary)](https://cloudinary.com/)

## 📋 Descripción

Panel administrativo completo desarrollado con React y TypeScript para la gestión integral del sistema de e-commerce Shein Shop. Incluye dashboards analíticos, gestión de usuarios, control de inventario, reportes financieros y herramientas de administración avanzadas.

## 🚀 Características

- ✅ **React 19** - Última versión con nuevas características
- ✅ **TypeScript** - Tipado fuerte y desarrollo robusto
- ✅ **Supabase** - Backend as a Service para autenticación y base de datos
- ✅ **Cloudinary** - Gestión avanzada de imágenes y medios
- ✅ **Recharts** - Gráficos y visualizaciones de datos
- ✅ **TanStack Query** - Gestión de estado del servidor
- ✅ **React Router v7** - Navegación moderna
- ✅ **shadcn/ui** - Componentes UI accesibles y hermosos
- ✅ **Tailwind CSS v4** - Framework CSS utilitario
- ✅ **React Hook Form** - Formularios eficientes con validación
- ✅ **Zod** - Validación de esquemas TypeScript-first
- ✅ **QR Codes** - Generación de códigos QR
- ✅ **Date Picker** - Selectores de fecha avanzados
- ✅ **DevTools** - Herramientas de desarrollo integradas

## 🏗️ Arquitectura

```
📁 apps/admin/
├── 📁 public/                   # Archivos estáticos
├── 📁 src/
│   ├── 📁 components/           # Componentes reutilizables
│   │   ├── ui/                  # Componentes base shadcn/ui
│   │   ├── charts/              # Componentes de gráficos
│   │   ├── forms/               # Formularios administrativos
│   │   ├── layout/              # Layout del admin
│   │   └── dashboard/           # Dashboard widgets
│   ├── 📁 hooks/                # Hooks personalizados
│   ├── 📁 lib/                  # Utilidades y configuraciones
│   │   ├── api/                 # Cliente API Supabase
│   │   ├── cloudinary/          # Utilidades Cloudinary
│   │   ├── utils/               # Funciones utilitarias
│   │   └── validations/         # Esquemas de validación Zod
│   ├── 📁 pages/                # Páginas administrativas
│   │   ├── auth/                # Autenticación admin
│   │   ├── dashboard/           # Dashboard principal
│   │   ├── users/               # Gestión de usuarios
│   │   ├── products/            # Gestión de productos
│   │   ├── orders/              # Gestión de órdenes
│   │   ├── reports/             # Reportes y analytics
│   │   └── settings/            # Configuración del sistema
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
- Cuenta de Supabase
- Cuenta de Cloudinary

### Instalación

1. **Instalar dependencias**
   ```bash
   cd apps/admin
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

### Cloudflare Pages (Recomendado)

```bash
# Build para Cloudflare
pnpm build:cloudflare

# Desplegar
pnpm deploy:cloudflare
```

### Nginx

```bash
# Build de producción
pnpm build

# Servir con nginx
nginx -c nginx.conf
```

## 📊 Dashboard y Analytics

### Métricas Principales

- **KPIs en Tiempo Real** - Ventas, usuarios, pedidos
- **Gráficos Interactivos** - Recharts con drill-down
- **Reportes Financieros** - Ganancias, márgenes, ROI
- **Análisis de Tendencias** - Crecimiento mensual/anual
- **Métricas de Usuario** - Actividad, retención, conversión

### Gestión de Datos

- **Usuarios** - CRUD completo con roles y permisos
- **Productos** - Inventario, precios, categorías
- **Órdenes** - Seguimiento completo del ciclo de vida
- **Reportes** - Exportación PDF/Excel
- **Configuración** - Parámetros del sistema

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL de Supabase | - |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima Supabase | - |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloud name Cloudinary | - |
| `VITE_CLOUDINARY_API_KEY` | API key Cloudinary | - |
| `VITE_APP_NAME` | Nombre de la aplicación | Shein Shop Admin |

### Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Servidor de desarrollo (puerto 5173)
pnpm preview          # Vista previa de producción

# Build
pnpm build            # Build de producción
pnpm build:cloudflare # Build optimizado para Cloudflare

# Calidad de código
pnpm lint             # Verificar linting
pnpm lint:fix         # Corregir problemas de linting
pnpm type-check       # Verificar tipos TypeScript

# Utilidades
pnpm clean            # Limpiar archivos generados
pnpm analyze          # Analizar bundle
```

## ☁️ Integraciones

### Supabase

- **Autenticación** - Login/registro de administradores
- **Base de Datos** - Almacenamiento de datos administrativos
- **Real-time** - Actualizaciones en tiempo real
- **Storage** - Archivos y documentos

### Cloudinary

- **Upload de Imágenes** - Productos, perfiles, banners
- **Transformaciones** - Optimización automática
- **CDN Global** - Entrega rápida de medios
- **Moderación** - Control de contenido

## 📱 Características de la UI

### Componentes Avanzados

- **Data Tables** - Tablas con sorting, filtering, pagination
- **Charts Library** - Gráficos interactivos con Recharts
- **Form Builders** - Formularios dinámicos con validación
- **File Uploaders** - Drag & drop con preview
- **QR Generators** - Códigos QR personalizados
- **Date Pickers** - Selectores avanzados de fecha
- **Progress Bars** - Indicadores de progreso
- **Modals/Dialogs** - Diálogos complejos

### Tema y Diseño

- **Admin Theme** - Diseño profesional para gestión
- **Dark/Light Mode** - Soporte completo de temas
- **Responsive Grid** - Layout adaptable
- **Accessibility** - Cumple estándares WCAG
- **Animations** - Micro-interacciones suaves

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén configurados)
pnpm test

# Con watch mode
pnpm test -- --watch
```

## 🔒 Seguridad

- **Supabase Auth** - Autenticación segura
- **Role-based Access** - Control granular de permisos
- **API Security** - Validación y sanitización
- **File Upload Security** - Validación de tipos y tamaños
- **Audit Logs** - Registro de todas las acciones

## 📊 Rendimiento

- **Lazy Loading** - Carga diferida de componentes
- **Virtual Tables** - Para datasets grandes
- **Image Optimization** - Cloudinary transformations
- **Caching Strategy** - TanStack Query + Supabase
- **Bundle Splitting** - División por rutas

## 🎨 Personalización

### Agregar Componentes shadcn/ui

```bash
# Agregar un componente
pnpm dlx shadcn@latest add table

# Agregar múltiples componentes
pnpm dlx shadcn@latest add calendar badge
```

### Tema Personalizado

```typescript
// src/lib/theme.ts
export const adminTheme = {
  colors: {
    admin: {
      primary: '#1a365d',
      secondary: '#2d3748',
      // ... más colores admin
    }
  }
}
```

## 🚀 Optimizaciones

- **Code Splitting** - Por rutas administrativas
- **Tree Shaking** - Eliminación de código no usado
- **Bundle Analysis** - Monitoreo de tamaño
- **Preloading** - Recursos críticos
- **Service Worker** - Cache offline

## 📈 Analytics y Reportes

### Métricas de Negocio

- **Revenue Analytics** - Ingresos por período
- **User Behavior** - Análisis de comportamiento
- **Product Performance** - Rendimiento de productos
- **Order Fulfillment** - Eficiencia de entregas
- **Customer Insights** - Insights de clientes

### Exportación de Datos

- **PDF Reports** - Reportes formateados
- **Excel Exports** - Datos tabulares
- **CSV Downloads** - Datos crudos
- **Scheduled Reports** - Reportes automáticos

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
- 📧 Email: admin@sheinshop.com
- 📖 Docs: [Documentación Admin](docs/)
- 🐛 Issues: [GitHub Issues](issues/)

---

**Panel administrativo desarrollado con ❤️ para Shein Shop**