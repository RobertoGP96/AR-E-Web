# Aplicación Cliente (apps/client)

> Documento de referencia técnica generado a partir de la lectura directa del código fuente en `apps/client/` (commit sobre rama `main`). Todas las rutas de archivo citadas son relativas a `apps/client/` salvo indicación contraria.

## 1. Propósito y usuarios

La aplicación cliente es la cara pública de **AR&E Shipps**, un servicio de compras internacionales y logística de paquetería (modelo "te compramos en tiendas de EE.UU./China y te lo entregamos", orientado a clientes en Cuba — ver `src/lib/format-phone.ts`, que prioriza el formato telefónico cubano `+53`, y las tasas de cambio USD/CUP en `src/components/about/price/rage-exchange.tsx`).

Sus usuarios objetivo son personas con rol `client` (el registro fija `role: 'client'` en `src/services/auth/register.ts`). La app les permite:

- Conocer el servicio: cómo funciona, beneficios, horarios, artículos prohibidos, FAQ (`src/components/about/Introduction.tsx`).
- Consultar precios por categoría, tasas de cambio, métodos de pago y calcular el costo estimado de una compra (`src/pages/pricing.tsx` y `src/components/about/calculator.tsx`).
- Explorar un directorio de tiendas online soportadas (`src/pages/stores.tsx`).
- Registrarse / iniciar sesión con número de teléfono (`src/components/auth/login.tsx`, `src/components/auth/register.tsx`).
- Armar una lista local de productos deseados ("Mis productos", `src/components/product/product-list.tsx`).
- Dar seguimiento a sus órdenes y entregas creadas por los gestores en el panel admin (`src/pages/user-orders.tsx`, `src/pages/user-deliveries.tsx`, `src/pages/order-detail.tsx`).
- Editar su perfil (`src/pages/profile.tsx`).

Consume el mismo backend Django que el panel admin, bajo el prefijo `/arye_system/` (configurado en `src/lib/api-client.ts`).

## 2. Stack técnico y dependencias clave

Fuente: `package.json`.

| Dependencia | Versión | Propósito en esta app |
|---|---|---|
| `react` / `react-dom` | ^19.1.1 | Framework UI (SPA) |
| `typescript` | ~5.8.3 | Tipado estático; `type-check` usa `tsconfig.build.json` |
| `vite` + `@vitejs/plugin-react-swc` | ^7.1.0 / ^3.11.0 | Build y dev server (puerto 5173 según `vite.config.ts`) |
| `tailwindcss` + `@tailwindcss/vite` | ^4.1.11 | Estilos utilitarios; configuración CSS-first en `src/index.css` (sin `tailwind.config.js`) |
| `tw-animate-css` | ^1.3.7 | Animaciones utilitarias importadas en `src/index.css` |
| `react-router-dom` | ^7.9.3 | Enrutamiento SPA (`src/routes/Routes.tsx`) |
| `@tanstack/react-query` | ^5.84.2 | Estado de servidor, caché y mutaciones (`src/lib/query-client.ts`) |
| `axios` | ^1.11.0 | Cliente HTTP dentro de `src/lib/api-client.ts` |
| `react-hook-form` + `@hookform/resolvers` | ^7.62.0 / ^5.2.1 | Formularios — **solo usado en el login** (`src/components/auth/login.tsx`) |
| `zod` | ^4.0.17 | Validación de esquemas — **solo el schema del login** |
| `@radix-ui/react-*` (accordion, dialog, dropdown-menu, select, popover, sheet vía dialog, avatar, tabs, tooltip, etc.) | varias | Primitivas accesibles bajo los wrappers shadcn/ui en `src/components/ui/` |
| `class-variance-authority`, `clsx`, `tailwind-merge` | — | Variantes de componentes y helper `cn()` (`src/lib/utils.ts`) |
| `lucide-react` | ^0.539.0 | Iconografía |
| `sonner` | ^2.0.7 | Toasts (montado en `src/App.tsx`, wrapper en `src/components/ui/sonner.tsx`) |
| `embla-carousel-react` + `embla-carousel-auto-scroll` | ^8.6.0 | Carrusel de logos de tiendas en Home (`src/components/store/store-carousel.tsx`) |
| `next-themes` | ^0.4.6 | Declarada, pero en la práctica el tema se maneja con el hook propio `src/hooks/use-theme.ts` (consumido solo por `src/components/ui/sonner.tsx`) |
| `rimraf`, `cross-env`, `terser` (implícito) | dev | Scripts de build/limpieza (`build:vercel` usa `VITE_DEPLOY_TARGET=vercel`) |

Scripts relevantes: `dev`, `build` (limpia dist + type-check + vite build), `build:vercel`, `lint`, `type-check`, `pre-deploy`. No hay tests configurados (`"test": "echo \"No tests configured yet\""`).

## 3. Estructura de carpetas

```
apps/client/
├── public/                       # Estáticos (logos de tiendas en /stores/*.svg usados por el carrusel)
├── _redirects                    # Fallback SPA para Cloudflare Pages: /* → /index.html 200
├── components.json               # Config shadcn/ui (estilo "new-york", baseColor neutral, alias @/)
├── vite.config.ts                # Alias @→src, chunks manuales, terser en prod, puerto 5173
├── .env.example / .env.production# Variables de entorno (ver sección 11)
└── src/
    ├── main.tsx                  # Entry: BrowserRouter (basename '/')
    ├── App.tsx                   # ErrorBoundary > AuthProvider > QueryClientProvider > AppRoutes + Toaster + blobs decorativos
    ├── index.css                 # Tailwind 4 CSS-first: tokens oklch, tema .dark, animaciones custom, scrollbar
    ├── routes/
    │   └── Routes.tsx            # Definición de rutas (lazy por página, layout con Outlet)
    ├── pages/                    # Componentes de nivel de ruta
    │   ├── home.tsx              # ⚠️ VACÍO (el Home real vive en components/home/home.tsx)
    │   ├── client.tsx            # ⚠️ VACÍO (sin uso)
    │   ├── scrap.tsx             # ⚠️ Esqueleto sin contenido y SIN ruta asociada (scraping no implementado en el cliente)
    │   ├── about.tsx             # Página "Saber más" (envuelve Introduction)
    │   ├── contact.tsx           # Formulario de contacto (decorativo, no envía nada)
    │   ├── pricing.tsx           # Precios + tasas + métodos de pago + calculadora
    │   ├── stores.tsx            # Directorio de tiendas (datos hard-codeados)
    │   ├── profile.tsx           # Ver/editar perfil del usuario
    │   ├── order-detail.tsx      # Detalle de una orden (/orders/:id)
    │   ├── user-orders.tsx       # "Mis Órdenes"
    │   ├── user-deliveries.tsx   # "Mis Entregas"
    │   └── not-found.tsx         # 404
    ├── components/
    │   ├── auth/                 # login.tsx (RHF+Zod), register.tsx (estado manual)
    │   ├── layout/main-layout.tsx# Header sticky (NavBar) + Suspense(Outlet) + Footer
    │   ├── navigation/           # nav-bar.tsx (desktop + Sheet móvil), user-nav.tsx (dropdown usuario + badge entregas pendientes)
    │   ├── home/home.tsx         # Hero de landing + CTA "Comenzar" + carrusel
    │   ├── store/store-carousel.tsx # Carrusel embla con auto-scroll de logos (public/stores/*.svg)
    │   ├── about/                # Introduction.tsx (pasos, prohibidos, FAQ), calculator.tsx, price/ (Pricing, pay-methods, rage-exchange)
    │   ├── order/                # order-row, order-details, order-status (badges de estado), product-card; orders-list.tsx ⚠️ VACÍO
    │   ├── product/              # product-list (página "Mis productos"), product-form, product-row, index.ts (barrel)
    │   ├── footer/footer.tsx     # Footer con enlaces sociales placeholder (#)
    │   ├── utils/                # error.tsx (ErrorMeassage sic), loading-spinner.tsx
    │   ├── error-boundary.tsx    # Error boundary de clase con recarga
    │   └── ui/                   # shadcn/ui (NO modificar): button, card, dialog, sheet, select, sonner, carousel, etc.
    ├── context/AuthContext.tsx   # Contexto + reducer de autenticación (ver sección 5)
    ├── hooks/
    │   ├── auth/useAuth.ts       # useAuth + 7 hooks derivados
    │   ├── auth/useRegister.ts   # Mutaciones de registro/verificación + disponibilidad email/teléfono
    │   ├── order/useOrders.ts    # Query 'orders'
    │   ├── order/useOrder.ts     # Query 'order' por id
    │   ├── delivery/useDeliveries.ts # Queries 'deliveries' y 'deliveries-pending'
    │   ├── useUser.ts            # Perfil actual + mutación de actualización
    │   ├── useShops.ts           # Query 'public-shops'
    │   ├── useCategories.ts      # Query 'public-categories'
    │   ├── use-local-storage.ts  # useLocalStorage genérico + useProductStorage ('user-products')
    │   └── use-theme.ts          # Tema light/dark/system (solo lo consume ui/sonner.tsx)
    ├── services/
    │   ├── auth/                 # login, register, logout, password, tokens, user (+ index barrel)
    │   ├── orders/get-orders.ts  # getOrderById, getMyOrders
    │   ├── deliveries/get-deliveries.ts # getDeliveryById, getMyDeliveries
    │   ├── shops/get-shops.ts    # getPublicShops
    │   └── categories/get-categories.ts # getPublicCategories
    ├── lib/
    │   ├── api-client.ts         # Clase ApiClient (axios + interceptores) — singleton apiClient
    │   ├── query-client.ts       # QueryClient de TanStack
    │   ├── utils.ts              # cn()
    │   ├── format-date.ts / format-phone.ts / format-usd.ts / format-weight-lb.ts
    │   └── index.ts              # Barrel (apiClient + formatters)
    ├── types/                    # base.ts (estados/uniones), user, order, product, delivery, evidence, shop, package, api.d.ts, index.ts
    ├── schemas/                  # ⚠️ NO EXISTE (pese a la convención del monorepo); el único schema Zod está inline en components/auth/login.tsx
    └── utils/
        ├── storage.ts            # STORAGE_KEYS + helpers seguros de localStorage + validación/migración de datos de auth
        └── stores.ts             # storeList estático para el carrusel
```

## 4. Enrutamiento y páginas

Definido en `src/routes/Routes.tsx`. `LogIn`, `MainLayout`, `NotFound` y `Home` se cargan eager; el resto con `React.lazy` (el `Suspense` está en `src/components/layout/main-layout.tsx` envolviendo el `Outlet`). El basename se calcula en `src/main.tsx` (siempre `'/'`).

**Importante:** aunque el comentario del código dice "Rutas protegidas", **no existe ningún guard de ruta** (no hay componente `ProtectedRoute` ni redirección en el router). Cualquier ruta renderiza para usuarios anónimos; la "protección" es reactiva: las llamadas API devuelven 401 y `src/lib/api-client.ts` redirige a `/login`. La columna "¿requiere auth?" refleja la *intención funcional*, no un guard real.

| Ruta | Componente | Descripción | ¿Requiere auth? | Rol |
|---|---|---|---|---|
| `/login` | `components/auth/login.tsx` | Inicio de sesión (fuera del layout) | No | — |
| `/` (index) y `/home` | `components/home/home.tsx` | Landing / hero | No | — |
| `/register` | `components/auth/register.tsx` | Registro (dentro del layout) | No | — |
| `/about` | `pages/about.tsx` | Información del servicio | No | — |
| `/stores` | `pages/stores.tsx` | Directorio de tiendas | No | — |
| `/pricing` | `pages/pricing.tsx` | Precios, tasas, pagos, calculadora | No | — |
| `/contact` | `pages/contact.tsx` | Formulario de contacto | No | — |
| `/profile` | `pages/profile.tsx` | Perfil del usuario | Sí (de facto: sin sesión falla la carga) | client |
| `/user_orders` | `pages/user-orders.tsx` | Listado de órdenes propias | Sí (de facto) | client |
| `/user_deliveries` | `pages/user-deliveries.tsx` | Listado de entregas propias | Sí (de facto) | client |
| `/product-list` | `components/product/product-list.tsx` (vía barrel `components/product/index.ts`) | Lista local "Mis productos" | Sí (solo por UX: el CTA de Home exige login; los datos son locales) | client |
| `/orders/:id` | `pages/order-detail.tsx` | Detalle de una orden | Sí (de facto) | client |
| `*` | `pages/not-found.tsx` | 404 | No | — |

Sin ruta asociada: `pages/scrap.tsx` (esqueleto "Scrap de Productos" vacío), `pages/home.tsx` y `pages/client.tsx` (archivos vacíos), `components/order/orders-list.tsx` (vacío).

### 4.1 `/login` — `components/auth/login.tsx`
- **Muestra:** logo (`src/assets/logo/f-logo.svg`, clic → `/`), formulario de teléfono + contraseña, enlace "Olvidó su contraseña?" (**`href="#"`, no funcional**).
- **Acciones:** submit → `useAuth().login()`; validación con Zod inline (`loginSchema`: teléfono requerido, contraseña ≥ 6) vía `react-hook-form` + `zodResolver`; errores de validación y del servidor mostrados como toasts (sonner) desglosando `details.phone_number`, `details.password`, `details.non_field_errors`; éxito → toast + `navigate('/', { replace: true })`.
- **Usa:** `hooks/auth/useAuth.ts`, `context/AuthContext.tsx`, `lib/api-client.ts` (POST `/auth/`), `components/ui/button.tsx`.

### 4.2 `/` y `/home` — `components/home/home.tsx`
- **Muestra:** logo animado (`src/assets/logo/logo.svg`), titular, texto de marca "AR&E Shipps", botones "Comenzar" y "Saber más", carrusel infinito de logos de tiendas (`components/store/store-carousel.tsx` + `utils/stores.ts` + SVGs en `public/stores/`).
- **Acciones:** "Comenzar": si `isLoading` espera; si no autenticado → toast de advertencia + redirección diferida (2 s) a `/login`; si autenticado → `/product-list`. "Saber más" → `/about`.
- **Usa:** `hooks/auth/useAuth.ts`, `react-router-dom`, `sonner`, animaciones CSS de `src/index.css` (patrón `isVisible` + `useEffect`).

### 4.3 `/register` — `components/auth/register.tsx`
- **Muestra:** formulario de información personal: nombres*, apellidos, teléfono* (placeholder `+5355555555`), email (opcional), dirección, contraseña* y confirmación (con toggle mostrar/ocultar). Indicadores en vivo de disponibilidad de teléfono/email (spinner + mensajes verde/rojo).
- **Acciones:** validaciones manuales al enviar (campos requeridos, contraseñas iguales, mínimo 6, disponibilidad); llama `useRegisterFlow().register()`; éxito → toast + redirección en 2 s a `/` (aunque el toast dice "Redirigiendo al login"); "Cancelar" limpia el formulario. El email opcional se elimina del payload si está vacío.
- **Usa:** `hooks/auth/useRegister.ts` (`useRegisterFlow`, `useCheckEmailAvailability`, `useCheckPhoneAvailability`), `services/auth/register.ts` (POST `/api_data/user/` con `role: 'client'`, `is_active: true`). **No usa Zod ni react-hook-form** (inconsistente con el login). El flujo de verificación de email (`useVerifyEmail` → GET `/verify_user/{secret}`) existe en hooks/servicios pero **ninguna ruta/página lo invoca**.

### 4.4 `/about` — `pages/about.tsx` + `components/about/Introduction.tsx`
- **Muestra:** página informativa larga con índice lateral con scroll-spy (secciones: Beneficios, Horario de atención, Cómo funciona, Recomendaciones, Preguntas frecuentes), 8 pasos ilustrados del proceso de compra (instalar app de la tienda → compartir carrito → facturación → recogida y pago del envío), lista de artículos prohibidos (vapes, drones, routers, etc.) y FAQ con `components/ui/accordion.tsx`.
- **Acciones:** solo navegación interna con scroll suave.
- **Usa:** `components/ui/accordion.tsx`, lucide-react; sin llamadas API.

### 4.5 `/stores` — `pages/stores.tsx`
- **Muestra:** directorio hard-codeado con dos secciones: "Tiendas Populares" (Amazon, eBay, AliExpress, SHEIN, Temu, Newegg, Best Buy, Costco, Target, Home Depot, Etsy, Walmart) y "Marcas de Lujo" (Nike, Adidas, Puma, Vans, Louis Vuitton, H&M, Forever 21, Ralph Lauren, Chanel, Zara, John Lewis, Gucci). Cada tarjeta muestra logo (servicio externo `img.logo.dev` con token hard-codeado `LOGO_DEV_TOKEN`, fallback a `ui-avatars.com`), categoría, descripción y especialidades.
- **Acciones:** botón "Visitar {tienda}" → `window.open` a la web externa.
- **Usa:** `components/ui/card.tsx`, `badge.tsx`, `separator.tsx`, `button.tsx`. **No consume la API de shops del backend** (los datos reales de `/api_data/public/shops/` solo se usan en la calculadora).

### 4.6 `/pricing` — `pages/pricing.tsx`
- **Muestra:** (1) `components/about/price/Pricing.tsx`: tarjetas de tarifa USD/lb por categoría obtenidas del backend (destaca la categoría central) + tarjeta estática "Envío por carga $4 USD/Lb"; (2) `components/about/price/rage-exchange.tsx`: tasas de cambio **hard-codeadas** (USD→CUP 430, USD→TCUP 435, USD→Zelle 1); (3) `components/about/price/pay-methods.tsx`: métodos de pago (CUP, USD, PayPal, Zelle con SVGs de `src/assets/payment/`); (4) `components/about/calculator.tsx`: calculadora interactiva.
- **Acciones (calculadora):** entrada de precio, impuesto adicional, peso; selects de tienda (aplica `tax_rate`) y categoría (aplica `client_shipping_charge`). Fórmula: `subtotal1 = precio + 7% base + (precio+impuestos)*tax_rate + impuestoAdicional`; `subtotal2 = peso * tarifa_categoría`; total = suma. Muestra desglose y notas (producto se paga antes; envío al recoger).
- **Usa:** `hooks/useShops.ts` → GET `/api_data/public/shops/`; `hooks/useCategories.ts` → GET `/api_data/public/categories/` (ambos `skipAuth`); `components/ui/select.tsx`, `input.tsx`, `badge.tsx`.

### 4.7 `/contact` — `pages/contact.tsx`
- **Muestra:** título, texto introductorio y formulario (nombres, apellidos, mensaje) con botón "Enviar".
- **Acciones:** **ninguna real** — `<form action="#" method="POST">` sin estado ni servicio; el envío no llega a ningún endpoint.
- **Usa:** `components/ui/button.tsx`, lucide-react.

### 4.8 `/profile` — `pages/profile.tsx`
- **Muestra:** tarjeta de avatar (iniciales), nombre completo, rol traducido al español, fecha de alta formateada; tarjeta "Información Personal" (nombres, apellidos, email, teléfono, dirección) en modo lectura o edición.
- **Acciones:** "Editar Perfil" alterna modo edición; "Guardar Cambios" → `useUser().updateUser()` (PATCH `/user/`), con estados `isUpdating`, alert de error (`components/ui/alert.tsx`) y toasts; "Cancelar" restaura los valores del usuario.
- **Usa:** `hooks/useUser.ts` (que combina `services/auth/user.ts` `updateCurrentUserProfile` + `AuthContext.updateUser` y expone `getUserDisplayName`/`getUserRole`), `components/ui/{card,button,input,badge,alert}.tsx`, `sonner`.

### 4.9 `/user_orders` — `pages/user-orders.tsx`
- **Muestra:** cabecera con contadores (total, "Procesando", "Completado"), buscador por ID/cliente/estado (filtrado en memoria), y lista de `components/order/order-row.tsx` (badge `#0000{id}`, nº de productos, fecha con `formatDateTime`, `OrderStatusLabel` y `PaymentStatusLabel` de `components/order/order-status.tsx`, total con `formatUSD`, menú "Ver detalles"). Estados de carga (`components/utils/loading-spinner.tsx`), error (`components/utils/error.tsx`) y vacío.
- **Acciones:** búsqueda local; "Ver detalles" → `/orders/{id}`.
- **Usa:** `hooks/order/useOrders.ts` → `services/orders/get-orders.ts` → GET `/api_data/order/my_orders/` (paginado; el backend deduce el cliente del JWT — el código evita explícitamente inyectar `client_id`).

### 4.10 `/orders/:id` — `pages/order-detail.tsx`
- **Muestra:** estados de carga y error propios; en éxito, `components/order/order-details.tsx`: cabecera con fecha, badges de estado de orden y pago; "Resumen Financiero" (total y valor recibido — ⚠️ formateado como **ARS** con `Intl es-AR`); grilla de `components/order/product-card.tsx` (estado, tienda, categoría, cantidades solicitada/entregada, marca "Ok" si `is_fully_delivered`); sección "Paquetes" por cada `delivery` (peso — ⚠️ mostrado en **kg** aquí y en lb en el resto de la app —, costo de envío, fecha, y galería de evidencias `deliver_picture[].image_url`).
- **Acciones:** botón "Volver a mis pedidos" → `/user_orders`.
- **Usa:** `hooks/order/useOrder.ts` → GET `/api_data/order/{id}/`; tipos de `types/order.d.ts`, `types/product.d.ts`, `types/delivery.ts`.

### 4.11 `/user_deliveries` — `pages/user-deliveries.tsx`
- **Muestra:** contadores (total, pendientes, en tránsito, entregadas), buscador local, tarjetas por entrega: `Entrega #{id}`, `Orden #{order}`, badge de estado con mapeo de colores (`Pendiente`/`Entregado`/`En transito`/`Fallida`), categoría, peso (lb), fecha, costo (`weight_cost`) y galería de evidencias si existen.
- **Acciones:** solo búsqueda local.
- **Usa:** `hooks/delivery/useDeliveries.ts` → `services/deliveries/get-deliveries.ts` → GET `/api_data/delivery_receips/my-deliveries/`.

### 4.12 `/product-list` — `components/product/product-list.tsx`
- **Muestra:** "Mis Productos": lista/grid de productos guardados **solo en localStorage** (clave `user-products`), con estadísticas (nº de productos y tiendas únicas), búsqueda, ordenación (recientes/nombre/tienda), toggle lista/cuadrícula, y aviso si localStorage no está disponible.
- **Acciones:** "Añadir Producto" abre `components/ui/dialog.tsx` con `components/product/product-form.tsx` (nombre*, link* con validación `new URL()`, tienda auto-detectada del dominio del link mediante mapeo estático `extractShopName`, descripción, etiquetas nombre:valor vía `components/ui/popover.tsx`); eliminar producto desde `components/product/product-row.tsx`; enlace externo "Ver producto".
- **Usa:** `hooks/use-local-storage.ts` (`useProductStorage`). **No llama a ningún endpoint**: la lista es una cesta/wishlist local; la creación real de órdenes la hacen los agentes desde el panel admin (la página `pages/scrap.tsx` para scraping de Amazon está vacía y sin ruta — el endpoint backend `/amazon/scrape/` no se consume desde esta app).

### 4.13 `*` — `pages/not-found.tsx`
- **Muestra:** 404 estilizado con sugerencias. **Acciones:** "Ir a inicio" (`/`) y "Volver atrás" (`navigate(-1)`).

## 5. Autenticación y sesión

Implementada en `src/context/AuthContext.tsx` (estado) + `src/lib/api-client.ts` (transporte/tokens) + `src/utils/storage.ts` (persistencia) + `src/hooks/auth/*`.

**Login**
1. `components/auth/login.tsx` → `AuthContext.login(credentials)` con `{ phone_number, password }`.
2. `apiClient.login()` hace `POST /arye_system/auth/` con `skipAuth`. Acepta tokens con nombres `access/refresh` **o** `access_token/refresh_token` (compatibilidad doble en todo el código).
3. Tokens: `apiClient.setAuthToken()` guarda el access en memoria y en localStorage bajo `access_token` **y** `access` (legado); el refresh bajo `refresh_token` **y** `refresh`. `AuthContext.login` además re-persiste vía `STORAGE_KEYS` de `utils/storage.ts`.
4. `dispatch AUTH_SUCCESS` persiste `auth_user`, `auth_permissions` (vacío — sistema de permisos no implementado, comentado "por ahora") y `auth_last_activity`.

**Registro:** `AuthContext.register` → `apiClient.register()` → `POST /register/`… pero el flujo realmente usado por la UI es `services/auth/register.ts` → `POST /api_data/user/` (vía `hooks/auth/useRegister.ts`). No hay login automático tras registrar. Los toasts del registro sugieren verificación por email, y existen `verifyEmail` (GET `/verify_user/{secret}`) y `useVerifyEmail`, pero **no hay ruta/página que complete esa verificación en el cliente**.

**Recuperación de contraseña:** `services/auth/password.ts` define `requestPasswordReset` (POST `/auth/password-reset/`), `confirmPasswordReset`, `changePassword` y `validateResetToken`, pero **ninguno está conectado a la UI** (el enlace del login es `href="#"`).

**Persistencia y arranque:** `getInitialState()` en `AuthContext` ejecuta `migrateAuthData()` y `validateAuthData()` (`utils/storage.ts`): exige consistencia token↔usuario y que la última actividad tenga ≤ 7 días; si falla, limpia todo (`clearAuthStorage`). Al montar, `checkExistingAuth()` (una sola vez, con refs anti-reentrada) valida el token llamando `GET /user/` (`apiClient.getCurrentUser`) y repuebla el usuario.

**Refresh de token:** el interceptor de respuesta de `api-client.ts` ante un 401 intenta `POST /auth/refresh/` con el `refresh_token`; si tiene éxito actualiza tokens, **pero no reintenta la petición original** (la petición que recibió el 401 falla igualmente). Si el refresh falla: toast "Sesión expirada", limpieza de tokens y redirección diferida (1 s) a `/login`, salvo que la ruta actual contenga `/profile`. También hay un servicio paralelo `services/auth/tokens.ts::refreshToken` (mismo endpoint) no usado por el interceptor.

**Logout:** `AuthContext.logout` → `apiClient.logout()` (`POST /logout/` con `refresh_token`) → limpieza local (`clearAuthToken` + `clearAuthStorage`) → `AUTH_LOGOUT`. `components/navigation/user-nav.tsx` navega después a `/login`.

**Sesión activa:** listeners de `mousedown/keypress/scroll/touchstart` actualizan `lastActivity` con throttle de 60 s; un intervalo por minuto fuerza logout tras **30 minutos** de inactividad.

**Guards de ruta:** no existen. La protección es: (a) UX en Home (CTA exige login), (b) redirección del interceptor ante 401, (c) el backend filtra datos por JWT en `/my_orders/` y `/my-deliveries/`.

**Claves de almacenamiento en uso** (todas en localStorage): `access_token`, `access`, `refresh_token`, `refresh`, `auth_user`, `auth_permissions`, `auth_last_activity`, `user-products` (lista de productos), `theme`, y `user` (escrita solo por `services/auth/login.ts::login`, nunca leída ni limpiada). Las variables `VITE_AUTH_TOKEN_KEY`/`VITE_REFRESH_TOKEN_KEY` documentadas a nivel de monorepo **no se usan en esta app**: las claves están hard-codeadas.

## 6. Flujos de usuario principales

### 6.1 Registro y login
1. `/register` (`components/auth/register.tsx`): el usuario rellena el formulario. Mientras escribe, se consultan disponibilidad de teléfono (GET `/api_data/user/?phone_number=...`, habilitada con >8 caracteres) y de email (GET `/api_data/user/?email=...`, habilitada si contiene `@`), con caché de 5 min. Estados intermedios: spinners junto al campo, mensajes "disponible/ya registrado", botón deshabilitado hasta que `isFormValid`.
2. Submit → validaciones locales (requeridos, contraseñas iguales, ≥6 chars, disponibilidad) → `POST /api_data/user/` con `role: 'client'`. Errores del backend se mapean a toasts por campo.
3. Éxito → toast "¡Registro exitoso!… Redirigiendo al login…" → redirección real a `/` a los 2 s (no a `/login`; incoherencia menor). No hay pantalla de verificación de email aunque el backend puede enviarla.
4. `/login`: teléfono + contraseña → `POST /arye_system/auth/` → tokens y usuario persistidos → toast → `/`. NavBar (`components/navigation/nav-bar.tsx`) pasa a mostrar `NavUser` con avatar y accesos (Perfil, Mis productos, Órdenes, Entregas con badge de pendientes, Cerrar sesión).

### 6.2 Explorar tiendas
1. `/stores` (`pages/stores.tsx`): grilla estática de 24 tiendas en dos secciones; logos vía `img.logo.dev` con fallback a avatar generado. Sin backend.
2. Acción única: "Visitar {tienda}" abre la web externa en pestaña nueva.
3. Complemento en Home: carrusel auto-scroll (`components/store/store-carousel.tsx`) con logos locales `public/stores/{nombre}.svg` según `utils/stores.ts`.

### 6.3 Crear pedido / solicitud de producto (lista local)
> No existe creación de órdenes contra el backend desde esta app; el flujo real (descrito en `/about`) es: el cliente arma su lista o comparte su carrito con un agente, y la orden la crea el gestor en el panel admin. El scraping de Amazon (backend `/amazon/scrape/`) **no está integrado**: `pages/scrap.tsx` es un esqueleto sin ruta.

1. Home → CTA "Comenzar" (`components/home/home.tsx`): si no hay sesión → toast + `/login`; si hay → `/product-list`.
2. `/product-list` → "Añadir Producto" abre el diálogo con `components/product/product-form.tsx`.
3. Formulario: nombre* y link* obligatorios; al escribir el link, `extractShopName()` autodetecta la tienda (mapeo de ~18 dominios, campo `shop` readonly con indicadores ✓/⚠); descripción y etiquetas `nombre: valor` opcionales.
4. Validaciones: nombre/link no vacíos, `new URL(link)` válida; errores como toasts de advertencia.
5. Submit → el producto (`CreateProduc` de `types/product.d.ts` + `id: Date.now()`) se guarda en localStorage `user-products` (`useProductStorage`). **Ningún endpoint es llamado.**
6. Gestión posterior: búsqueda, ordenación, vista lista/grid, eliminación por producto.

### 6.4 Seguimiento de pedidos
1. Menú de usuario → "Órdenes" → `/user_orders`.
2. `useOrders()` → GET `/arye_system/api_data/order/my_orders/` (paginado `page=1&per_page=20`; el backend filtra por el JWT). Estados: spinner (carga), `ErrorMeassage` (error), tarjeta vacía con CTA informativo, o lista de `OrderRow`.
3. Cada fila muestra estado (`Encargado`/`Procesando`/`Completado`/`Cancelado`) y pago (`Pagado`/`No pagado`/`Parcial`) según los union types de `types/base.ts`.
4. "Ver detalles" → `/orders/:id` → `useOrder(id)` → GET `/api_data/order/{id}/` → `components/order/order-details.tsx` con productos (cantidades solicitadas/entregadas), resumen financiero y paquetes con evidencias fotográficas.

### 6.5 Seguimiento de entregas
1. Menú de usuario → "Entregas" (badge rojo con `pendingCount` de `usePendingDeliveries`, que consulta GET `/api_data/delivery_receips/my-deliveries/?status=Pendiente` cada 2 min de staleTime) → `/user_deliveries`.
2. `useDeliveries()` → GET `/api_data/delivery_receips/my-deliveries/` (filtros opcionales `status`, `date_from`, `date_to`; el servicio elimina defensivamente cualquier `client_id`).
3. Tarjetas con estado mapeado a colores, peso/fecha/costo y evidencias de entrega (`deliver_picture[].image_url` de Cloudinary).

### 6.6 Edición de perfil
1. Menú de usuario → "Perfil" → `/profile`.
2. Carga desde el `AuthContext` (poblado con GET `/arye_system/user/` al montar la app). Estados: spinner, error, o datos.
3. "Editar Perfil" → inputs controlados (estado local `formData` sincronizado con `user` por `useEffect`).
4. "Guardar" → `useUser().updateUser()` → PATCH `/arye_system/user/` (`services/auth/user.ts::updateCurrentUserProfile`) → sincroniza el contexto (`AuthContext.updateUser` re-persiste `auth_user`) → invalida query `['user']` → toast de éxito. Errores: `getErrorMessage()` desglosa errores DRF por campo y los muestra en `Alert` + toast.
5. "Cancelar" restaura los valores originales.

### 6.7 Contacto
1. `/contact` (`pages/contact.tsx`): formulario visual (nombres, apellidos, mensaje).
2. **No hay paso 2**: el formulario no tiene manejador de envío ni servicio asociado (`action="#"`); el submit recarga/no hace nada útil. Es el flujo más incompleto de la app.

## 7. Servicios y consumo de API

**Cliente HTTP:** clase `ApiClient` en `src/lib/api-client.ts` (singleton `apiClient`, exportado también desde `src/lib/index.ts`). Base URL: `(VITE_API_URL || 'http://localhost:8000') + '/arye_system'`, timeout 30 s, `Content-Type: application/json`.

**Interceptores:**
- *Request:* añade `Authorization: Bearer {token}` salvo `skipAuth: true`.
- *Response (errores):* 401 → intento de refresh (`POST /auth/refresh/`) sin reintento de la petición original; limpieza y redirección diferida a `/login` (excepto en `/profile`); 403 → toast "Acceso denegado"; 429 → toast "Demasiadas solicitudes"; todos los errores se normalizan a `ApiErrorResponse` (`message` legible extraído de `detail`/`message`/`error`/errores de campo DRF, `status`, `isNetworkError/isServerError/isClientError`, `details` con el cuerpo original).

**Métodos:** `get/post/put/patch/delete` (devuelven `response.data` tipado), `getPaginated` (inyecta `page: 1, per_page: 20` y elimina params `'all'`/null/`''`), `uploadFile` (multipart, sin uso actual), `downloadFile` (blob, sin uso actual), más `login/register/logout/getCurrentUser/updateCurrentUser`.

| Servicio (archivo) | Endpoint(s) | Método | Para qué / notas |
|---|---|---|---|
| `lib/api-client.ts` (métodos propios) | `/auth/` · `/auth/refresh/` · `/register/` · `/logout/` · `/user/` | POST · POST · POST · POST · GET+PATCH | Login JWT; refresh; registro alterno (no usado por la UI); logout con blacklist de refresh; perfil actual |
| `services/auth/login.ts` | `/auth/` (vía apiClient.login) · `/auth/verify-credentials/` · `/auth/social-login/` | POST | Login (duplica persistencia de tokens y guarda clave `user` huérfana); verificación de credenciales y social login **no usados** |
| `services/auth/register.ts` | `/api_data/user/` · `/verify_user/{secret}` · `/api_data/user/?email=` · `/api_data/user/?phone_number=` | POST · GET · GET · GET | Registro real de la UI (fija `role: 'client'`); verificación de email (sin UI); chequeos de disponibilidad (en error asumen "disponible") |
| `services/auth/logout.ts` | `/logout/` (vía apiClient) · `/auth/logout-all/` | POST | Logout; cierre de todas las sesiones (**no usado**) |
| `services/auth/password.ts` | `/auth/password-reset/` · `/auth/password-reset-confirm/` · `/auth/change-password/` · `/auth/validate-reset-token/` | POST | Gestión de contraseñas — **ninguno conectado a la UI** |
| `services/auth/tokens.ts` | `/auth/refresh/` · `/security/` | POST · GET | Refresh manual y verificación de token (**no usados**; `blacklistToken` lanza "not implemented") |
| `services/auth/user.ts` | `/api_data/user/` (+`/{id}/`, `/stats/`, `/recent/`, `/export/`) · `/user/` | GET/POST/PATCH/DELETE · GET/PATCH | CRUD y utilidades de usuarios (mayormente heredadas del admin, **sin uso en cliente**); `getCurrentUserProfile`/`updateCurrentUserProfile` sí se usan (perfil) |
| `services/orders/get-orders.ts` | `/api_data/order/{id}/` · `/api_data/order/my_orders/` | GET | Detalle de orden; órdenes del usuario autenticado (sin `client_id`, lo determina el JWT) |
| `services/deliveries/get-deliveries.ts` | `/api_data/delivery_receips/{id}/` · `/api_data/delivery_receips/my-deliveries/` | GET | Detalle de entrega (**no usado**); entregas del usuario (nota: ortografía `delivery_receips` y mezcla `my_orders` con guion bajo vs `my-deliveries` con guion) |
| `services/shops/get-shops.ts` | `/api_data/public/shops/` | GET (`skipAuth`) | Tiendas públicas con `tax_rate` para la calculadora |
| `services/categories/get-categories.ts` | `/api_data/public/categories/` | GET (`skipAuth`) | Categorías públicas con `client_shipping_charge` para precios/calculadora |

## 8. Estado global y hooks

**Contextos:**
- `src/context/AuthContext.tsx` — único contexto global. `useReducer` con acciones `AUTH_START/AUTH_SUCCESS/AUTH_ERROR/AUTH_LOGOUT/UPDATE_USER/UPDATE_ACTIVITY/CLEAR_ERROR`; estado `{ user, isAuthenticated, isLoading, error, permissions, lastActivity }`; callbacks estabilizados leyendo de `stateRef` para evitar cascadas de re-render; auto-logout por inactividad y persistencia descritas en la sección 5.

**Hooks personalizados:**

| Hook (archivo) | Qué hace |
|---|---|
| `useAuth` (+ `useAuthUser`, `useAuthStatus`, `useAuthLoading`, `useAuthError`, `usePermissions`, `useRoles`, `useIsAdmin`, `useAuthActions`) — `hooks/auth/useAuth.ts` | Acceso al AuthContext y selecciones parciales; `usePermissions`/`useRoles` calculan `hasAll/hasSome`; `useIsAdmin` mira `is_staff` |
| `useRegister`, `useVerifyEmail`, `useCheckEmailAvailability`, `useCheckPhoneAvailability`, `useRegisterFlow` — `hooks/auth/useRegister.ts` | Mutaciones de registro/verificación y queries de disponibilidad; `useRegisterFlow` agrega todo (estados `isRegistering`, `registerError`, `reset`) |
| `useOrders(filters?)` — `hooks/order/useOrders.ts` | Lista paginada de órdenes propias; normaliza filtros para la query key; expone `orders`, `total`, `invalidateOrders` |
| `useOrder(orderId)` — `hooks/order/useOrder.ts` | Orden individual (`enabled: !!orderId`); `invalidateOrder` |
| `useDeliveries(filters?)` / `usePendingDeliveries()` — `hooks/delivery/useDeliveries.ts` | Entregas propias; el segundo trae el `count` de pendientes para el badge del menú |
| `useUser` (+ `useUserBasic`, `useUserPermissions`) — `hooks/useUser.ts` | Perfil actual desde AuthContext + mutación de actualización (servicio + sincronización de contexto), extracción rica de mensajes de error, `getUserDisplayName`, `getUserRole` (etiquetas de rol en español); `useUserPermissions` ofrece `isAdmin/isAgent/canManageOrders` (herencia del admin, poco usada aquí) |
| `useShops` — `hooks/useShops.ts` | Tiendas públicas (staleTime 5 min) |
| `useCategories` — `hooks/useCategories.ts` | Categorías públicas (staleTime 5 min) |
| `useLocalStorage<T>` / `useProductStorage` — `hooks/use-local-storage.ts` | Estado sincronizado con localStorage, con evento custom `localStorage-change` para sincronizar pestañas; `useProductStorage` fija la clave `user-products` |
| `useTheme` — `hooks/use-theme.ts` | Tema `light/dark/system` aplicando clases al `<html>` y clave `theme`; consumido únicamente por `components/ui/sonner.tsx` |

**TanStack Query** (`src/lib/query-client.ts`): defaults `staleTime` 5 min, `gcTime` 10 min, `refetchOnWindowFocus: false`, `refetchOnReconnect/Mount: true`, retry hasta 3 con backoff exponencial (salta 404), mutaciones con 1 retry. El export `queryKeys.all = ["admin"]` es un residuo copiado del admin, sin uso real.

**Claves de query en uso:** `['orders', normalizedFilters]`, `['order', orderId]`, `['deliveries', normalizedFilters]`, `['deliveries-pending']`, `['public-shops']`, `['public-categories']`, `['auth', 'register']`, `['auth', 'verify-email']`, `['auth', 'check-email', email]`, `['auth', 'check-phone', phone]`, `['user']` (solo como objetivo de invalidación en `useUser`).

**Invalidaciones:** manuales y puntuales — `invalidateOrders`/`invalidateOrder`/`invalidateDeliveries` expuestas por los hooks (sin consumidores actuales), y `queryClient.invalidateQueries({ queryKey: ['user'] })` tras actualizar el perfil. Al ser una app de solo lectura respecto a órdenes/entregas, no hay invalidaciones cruzadas tras mutaciones.

## 9. Componentes destacados y sistema de diseño actual

**Tema y colores** — Tailwind 4 CSS-first: no hay `tailwind.config.js`; todos los tokens viven en `src/index.css` como variables CSS oklch mapeadas en `@theme inline` (convención shadcn/ui, estilo "new-york", baseColor neutral según `components.json`).

- **Primario (naranja de marca):** claro `--primary: oklch(70.82% 0.174 54.39)`; oscuro `--primary: oklch(74.39% 0.16864 48.111)` ("naranja dorado"). El ring y charts derivan del mismo tono.
- **Fondos:** `--background` claro es en realidad un gris muy oscuro translúcido `oklch(24.354% … / 0.884)` (pese al comentario "Blanco puro" — el diseño efectivo es *dark-first*); `.dark` usa `oklch(21.779% …)`. Sobre esto, `App.tsx` añade dos blobs decorativos fijos con gradientes `#dd6540→#ca9b0d` y `#fab834→#885b00` (blur 3xl), y `MainLayout` superpone `bg-black/40`.
- **Acentos recurrentes hard-codeados en componentes:** gradientes `from-orange-500 to-amber-500` (botones de perfil/404), `from-orange-400 to-amber-500` (avatares), textos `text-orange-400`, `slate-700/800` en la calculadora.
- **Radio:** `--radius: 0.625rem` con escala sm/md/lg/xl.
- **Animaciones custom** en `index.css`: `fadeIn`, `slideUp`, `scaleIn`, `pulseGlow` + clases `.animate-fade-in/.animate-slide-up/.animate-scale-in/.animate-pulse-slow` y `.btn-hover-glow`; scrollbar personalizada naranja. Patrón repetido en casi todas las páginas: estado `isVisible` + `useEffect` + clases de transición escalonadas (`delay-300/500/700`).

**Componentes compartidos clave:**
- `components/layout/main-layout.tsx` — layout único: header sticky (con `zIndex: 100000` inline), `Suspense` con spinner de fallback, footer.
- `components/navigation/nav-bar.tsx` — navegación desktop + menú móvil en `components/ui/sheet.tsx` con descripciones por ítem; muestra login/registro o `NavUser` según sesión.
- `components/navigation/user-nav.tsx` — dropdown de usuario con iniciales, accesos y badge rojo de entregas pendientes.
- `components/order/order-status.tsx` — `OrderStatusLabel` y `PaymentStatusLabel`: badges con icono/estilo por estado, mapeados a los union types de `types/base.ts`.
- `components/order/order-row.tsx` — fila de orden responsive: grid de 2 columnas en móvil (con segunda fila de estados) y 3 en desktop.
- `components/order/product-card.tsx` — tarjeta memoizada (`React.memo`) con contadores solicitado/entregado.
- `components/store/store-carousel.tsx` — embla + AutoScroll, logos desde `public/stores/`.
- `components/utils/loading-spinner.tsx` (tamaños sm/md/lg, modo fullScreen; variantes `bee`/`honey` que referencian clases `border-bee-500`/`border-honey-500` inexistentes) y `components/utils/error.tsx` (`ErrorMeassage`, sic).
- `components/error-boundary.tsx` — boundary de clase con detalle del error en dev y botón de recarga.
- `components/ui/*` — shadcn/ui generados (accordion, alert, avatar, badge, button, card, carousel, checkbox, dialog, dropdown-menu, empty, input, popover, select, separator, sheet, sonner, tabs, textarea, tooltip): no modificar.

**Patrones responsive:** mobile-first con breakpoints `sm/md/lg`; navegación colapsada a Sheet en `<lg`; grids `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (stores, productos), `lg:grid-cols-4` (perfil); `OrderRow` reordena su contenido por breakpoint; tipografías escaladas (`text-2xl sm:text-3xl lg:text-4xl`). No se usan las utilidades `use-responsive-view`/`mobile-data-card` mencionadas en el CLAUDE.md raíz (son del admin).

## 10. Validación y esquemas

- **No existe `src/schemas/`** pese a la convención del monorepo.
- **Único esquema Zod:** `loginSchema` inline en `src/components/auth/login.tsx` (`phone` requerido; `password` requerida y ≥ 6), conectado a `react-hook-form` con `zodResolver` y modo `onSubmit`; los errores se muestran como toasts vía callback `onError`.
- **Registro (`components/auth/register.tsx`):** validación completamente manual (ifs + toasts + atributos HTML `required/minLength`) más chequeos asíncronos de disponibilidad; sin Zod ni RHF.
- **Formulario de producto (`components/product/product-form.tsx`):** validación manual (campos vacíos, `new URL()`).
- **Perfil (`pages/profile.tsx`):** sin validación cliente; delega en los errores DRF del backend, desglosados por `hooks/useUser.ts::getErrorMessage`.
- **Contacto:** sin validación (formulario inerte).
- La "validación de datos de sesión" (`validateAuthData` en `src/utils/storage.ts`) es estructural (consistencia token/usuario, antigüedad ≤ 7 días), no de esquema.

## 11. Configuración y variables de entorno

Archivos: `.env.example` (plantilla) y `.env.production` (valores reales de producción). Lectura vía `import.meta.env`.

| Variable | Uso real en el código |
|---|---|
| `VITE_API_URL` | Base del backend; en producción `https://ar-e-web.onrender.com`; fallback `http://localhost:8000`; siempre se le concatena `/arye_system` (`src/lib/api-client.ts`) |
| `VITE_DEPLOY_TARGET` | Leída en `src/main.tsx` para el basename, aunque ambas ramas devuelven `'/'` (efecto nulo); el script `build:vercel` la define |
| `VITE_APP_ENV`, `VITE_APP_NAME`, `VITE_ENABLE_ANALYTICS`, `VITE_DEBUG` | Declaradas en los .env pero **no referenciadas en `src/`** |
| `VITE_CLOUDINARY_*`, `VITE_SUPABASE_*` | Solo en `.env.example`; sin uso en el código del cliente |
| `VITE_AUTH_TOKEN_KEY`, `VITE_REFRESH_TOKEN_KEY` | Documentadas en el CLAUDE.md del monorepo pero **no implementadas**: las claves de localStorage están hard-codeadas |
| `import.meta.env.DEV` | Guarda de logs/avisos en `api-client.ts`, `AuthContext.tsx`, `utils/storage.ts`, `error-boundary.tsx` |

Otras configuraciones: `vite.config.ts` (alias `@→src`, `server.port: 5173` con `strictPort` — ⚠️ el monorepo documenta 5174 para el cliente —, `manualChunks` por librería, terser con `drop_console` en producción, target `es2020`, comentarios orientados a Cloudflare Pages); `_redirects` con fallback SPA; `components.json` para shadcn/ui; `tsconfig.build.json` para el type-check de build; `nginx.conf` presente en la raíz de la app (despliegue alternativo en contenedor).

## 12. Puntos débiles y deuda técnica observada

Concreto y verificable en el código:

1. **Sin guards de ruta reales.** `src/routes/Routes.tsx` comenta "Rutas protegidas" pero no hay `ProtectedRoute`; `/profile`, `/user_orders`, `/user_deliveries`, `/orders/:id` renderizan para anónimos y dependen de que el 401 del API redirija (con excepción expresa de `/profile` en `api-client.ts::handleUnauthorized`, que entonces ni redirige).
2. **Refresh de token incompleto.** El interceptor 401 de `src/lib/api-client.ts` refresca el token pero **no reintenta la petición original**: la primera llamada tras expirar siempre falla aunque el refresh funcione.
3. **Gestión de tokens cuadruplicada e inconsistente.** Escriben/leen tokens: `api-client.ts` (claves `access_token`+`access`, `refresh_token`+`refresh`), `context/AuthContext.tsx` (vía `STORAGE_KEYS`), `services/auth/login.ts` (además guarda `user`, clave que nadie lee y que `clearAuthStorage` no limpia) y `services/auth/tokens.ts`. Las env vars `VITE_AUTH_TOKEN_KEY`/`VITE_REFRESH_TOKEN_KEY` prometidas no existen en el código.
4. **Archivos vacíos/muertos:** `src/pages/home.tsx` y `src/pages/client.tsx` (0 bytes), `src/components/order/orders-list.tsx` (vacío), `src/pages/scrap.tsx` (esqueleto sin ruta). Confunden la correspondencia página↔ruta (el Home real está en `components/home/home.tsx`).
5. **Funcionalidad prometida y no conectada:** recuperación de contraseña (`services/auth/password.ts` completo, enlace del login en `href="#"`), verificación de email (`useVerifyEmail`/`GET /verify_user/{secret}` sin página), `logoutAllSessions`, social login, `uploadFile`/`downloadFile`, y todo el CRUD administrativo de `services/auth/user.ts` (stats, export, cambio de rol) que no aplica al cliente.
6. **Formulario de contacto inerte** (`src/pages/contact.tsx`): sin estado, sin submit handler, sin endpoint; además mezcla idiomas ("Message" junto a "Nombres/Apellidos").
7. **Chequeo de disponibilidad de email/teléfono dudoso** (`services/auth/register.ts`): consulta el listado general `GET /api_data/user/?email=...` (enumeración de usuarios desde un cliente sin sesión; probablemente requiere permisos), espera un array cuando el endpoint es paginado, y ante cualquier error asume "disponible".
8. **Inconsistencias visuales/de datos en órdenes:** `components/order/order-details.tsx` formatea moneda como **ARS** (`es-AR`) mientras `order-row.tsx` usa `formatUSD`; el peso del paquete se muestra en **kg** en el detalle y en **lb** en entregas/calculadora.
9. **Estilo de validación de formularios inconsistente:** login con Zod+RHF; registro, producto y perfil con validación manual duplicada (la regla "≥6 caracteres" está repetida en tres sitios).
10. **Página de tiendas desconectada del backend** (`src/pages/stores.tsx`): catálogo hard-codeado (duplicado parcialmente con `utils/stores.ts`), token de `logo.dev` hard-codeado en el código fuente, y bug: para Vans devuelve el string literal `'@/assets/stores/vans-og.svg'`, que no resuelve en runtime (siempre cae al fallback `onError`).
11. **Tasas de cambio hard-codeadas** (`components/about/price/rage-exchange.tsx`: USD→CUP 430) que caducan rápido y no provienen del backend, en contraste con precios/categorías que sí son dinámicos.
12. **Residuos y erratas:** directivas `'use client'` (Next.js) en una app Vite (`user-orders.tsx`, `user-deliveries.tsx`, `home.tsx`); `queryKeys.all = ["admin"]` copiado del admin; componente `ErrorMeassage` (typo); variantes `bee/honey` del spinner apuntando a clases Tailwind inexistentes; typo en token CSS `--colo-card-border` en `index.css` (y falta el `;` en esa línea); comentarios de la paleta que no corresponden a los valores ("Blanco puro" sobre un fondo oscuro); `export default { NavUser }` en `user-nav.tsx` (objeto como default export).
13. **Hacks de z-index extremos:** header con `zIndex: 100000` inline en `main-layout.tsx` y `zIndex: 100001` en los `SelectContent` de la calculadora para poder superponerse — señal de un stacking context mal resuelto.
14. **`usePendingDeliveries` ineficiente:** pide la lista paginada completa de entregas pendientes solo para leer `count` (bastaría `per_page=1` o un endpoint de conteo).
15. **Redirección post-registro incoherente:** el toast anuncia "Redirigiendo al login" pero navega a `/` (`components/auth/register.tsx`).
16. **Nomenclatura de endpoints frágil:** `delivery_receips` (sic) vs `delivery_receipts` documentado en el CLAUDE.md raíz, y mezcla de estilos `my_orders` / `my-deliveries` — cualquier corrección de ortografía en el backend rompería el cliente silenciosamente.
17. **Puerto de dev divergente:** `vite.config.ts` fija `5173` con `strictPort: true`, mientras la documentación del monorepo asigna 5173 al admin y 5174 al cliente — ejecutar ambos a la vez provoca conflicto.
18. **`types/api.d.ts` sobredimensionado:** cientos de líneas de tipos (dashboard, reportes, audit logs, tablas) heredados del admin y sin uso en esta app, que dificultan ver qué contrato consume realmente el cliente.
19. **El flujo de compra central es externo a la app:** "Mis productos" vive solo en localStorage (`user-products`) y nunca se envía al backend; no hay ningún `POST` de orden ni integración con `/amazon/scrape/`. El puente cliente→agente queda fuera del sistema (según `/about`, compartir el carrito con un gestor), lo que hace el recorrido confuso dentro de la propia app.
20. **Responsive con detalles pendientes:** dependencia fuerte de animaciones/transiciones repetidas a mano por página (patrón `isVisible` clonado en ≥7 archivos) en vez de un componente/util común; el índice lateral de `Introduction.tsx` y las tarjetas de la calculadora tienen anchos fijos (`w-72` en `product-card.tsx`) que fuerzan wrapping irregular en pantallas medianas.
