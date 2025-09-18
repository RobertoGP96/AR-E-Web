# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

# AR-E-Web Client

Aplicación cliente React + TypeScript + Vite con shadcn/ui y TailwindCSS.

## Estructura del Proyecto

- **React 19** con TypeScript
- **Vite** como bundler
- **TailwindCSS v4** para estilos
- **shadcn/ui** para componentes de interfaz
- **TanStack Query** para manejo de estado de servidor
- **React Router** para navegación

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev

# Build para producción (limpieza + verificación de tipos + build)
pnpm build

# Build solo (sin limpieza ni verificación)
pnpm build:only

# Build usando configuración legacy (fallback)
pnpm build:legacy

# Verificación de tipos solamente
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Preview del build
pnpm preview

# Limpieza
pnpm clean:dist  # Solo carpeta dist
pnpm clean       # dist y node_modules
pnpm clean:js    # Archivos JS compilados (si los hay)
```

## ⚠️ Importante: Archivos JavaScript

Este proyecto usa **solo TypeScript**. Si encuentras archivos `.js` en el directorio `src/`, significa que:

1. TypeScript los compiló por error durante el build
2. Alguien creó archivos JS manualmente (no recomendado)

**Solución**: Ejecuta `pnpm clean:js` para eliminar archivos JS no deseados.

Los archivos JS están excluidos del repositorio mediante `.gitignore`.

## Configuración de Build

Todos los archivos generados se almacenan en la carpeta `dist/`:

```
dist/
├── index.html              # Archivo HTML principal
├── manifest.json           # Manifest de PWA
├── _headers                # Headers para Cloudflare
├── _redirects              # Redirects para Cloudflare
└── assets/
    ├── index-[hash].css    # Estilos compilados
    ├── index-[hash].js     # JavaScript principal
    ├── vendor-[hash].js    # Dependencias React/React-DOM
    ├── router-[hash].js    # React Router
    ├── query-[hash].js     # TanStack Query
    ├── ui-[hash].js        # Componentes de shadcn/ui
    └── logo-[hash].svg     # Assets estáticos
```

### Configuración de Chunks

- **vendor**: React y React DOM
- **router**: React Router
- **query**: TanStack Query
- **ui**: Componentes de Radix UI (shadcn/ui)

## Configuración de TypeScript

El proyecto tiene dos configuraciones de TypeScript:

1. **`tsconfig.app.json`**: Para desarrollo con resolución de bundler
2. **`tsconfig.build.json`**: Para builds de producción con resolución de node

### Para Cloudflare Pages

El comando `pnpm build` usa `tsconfig.build.json` que está optimizado para compatibilidad con el entorno de build de Cloudflare.

## Alias de Importación

El proyecto utiliza alias `@/*` para importaciones limpias:

```typescript
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
```

## Componentes UI

Los componentes de shadcn/ui están configurados en el directorio `src/components/ui/` con el tema "new-york" y variables CSS de TailwindCSS.

## Resolución de Problemas

### Error "Cannot find module '@/lib/utils'"

Este error se ha resuelto mediante:
- Configuración de paths en `tsconfig.build.json`
- Declaraciones de módulo en `vite-env.d.ts`
- Uso de `moduleResolution: "node"` para builds de producción

### Build en Cloudflare

Asegúrate de que Cloudflare use el comando correcto:
```bash
pnpm build
```

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

El servidor estará disponible en `http://localhost:5173`

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
