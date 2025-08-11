# Monorepo Web + Backend

Este repositorio contiene:
- `/client`: Aplicación web con React, TypeScript, TanStack Query, React Router, shadcn/ui, Tailwind CSS v4, Vite y pnpm.
- `/backend`: Backend en Django.

## Instalación rápida

### Cliente
1. Ve a la carpeta `client`.
2. Instala dependencias con `pnpm install`.
3. Inicia el servidor de desarrollo con `pnpm dev`.

### Backend
1. Ve a la carpeta `backend`.
2. Instala dependencias de Python y Django.
3. Ejecuta migraciones y el servidor de desarrollo.

## Estructura
```
/client    # Frontend React
/backend   # Backend Django
/.github   # Configuración Copilot
```

## Notas
- El frontend usa Vite y pnpm como empaquetador y gestor de paquetes.
- El backend se aloja en la misma repo para facilitar despliegue conjunto.
- Revisa la documentación de cada carpeta para detalles específicos.
