# Panel de Administración (apps/admin)

> Documento de referencia técnica para mantenimiento y para el port a Next.js (`apps/admin-next`). Todas las rutas de archivo son relativas a `apps/admin/` salvo indicación contraria. La app consume el backend Django bajo el prefijo `/arye_system/` (configurado vía `VITE_API_URL`, por defecto `http://localhost:8000/arye_system`).

---

## 1. Propósito y roles de usuario

El panel administra el negocio de compras/logística de AR&E Shipps (compras en tiendas tipo Shein/Amazon por encargo, recepción de paquetes y entregas al cliente final): usuarios, tiendas, pedidos, productos, compras, paquetes, entregas, finanzas y reportes.

### Roles

Definidos en `src/types/models/user.ts` (`UserRole = 'agent' | 'accountant' | 'logistical' | 'admin' | 'client'`) y con etiquetas en `roleLabels` (duplicadas también en `src/routes/role-config.ts`).

| Rol | Qué puede hacer en el panel |
|---|---|
| `admin` | Acceso total a todas las rutas y menús. `hasRouteAccess()` retorna `true` siempre para admin. |
| `agent` | Dashboard (métricas propias vía `AgentMetricsSummary`), Usuarios, Órdenes (crea pedidos solo para sus clientes; `sales_manager_id` se auto-asigna a sí mismo en `src/components/orders/CreateOrderDialog.tsx`), Productos, Entrega (solo lectura/detalle: en `src/pages/DeliveryDetail.tsx` el botón "Agregar Producto" se oculta si `isAgent`), Perfil, Configuración. |
| `accountant` | Dashboard, Costos de Envío (invoices), Registro de Gastos, Balance General, Balance de Clientes, Análisis, Perfil, Configuración. |
| `logistical` | Dashboard, Productos, Paquetes (CRUD completo + gestión de productos), Entrega (CRUD completo + gestión de productos), Perfil, Configuración. |
| `client` | **Sin acceso al panel.** `ProtectedRoute` dispara `logout()` automático si detecta un usuario con rol `client` (evita loop infinito de redirecciones; ver comentario en `src/components/utils/ProtectedRoute.tsx`). |

### Cómo se aplican los permisos en el frontend

1. **Guard por ruta** — `src/components/utils/ProtectedRoute.tsx` (el que usa `AppRoutes`; existe un duplicado casi idéntico en `src/routes/protected-route.tsx`):
   - Sin sesión → `Navigate` a `/login` con `state.from`.
   - Rol `client` → logout forzado.
   - Si la ruta declara `allowedRoles` y el rol no está incluido → `/unauthorized` (`src/routes/unauthorized.tsx`).
   - Verificación adicional contra `hasRouteAccess(role, pathname)` de `src/routes/role-config.ts`, que compila patrones con `:id` a regex.
2. **Listas de rutas por rol** — `src/routes/role-config.ts` exporta `roleAllowedRoutes` (rutas accesibles) y `roleVisibleNavHrefs` (hrefs visibles en el sidebar).
3. **Menú condicional** — `src/components/navigation/AsideNav.tsx` filtra `navigationGroups` con `roleVisibleNavHrefs`; para `admin` muestra todo (`visibleHrefs === null`).
4. **Condicionales puntuales en UI** — ej.: `Users.tsx` solo muestra `CompactMetricsSummary` si `user.role === 'admin'`; `Dashboard.tsx` muestra `AgentMetricsSummary` vs `MetricsSummaryCards` según rol; `CreateOrderDialog` bloquea el selector de manager si es agente.

---

## 2. Stack técnico y dependencias clave

Fuente: `package.json`.

| Categoría | Dependencia | Uso |
|---|---|---|
| Core | `react@^19.1.1`, `react-dom`, `typescript@~5.8.3`, `vite@^7.1.0` (+ `@vitejs/plugin-react-swc`) | SPA con build para Cloudflare Pages (`vite.config.ts` — chunks manuales, terser en prod, `drop_console`). |
| Routing | `react-router-dom@^7.8.0` | `BrowserRouter` en `src/App.tsx`, rutas lazy en `src/routes/AppRoutes.tsx`. |
| Estilos | `tailwindcss@^4.1.11` (`@tailwindcss/vite`), `tw-animate-css`, `tailwindcss-animate`, `class-variance-authority`, `clsx`, `tailwind-merge` | Tema en `src/index.css`; helper `cn()` en `src/lib/utils.ts`. |
| UI | shadcn/ui (`src/components/ui/*`), Radix UI (`@radix-ui/react-*`), `lucide-react`, `cmdk`, `sonner` (toasts), `react-day-picker` | 30+ primitivas en `src/components/ui/`. |
| Estado servidor | `@tanstack/react-query@^5.84.2` (+ devtools) | `QueryClient` en `src/App.tsx` (staleTime 2 min, retry 1, sin refetch on focus). |
| Formularios | `react-hook-form@^7.62.0`, `@hookform/resolvers`, `zod@^4.0.17` | Formularios de compras, entregas, paquetes, usuarios, login, gastos, facturas. |
| HTTP | `axios@^1.11.0` | Cliente central `src/lib/api-client.ts` con interceptores JWT/refresh. |
| Gráficas | `recharts@^2.15.4` + `src/components/ui/chart.tsx` | `Analytics.tsx`, `src/components/charts/DashboardCharts.tsx`, métricas. |
| Imágenes | `@cloudinary/react`, `@cloudinary/url-gen` | `src/services/cloudinaryService.ts`, `src/components/images/*`. |
| QR | `react-qrcode-logo`, `react-qr-code` | `src/components/products/qr-link.tsx` (QR del link de producto con logo). |
| Otros | `date-fns`, `lodash`, `next-themes` (no aplicado realmente), `@supabase/supabase-js` (dependencia presente, uso marginal/legacy) | — |
| Test | `vitest`, `@testing-library/*`, `jsdom` (`src/setupTests.ts`) | Configurado pero sin suite real. |

⚠️ `package.json` contiene entradas de dependencias corruptas (`"jest-dom@^6.0.0": "link:...@testing-library\\jest-dom@^6.0.0"`, `"react@^15.0.0": "link:..."`, `"user-event@^14.0.0"`), residuo de un mal merge.

---

## 3. Estructura de carpetas

```
apps/admin/
├── vite.config.ts               # Alias @ → src, build Cloudflare (terser, manualChunks)
├── components.json              # Config shadcn/ui
├── .env.example                 # Variables VITE_* documentadas
├── nginx.conf                   # Config para despliegue alternativo
└── src/
    ├── main.tsx                 # Entry: StrictMode + App
    ├── App.tsx                  # QueryClientProvider + ErrorBoundary + AuthProvider + Router + Toaster
    ├── index.css                # TEMA: variables oklch (naranja/gris/blanco), sidebar oscuro, scrollbars, estilos sonner
    ├── TailwindTest.tsx         # Residuo de pruebas (deuda)
    ├── auth/index.ts            # Re-export de useAuth
    ├── assets/logo/             # Logos SVG (f-logo.svg, logo.svg)
    ├── config/adminFeatures.ts  # Feature flags internos (poco usado)
    ├── constants/
    │   ├── auth.ts              # AUTH_ENDPOINTS: /auth/, /auth/refresh/, /user/, /register/...
    │   └── shop-logos.ts        # Logos conocidos por tienda
    ├── context/AuthContext.tsx  # Reducer de sesión, persistencia local/sessionStorage, inactividad 1h
    ├── layouts/MainLayout.tsx   # AppSidebarWrapper + <Outlet/> con Suspense
    ├── routes/
    │   ├── AppRoutes.tsx        # TODAS las rutas + RoleGuard
    │   ├── role-config.ts       # roleAllowedRoutes, roleVisibleNavHrefs, hasRouteAccess
    │   ├── protected-route.tsx  # Duplicado de components/utils/ProtectedRoute (deuda)
    │   └── unauthorized.tsx     # Página "Acceso denegado"
    ├── pages/                   # Páginas de nivel de ruta
    │   ├── Dashboard, Users, Shops, Products, Orders, Purchases, Packages, Delivery,
    │   ├── DeliveryDetail, Categories, Balance, Analytics, Invoices, Expenses,
    │   ├── Settings, Profile, LoginPage, NotFound,
    │   ├── ProductPurchaseManagement, PurchaseProductsManagement,
    │   ├── PackageProductsManagement, DeliveryProductsManagement,
    │   ├── purchases/{New,Edit}PurchasePage.tsx
    │   ├── packages/{New,Edit}PackagePage.tsx
    │   └── delivery/{New,Edit}DeliveryPage.tsx
    ├── components/
    │   ├── ui/                  # shadcn/ui (NO modificar)
    │   ├── shared/mobile-data-card.tsx   # Tarjeta responsive genérica
    │   ├── navigation/          # AsideNav (sidebar), AppSidebarWrapper (header+layout), Breadcrumb, UserNav
    │   ├── auth/                # login.tsx (formulario), register.tsx
    │   ├── users/               # UsersHeader/Filters/Table, UserForm, UserDetailsDialog, ChangePasswordDialog
    │   ├── shops/               # ShopsTable/List/Stats, form/ShopFormPopover, form/BuyingAccountFormPopover, AccountsList, DeleteDialog
    │   ├── orders/              # OrdersTable/Filters/Stats, Create/EditOrderDialog, AddProductsDialog,
    │   │                        # AddMultipleProductsToOrderPage, ConfirmPaymentDialog, order-details, badges
    │   ├── products/            # ProductsTable/Filters/Header, ProductForm (cálculo de costos), ProductEditDialog,
    │   │   ├── buyed/           # product-buyed-*, RefundBadge/RefundPopover (reembolsos)
    │   │   └── purchase/        # AddProductPurchase, ProductPurchaseList (compras por producto)
    │   ├── purshases/ (sic)     # PurshasesTable/Stats/Filters, purshase-form, purchase-details, purchase-dialog,
    │   │   └── purchase-products/  # selector/list editor de productos de una compra
    │   ├── packages/            # PackagesTable/Stats/Filters, package-form, PackageDetails,
    │   │   └── package-products/   # selector/list editor de productos recibidos
    │   ├── delivery/            # DeliveryTable/Stats/Filters, delivery-form, ConfirmPaymentDialog,
    │   │   └── delivery-products/  # selector/list editor de productos entregados
    │   ├── categories/          # CategoriesTable/Filters/Header, CategoryDialog/Form
    │   ├── invoices/            # invoices-table/filters/form/summary, tag-item, new-tag-form
    │   ├── expenses/            # expenses-table/filters/form/header
    │   ├── balance/             # balance-report (generador de balances), components/card-transactions (ops. tarjetas)
    │   ├── client-balances/     # client-balances-table, advanced-filters
    │   ├── reports/ClientOperationsStatement.tsx  # Estado de cuenta por cliente
    │   ├── metrics/             # MetricsSummaryCards, CompactMetricsSummary, AgentMetricsSummary, ExchangeRateCard...
    │   ├── charts/DashboardCharts.tsx
    │   ├── notifications/NotificationsPopover.tsx
    │   ├── images/              # ImageUploader, CloudinaryImage, QuickImageUpload, TableImageCell
    │   └── utils/               # ProtectedRoute, ApiRedirectProvider, DatePicker(s), TablePagination,
    │                            # LoadingSpinner, PayStatusBadge, paymentPanel, CardStats, ValueWithUnit...
    ├── hooks/                   # Ver sección 8
    ├── services/                # Ver sección 7
    ├── schemas/                 # expenseSchemas.ts, invoiceSchemas.ts (Zod)
    ├── types/
    │   ├── api.ts               # PaginatedApiResponse, filtros, DashboardMetrics, AgentDashboardMetrics
    │   ├── models/              # user, order, product, product-buyed/received/delivery, delivery, package,
    │   │                        # shopping-receip, invoice, expenses, balance, category, shop, buying-account,
    │   │                        # common-info, notification, dashboard, base (estados/uniones)
    │   └── services/            # cardOperations, client-report, delivery, order, purchase
    ├── lib/                     # api-client, purchase-calculations, payment-status-calculator, colors,
    │                            # format-* (date/usd/phone/card/weight-lb), tags/parseTags, imageUpload, utils(cn)
    └── utils/                   # storage.ts (STORAGE_KEYS, validateAuthData), pagination.tsx
```

---

## 4. Enrutamiento y páginas

Definición completa en `src/routes/AppRoutes.tsx`. Todas las rutas internas cuelgan de `/` con `MainLayout` (sidebar + header) y doble guard (`ProtectedRoute` + `RoleGuard`). Grupos de roles: `ADMIN_ONLY`, `ADMIN_AGENT`, `ADMIN_ACCOUNTANT`, `ADMIN_LOGISTICAL`, `ADMIN_AGENT_LOGISTICAL`, `ALL_ROLES`.

| Ruta | Componente | Descripción | Roles |
|---|---|---|---|
| `/login` | `pages/LoginPage.tsx` → `components/auth/login.tsx` | Inicio de sesión | Pública |
| `/unauthorized` | `routes/unauthorized.tsx` | Acceso denegado | Pública |
| `/` | `pages/Dashboard.tsx` | Métricas generales / de agente | Todos |
| `/users` | `pages/Users.tsx` | Gestión de usuarios | admin, agent |
| `/shops` | `pages/Shops.tsx` | Tiendas + cuentas de compra | admin |
| `/categories` | `pages/Categories.tsx` | Categorías de envío | admin |
| `/orders` | `pages/Orders.tsx` | Lista de pedidos | admin, agent |
| `/orders/:id` | `components/orders/order-details.tsx` | Detalle de pedido | admin, agent |
| `/orders/:id/add-products` | `components/orders/AddMultipleProductsToOrderPage.tsx` | Alta masiva de productos al pedido | admin, agent |
| `/products` | `pages/Products.tsx` | Catálogo de productos encargados | admin, agent |
| `/products/:id` | `components/products/product-details.tsx` | Detalle + timeline de producto | admin, agent |
| `/purchases` | `pages/Purchases.tsx` | Recibos de compra (ShoppingReceip) | admin |
| `/purchases/new` | `pages/purchases/NewPurchasePage.tsx` | Nueva compra | admin |
| `/purchases/:id` | `components/purshases/purchase-details.tsx` | Detalle de compra | admin |
| `/purchases/:id/edit` | `pages/purchases/EditPurchasePage.tsx` | Editar compra | admin |
| `/purchases/:id/manage-products` | `pages/PurchaseProductsManagement.tsx` | Gestionar productos comprados | admin |
| `/packages` | `pages/Packages.tsx` | Paquetes recibidos de agencias | admin, logistical |
| `/packages/new` | `pages/packages/NewPackagePage.tsx` | Nuevo paquete | admin, logistical |
| `/packages/:id` | `components/packages/PackageDetails.tsx` | Detalle de paquete | admin, logistical |
| `/packages/:id/edit` | `pages/packages/EditPackagePage.tsx` | Editar paquete | admin, logistical |
| `/packages/:id/manage-products` | `pages/PackageProductsManagement.tsx` | Gestionar productos recibidos | admin, logistical |
| `/packages/:id/add-products` | `components/packages/AddProductsToPackagePage.tsx` | Añadir productos | admin, logistical |
| `/packages/:id/remove-products` | `components/packages/RemoveProductsFromPackagePage.tsx` | Quitar productos | admin, logistical |
| `/delivery` | `pages/Delivery.tsx` | Recibos de entrega | admin, agent, logistical |
| `/delivery/new` | `pages/delivery/NewDeliveryPage.tsx` | Nueva entrega | admin, logistical |
| `/delivery/:id` | `pages/DeliveryDetail.tsx` | Detalle de entrega | admin, agent, logistical |
| `/delivery/:id/edit` | `pages/delivery/EditDeliveryPage.tsx` | Editar entrega | admin, logistical |
| `/delivery/:id/manage-products` | `pages/DeliveryProductsManagement.tsx` | Gestionar productos entregados | admin, logistical |
| `/delivery/:id/add-products` | `components/delivery/AddProductsToDeliveryPage.tsx` | Añadir productos | admin, logistical |
| `/delivery/:id/remove-products` | `components/delivery/RemoveProductsFromDeliveryPage.tsx` | Quitar productos | admin, logistical |
| `/invoices` | `pages/Invoices.tsx` | Costos de envío (facturas del transportista) | admin, accountant |
| `/expenses` | `pages/Expenses.tsx` | Registro de gastos | admin, accountant |
| `/balance` | `pages/Balance.tsx` | Historial de balances | admin, accountant |
| `/balance/new-balance` | `components/balance/balance-report.tsx` | Generador de balance por rango | admin, accountant |
| `/client-balances` | `components/client-balances/client-balances-table.tsx` | Saldos por cliente | admin, accountant |
| `/analytics` | `pages/Analytics.tsx` | Reportes de ganancias | admin, accountant |
| `/profile` | `pages/Profile.tsx` | Perfil propio | Todos |
| `/settings` | `pages/Settings.tsx` | Configuración | Todos |
| `*` | `pages/NotFound.tsx` | 404 | Pública |

### Detalle por página

**Dashboard (`src/pages/Dashboard.tsx`)** — Saludo según hora, tarjeta-calendario con fecha/hora en vivo, `ExchangeRateCard` (tasa de cambio de `CommonInformation`). Si el rol es `agent` renderiza `AgentMetricsSummary` (clientes, órdenes, entregas, ganancia propia — `AgentDashboardMetrics`); si no, `MetricsSummaryCards` (`src/components/metrics/MetricsSummaryCards.tsx`) con métricas de órdenes, productos, usuarios, ingresos, compras, paquetes, entregas, finanzas, agentes, alertas (`DashboardMetrics` en `src/types/api.ts`). Datos: `useDashboardMetrics` → `GET /api_data/dashboard/stats/`.

**Users (`src/pages/Users.tsx`)** — Tabla (`components/users/UsersTable.tsx`): `# | Usuario | Correo | Rol | Agente | Verificación | Activación | Registro | Acciones`. Filtros (`components/filters/user-filters.tsx` vía `UsersFilters`): búsqueda, rol, activo, verificado. Acciones: crear (`UserForm` en modo create, embebido en `UsersFilters`), editar (`UserForm` modo edit), verificar/desverificar (`PATCH is_verified`), activar/desactivar (`PATCH is_active`), cambiar contraseña (`components/users/ChangePasswordDialog.tsx` → `PATCH password`), ver detalles (`UserDetailsDialog`). Muestra `CompactMetricsSummary type="users"` solo a admin. Hooks: `useUsers/useCreateUser/useUpdateUser/useVerifyUser/useToggleUserActive` (`src/hooks/user/useUsers.ts`). Endpoints: `/api_data/user/`.

**Shops (`src/pages/Shops.tsx`)** — `ShopsHeader` (crear tienda con `ShopFormPopover`: nombre, link, `tax_rate`, `is_active`), `ShopsTable` (tiendas con sus `buying_accounts` anidadas; seleccionar tienda muestra `AccountsList`). Acciones: crear/editar/eliminar tienda (`DeleteDialog`), crear/editar/eliminar cuentas de compra (`BuyingAccountFormPopover`, `buyingAccountService`). Hook `src/hooks/useShops.ts` (estado local, no react-query). Endpoints: `/api_data/shop/`, `/api_data/buying_account/`.

**Products (`src/pages/Products.tsx`)** — Tabla (`ProductsTable`): columnas configurables mediante `ProductsColumnsSelector` (visibles por defecto: nombre, categoría, estado, costo total, tienda, cantidad solicitada, acciones; disponibles además: SKU, imagen, comprado, entregado, cantidades). Filtros (`components/filters/product-filters.tsx`): búsqueda, categoría, tienda, estado, precio min/max. Acciones: refrescar (invalida `['products']` y `['dashboard-metrics']`), editar (`ProductEditDialog` → `ProductForm`), eliminar, ver detalle, gestionar compras del producto, QR del link (`qr-link.tsx`). Muestra `CompactMetricsSummary type="products"`. Endpoint: `/api_data/product/`.

**Orders (`src/pages/Orders.tsx`)** — Tabla (`OrdersTable`): `# | Fecha | Manager | Cliente | Productos | Estado | Costo | Pago | Acciones`. Filtros (`components/filters/order-filters.tsx`): búsqueda (aplicada también client-side), estado, estado de pago, manager, rango de fechas. Acciones: crear pedido (`CreateOrderDialog` desde `OrdersHeader`), editar (`EditOrderDialog`), eliminar (`useDeleteOrder`), añadir productos (`AddProductsDialog` con `ProductForm`; o la página `/orders/:id/add-products`), registrar pago (`ConfirmPaymentDialog` desde tabla/detalle). `order-details.tsx` muestra cliente, manager, productos, totales (`total_cost`, `total_expenses`, `total_profit`, `received_value_of_client`, `balance_applied`) y recibos de entrega asociados.

**Purchases (`src/pages/Purchases.tsx`)** — `PurshasesStats` (resumen), `PurshasesFilters` (búsqueda, estado, tienda, cuenta, fechas — `ShoppingReceipFilters`), `PurshasesTable`: `# | Fecha | Tienda | Cuenta | Productos | Estado | Costo Total | Acciones` (ver detalle, editar → `/purchases/:id/edit`, gestionar productos, eliminar). Alta con página dedicada `/purchases/new` (`PurchaseForm`). Reembolsos por producto comprado con `components/products/buyed/RefundPopover.tsx` / `RefundBadge.tsx`. Endpoints: `/api_data/shopping_reciep/` (sic), reportes `/api_data/reports/purchases/*`.

**Packages (`src/pages/Packages.tsx`)** — `PackagesStats`, `PackagesFilters` (búsqueda, `status_of_processing`, agencia), `PackagesTable`: `# | ID | No. Rastreo | Llegada | Estado | Productos | Captura | Acciones`. `PackageDetails` muestra agencia, tracking, estado, fecha de llegada, imágenes (`package_picture`) y `contained_products` (ProductReceived). Alta/edición en páginas dedicadas con `package-form.tsx`.

**Delivery (`src/pages/Delivery.tsx`)** — `DeliveryStats`, `DeliveryFilters` (búsqueda, estado, zona), `DeliveryTable`: `# | Cliente | Categoría | Peso | Costo | Llegada | Estado | Pago | Productos | Captura | Acciones`. `DeliveryDetail.tsx`: información del cliente, tabla de productos entregados (`DeliveryProductsTable`), resumen financiero (costo por peso, ganancia del manager, total), detalles logísticos (fecha, peso, categoría con `$X/lb`), diálogo `AddProductToDeliveryDialog` (oculto para agentes). Pago con `components/delivery/ConfirmPaymentDialog.tsx`.

**Categories (`src/pages/Categories.tsx`)** — Tabla: `# | Nombre | Costo / lb | Cobro Cliente / lb | Creado | Acciones`. CRUD completo con `CategoryDialog`/`CategoryForm` y `DeleteDialog` (reutilizado de shops). Campos: `name`, `shipping_cost_per_pound` (costo interno), `client_shipping_charge` (cobro al cliente). Hooks en `src/hooks/category/useCategory.ts` (con `categoryKeys` factory y búsqueda). Endpoint: `/api_data/category/`.

**Invoices (`src/pages/Invoices.tsx`)** — "Costos de Envío". Tabla: `ID | Fecha | Total | Conceptos | Creado | Acciones`. Crear/editar con `components/invoices/invoices-form.tsx`: fecha, total y lista de *tags* (conceptos) tipo `pesaje` (peso × costo/lb) o `nominal` (costo fijo) con subtotales (`tag-item.tsx`, `new-tag-form.tsx`); resumen en `invoices-summary.tsx`. Validación en `src/schemas/invoiceSchemas.ts`. Endpoints: `/api_data/invoice/` (+ `calculate_range_data/`, `/{id}/tags/`).

**Expenses (`src/pages/Expenses.tsx`)** — Tabla paginada (paginación real con `page`/`per_page`): `ID | Fecha | Categoría | Monto | Descripción | Creado | Acciones`. Crear/editar (`expenses-form.tsx`, categorías: Envio, Tasas, Sueldo, Publicidad, Operativo, Entrega, Otro; flag `recurrent`), eliminar con `AlertDialog` de confirmación. Endpoints: `/api_data/expense/` (+ `analysis/`).

**Balance (`src/pages/Balance.tsx`)** — Tarjetas de resumen (`GET /api_data/balance/summary/`): peso procesado total, gastos generados, costo total, ganancia real total. Tabla "Historial de Balances": `Período | Dif. Peso | Dif. Costo | Gastos generados | Ganancia Real | Acciones` (eliminar). Vista móvil con `MobileDataCard`. Botón "Nuevo Balance" → `/balance/new-balance`.

**Balance Report (`src/components/balance/balance-report.tsx`)** — Generador de balance: selector de rango (presets 1m/3m/6m/12m o rango custom con `DatePickerRange`), paneles con análisis de órdenes, entregas (por categoría), compras, gastos y facturas del período, historial de operaciones de tarjeta (`CardTransactionsDialog` → `card-transactions.tsx` → `GET /cards/operations/`), y botón Guardar que persiste el balance (ver flujo en sección 6.9).

**Client Balances (`src/components/client-balances/client-balances-table.tsx`)** — Reporte de saldos por cliente (`GET /api_data/reports/clients/balances/`): deuda/superávit/al día, filtros avanzados (`advanced-filters.tsx`) y acceso al estado de cuenta detallado por cliente (`components/reports/ClientOperationsStatement.tsx` → `GET /api_data/reports/clients/operations/?client_id=`), que lista operaciones con débito/crédito/balance y resumen (pendiente por pagar, saldo a favor).

**Analytics (`src/pages/Analytics.tsx`)** — "Reportes de Ganancias" (`GET /api_data/reports/profits/`): 5 tarjetas de resumen (ingresos totales, ganancia del sistema con margen y "÷3", gastos, ganancias de agentes, ganancia por entregas), gráficas Recharts (BarChart/AreaChart) de tendencia mensual con selector 3m/6m/12m, tabs de detalle mensual y tabla/cards de reporte por agente (`AgentReport`: ganancia total, del mes, clientes, órdenes). Responsive con `useResponsiveView` + `MobileDataCard`.

**Settings (`src/pages/Settings.tsx`)** — Tabs: General, Notificaciones, **Variables del Sistema** (tasa de cambio `change_rate` y costo por libra `cost_per_pound` → `useSystemConfig` → `/api_data/common_information/`), **Seguridad** (cambio de contraseña propio → `useChangePassword` → `POST /api_data/user/change_password/`; validación local: campos obligatorios, coincidencia, mínimo 6), **Sistema** (info de app/BD/servidor → `useSystemInfo` → `GET /api_data/system/info/`).

**Profile (`src/pages/Profile.tsx`)** — Tarjeta resumen (avatar, rol con `roleLabels`, fecha de alta) + formulario editable inline de `name`, `last_name`, `phone_number`, `home_address` (email solo lectura). Guarda con `useUpdateUser` (`PATCH /api_data/user/{id}/`). Datos de `useCurrentUser` (`GET /user/`) con fallback al usuario del AuthContext.

**Páginas de gestión de productos** (patrón repetido): `PurchaseProductsManagement.tsx`, `PackageProductsManagement.tsx`, `DeliveryProductsManagement.tsx`, `ProductPurchaseManagement.tsx` — cabecera con tarjetas informativas de la entidad, sección "Agregar" (componente `AddProductsTo*`) y sección "Lista" (`*ProductsList`) con `refreshTrigger` local para refetch.

---

## 5. Autenticación y sesión

- **Login** (`src/components/auth/login.tsx`): campo único email-o-teléfono (autodetección con `detectInputType`; construye `LoginCredentials` con `email` o `phone_number`), contraseña, checkbox *Recordarme*. Zod inline (`loginSchema`). Llama `useAuth().login()`.
- **Endpoints** (`src/constants/auth.ts`): `POST /auth/` (login, devuelve `{access, refresh, user}`), `POST /auth/refresh/`, `GET /user/` (usuario actual), `POST /register/`, `POST /logout/`.
- **Cliente HTTP** (`src/lib/api-client.ts`, clase `ApiClient` singleton `apiClient`):
  - Interceptor request: inyecta `Authorization: Bearer <token>` salvo `skipAuth`.
  - Interceptor response 401: cola de reintentos (`refreshSubscribers`), refresh único simultáneo (`isRefreshing`), reintento de la petición original; si el refresh falla → `handleUnauthorized()` (limpia tokens, callback de estado, toast "Tu sesión ha expirado", redirect a login con cooldown de 1s anti-loop).
  - 403 → toast "No tienes permisos"; 429 → toast de rate limit. `getErrorMessage()` extrae `detail/message/non_field_errors/errores de campo` de DRF.
  - `getPaginated()` limpia parámetros (`'all'`, vacíos) y **fuerza `page:1, page_size:1000`** por defecto (paginación efectivamente desactivada del lado servidor).
  - Persistencia: *Recordarme* → `localStorage`; si no → `sessionStorage` (claves literales `access_token`/`refresh_token`; NO usa `VITE_AUTH_TOKEN_KEY` aquí, solo el SSE client lo usa).
- **AuthContext** (`src/context/AuthContext.tsx`): `useReducer` con estado `{user, isAuthenticated, isLoading, error, permissions, lastActivity}`. Estado inicial hidratado desde storage con `validateAuthData()` (`src/utils/storage.ts`, claves `admin_auth_user`, `admin_auth_permissions`, `admin_auth_last_activity`). `checkExistingAuth()` valida el token llamando `GET /user/` al montar. Sincronización entre pestañas vía evento `storage` (logout global / reload al loguear en otra pestaña). **Timeout de inactividad de 1 hora** (listeners de mousedown/keypress/scroll/touchstart, throttle de 60 s, chequeo por intervalo).
- **Puente API↔Router**: `src/components/utils/ApiRedirectProvider.tsx` + `src/hooks/useApiRedirect.ts` registran los callbacks `setRedirectToLoginCallback`, `setShowNotificationCallback` (sonner) y `setAuthStateChangeCallback` del api-client.
- **Guards**: sección 1. `permissions` está siempre vacío (TODO en el código); la autorización efectiva es solo por rol.

---

## 6. Flujos de negocio principales

### Estados canónicos (`src/types/models/base.ts`)

- **Order**: `Encargado → Procesando → Completado | Cancelado`
- **Pago (Order/Delivery/Shopping)**: `No pagado | Parcial | Pagado`
- **Product**: `Encargado → Comprado → Recibido → Entregado | Cancelado`
- **Delivery**: `Pendiente → En transito → Entregado | Fallida`
- **Package**: `Enviado → Recibido → Procesado`

⚠️ Nota: el objeto de constantes `PRODUCT_STATUSES` en `base.ts` está desalineado con la unión `ProductStatus` (contiene Procesando/Completado en lugar de Comprado/Recibido/Entregado) — usar la unión como fuente de verdad.

### 6.1 Gestión de usuarios (alta / edición / roles)

1. **Pantalla** `/users`. Alta: botón en `UsersFilters` abre `UserForm` (`src/components/users/UserForm.tsx`) modo create.
2. **Campos** (`createUserSchema` Zod): `email` (opcional, formato email), `name` (min 2), `last_name` (min 2), `home_address` (opcional), `phone_number` (min 7), `password` (min 6, requerida solo en create), `role` (Select con `roleLabels`), `agent_profit` (≥0; ganancia por libra del agente, solo relevante para rol agent), `assigned_agent` (para clientes: agente asignado; usa `useUsersByRole('agent')`).
3. **Llamadas**: create → `POST /api_data/user/` (`src/services/users/create-user.ts`); edit → `PATCH /api_data/user/{id}/` (`update-user.ts`). Errores de campo del backend (email/teléfono duplicado) se muestran vía toast en `Users.tsx` y el formulario no se cierra (re-throw).
4. **Acciones de estado**: verificar → `PATCH {is_verified}` (`useVerifyUser`); activar/desactivar → `PATCH {is_active}` (`useToggleUserActive`); cambiar contraseña de otro usuario → `PATCH {password}` (`changeUserPassword`, `ChangePasswordDialog`).
5. **Invalidaciones**: mutaciones invalidan `userKeys.lists()` y `userKeys.detail(id)`.
6. El propio perfil se edita en `/profile` (`PATCH /api_data/user/{id}/`) y la contraseña propia en `/settings` (`POST /api_data/user/change_password/` con `current_password`/`new_password`).

### 6.2 Tiendas y cuentas de compra

1. `/shops` (solo admin). Crear tienda: `ShopsHeader` → `ShopFormPopover` (`name`, `link` URL válida, `tax_rate` % de tarifa de la tienda, `is_active`) → `POST /api_data/shop/` (validación extra de duplicados por nombre/link en `src/services/shops/create-shop.service.ts`).
2. Editar → `PATCH /api_data/shop/{id}/` (limpieza de payload en `update-shop.service.ts`); eliminar → `DELETE /api_data/shop/{id}/` con `DeleteDialog`.
3. **Cuentas de compra** (`BuyingAccounts`, anidadas en cada Shop): `BuyingAccountFormPopover` crea/edita `{account_name, shop: <nombre>}` → `POST/PATCH /api_data/buying_account/`; eliminar → `DELETE /api_data/buying_account/{id}/` (handler en `Shops.tsx`).
4. Estas cuentas alimentan el selector "Cuenta Relacionada" del formulario de compras; `tax_rate` de la tienda alimenta el cálculo de costo del producto.

### 6.3 Ciclo de vida de un pedido (Order) y sus productos

1. **Crear pedido** — `/orders` → `CreateOrderDialog`: seleccionar manager (agents+admins; auto-fijado si el usuario es agente), cliente (filtrado por `assigned_agent` del manager elegido), `observations`; estado inicial `Encargado` / `No pagado` → `POST /api_data/order/` (`useCreateOrder`). Opción "crear y añadir productos" navega a `/orders/:id/add-products`.
2. **Añadir productos** — `AddProductsDialog` o `AddMultipleProductsToOrderPage` usan `ProductForm` (`src/components/products/ProductForm.tsx`). Campos: nombre, link (autodetecta tienda por dominio con `extractShopName`), tienda (normalizada contra BD; tarifa auto: Shein 0 %, Amazon/Temu 3 %, AliExpress/otras 5 % vía `getShopTaxRate`, o `tax_rate` de la tienda en BD), categoría, cantidad solicitada, descripción (+tags embebidos con separador `--TAGS--`, ver `src/lib/tags.ts`), costo unitario `shop_cost`, envío de la tienda `shop_delivery_cost`, `charge_iva` (switch), impuestos adicionales `added_taxes`, impuestos propios `own_taxes`.
   **Cálculo del costo total** (idéntico en `ProductForm.calculateTotalCost` y `src/lib/purchase-calculations.ts`):
   ```
   subtotal      = shop_cost × cantidad
   base          = subtotal + envío
   baseImpuesto  = charge_iva ? base × 0.07 : 0        (IVA 7 %)
   tarifaTienda  = (base + baseImpuesto) × tax_rate/100
   total         = base + baseImpuesto + tarifaTienda + added_taxes + own_taxes
   ```
   Muestra conversión a moneda local con `change_rate` de `useSystemConfig`. Cada producto → `POST /api_data/product/` con `order: <id>` (`useAddProductsToOrder` itera; `shop`/`category` viajan como nombre — slug fields del backend).
3. **Estados del producto**: nace `Encargado`; el backend lo mueve a `Comprado` al asociarlo a un ShoppingReceip, `Recibido` al entrar en un Package y `Entregado` al salir en un DeliverReceip. El frontend muestra el progreso con `amount_requested / amount_purchased / amount_received / amount_delivered` y propiedades computadas (`pending_purchase`, `is_fully_delivered`...). Timeline visual: `components/products/product-timeline.tsx` → `GET /api_data/product/{id}/timeline/`.
4. **Pago del pedido** — `components/orders/ConfirmPaymentDialog.tsx`:
   - Pendiente a pagar: `max(0, total_cost − received_value_of_client − balance_applied)`.
   - Puede aplicar **saldo a favor del cliente** (`surplus_balance` del reporte `clientBalances`, query `['clientBalances']`).
   - Estado calculado en vivo (barra de progreso): `pagado` si monto+saldo ≥ costo, `parcial` si >0, `no_pagado` si 0 — misma lógica que el backend replicada en `src/lib/payment-status-calculator.ts` (redondeo a 2 decimales).
   - Confirmar → `markOrderAsPaid` (`src/services/orders/update-order.ts`) → `PATCH /api_data/order/{id}/` con `{received_value_of_client, payment_date, pay_status?, applied_balance?}`; el backend recalcula `pay_status`. Invalida `['orders']` (`useMarkOrderAsPaid`).
5. **Editar/eliminar pedido**: `EditOrderDialog` (estado, pay_status, observaciones) → `PATCH`; eliminar → `DELETE /api_data/order/{id}/` (`useDeleteOrder`). Totales del pedido (`total_cost`, `total_expenses`, `total_profit`) son computados por el backend.

### 6.4 Proceso de compra (ShoppingReceip + ProductBuyed)

1. **Pantalla** `/purchases/new` (`PurchaseForm`, `src/components/purshases/purshase-form.tsx`).
2. **Pasos**: (a) seleccionar Establecimiento (tienda) — al cambiar limpia el carrito; (b) seleccionar Cuenta Relacionada (cuentas de compra de esa tienda); (c) abrir "Catálogo de Productos" (`ProductSelector` en `purchase-products/purchase-product-selector.tsx`) — lista productos con `statusFilter="Encargado"` y `shopFilter` por la tienda elegida; se elige `amount_buyed` por producto; (d) sidebar financiero: `status_of_shopping` (No pagado/Pagado/Parcial), `buy_date` (`DateTimePicker`), `card_id` (tarjeta usada), `total_cost_of_purchase` (**auto-calculado** como Σ `calculateProductPurchaseCost(item)` de `src/lib/purchase-calculations.ts` — si `amount_buyed === amount_requested` usa `total_cost` del producto, si no recalcula con la fórmula de 6.3 —, editable manualmente).
3. **Validación** (`createShoppingReceipSchema` Zod): tienda y cuenta requeridas; al menos 1 producto (check manual con toast).
4. **Envío**: create → `POST /api_data/shopping_reciep/`; edit → `PATCH /api_data/shopping_reciep/{id}/` con payload `{shopping_account, shop_of_buy (nombre), status_of_shopping, buy_date, card_id, total_cost_of_purchase, buyed_products: [{original_product: <uuid>, amount_buyed}]}`.
5. **Efectos**: el backend marca los productos como `Comprado` e incrementa `amount_purchased`. Campos computados del recibo: `total_cost_of_shopping` (suma teórica), `total_cost_excluding_refunds`, `total_refunded`, `operational_expenses = total_cost_excluding_refunds − total_cost_of_purchase` (diferencia entre costo teórico y lo realmente pagado).
6. **Reembolsos**: por `ProductBuyed` (campos `is_refunded`, `quantity_refunded`, `refund_amount`, `refund_date`, `refund_notes`) gestionados con `RefundPopover` → `PATCH /api_data/buyed_product/{id}/`; badges con `RefundBadge`. Analítica de reembolsos en `/api_data/reports/purchases/products/`.
7. **Gestión posterior**: `/purchases/:id/manage-products` (agregar/quitar `ProductBuyed`), `/purchases/:id` detalle. **Operaciones de tarjeta**: `GET /cards/operations/` con filtros fecha/tarjeta (`src/services/purchases/card-history.ts`, `src/hooks/use-card-history.ts`, UI en `src/components/balance/components/card-transactions.tsx`).

### 6.5 Recepción de paquetes (Package + ProductReceived)

1. **Pantalla** `/packages/new` (`package-form.tsx`). Campos (`packageSchema` Zod): `agency_name` (req.), `number_of_tracking` (req.), `status_of_processing` (`Enviado|Recibido|Procesado`), `arrival_date` (req., `DateTimePicker`).
2. Selección de productos con `PackageProductSelector` (productos comprados pendientes de recibir) → items `{original_product_id (UUID), amount_received, observation}`.
3. **Envío**: `POST /api_data/package/` y después `POST /api_data/package/{id}/add_products/` con `{products: [...]}`; en edición `PATCH` + `add_products`. Quitar producto: `DELETE /api_data/package/{packageId}/remove_product/{productReceivedId}/` (`useRemoveProductFromPackage`).
4. **Efectos**: crea registros `ProductReceived`, incrementa `amount_received` del producto y su estado pasa a `Recibido`. Invalidaciones: `['packages']`, `['package', id]`, `['products']`, `['product-received']`.
5. Imágenes del paquete (`package_picture`) vía Cloudinary (`QuickImageUpload`/`ImageUploader`).

### 6.6 Entregas (DeliverReceip + ProductDelivery) y ganancia del mensajero

1. **Pantalla** `/delivery/new` (`delivery-form.tsx`). Solo se ofrecen **clientes con productos entregables** (productos con `amount_delivered < amount_received`, correlacionados por `client_name`); combobox con búsqueda (`Command`).
2. **Campos** (`createDeliverySchema` Zod): `client_id` (req.), `category_id` (opcional; filtra productos del cliente por categoría), `status` (`Pendiente|En transito|Entregado|Fallida`), `deliver_date`, `weight` (> 0), `weight_cost`, `manager_profit`, `deliver_picture` (evidencia).
3. **Cálculos automáticos** (efectos en `delivery-form.tsx`):
   - `weight_cost = category.client_shipping_charge × weight` (cobro al cliente).
   - `manager_profit = weight × agent_profit` del **agente asignado al cliente** (`assigned_agent` → `agents.find(...)`). Ambos editables.
   - En el backend además: `delivery_expenses = weight × shipping_cost_per_pound` (costo interno de la categoría) y `system_delivery_profit = weight_cost − manager_profit − delivery_expenses` (ganancia del sistema por la entrega). El "mensajero/manager" cobra `manager_profit`.
4. **Envío**: create → `POST /api_data/delivery_receips/` (sic) y luego, por cada producto, `POST /api_data/delivery_receips/{id}/add_products/` con `{products: [{original_product, amount_delivered}]}` (`useAddProductToDelivery`). Edit → `PATCH` + sincronización diff de productos: calcula items a añadir/quitar/actualizar (los cambios de cantidad se resuelven como remove + add usando `DELETE /api_data/delivery_receips/{id}/remove_product/{productDeliveryId}/`).
5. **Efectos**: crea `ProductDelivery`, incrementa `amount_delivered`, estado del producto → `Entregado`. Invalidaciones: `['delivery', id]`, `['deliveries']`, `['products']`, `['clientBalances']`, `['deliveryReportsAnalysis']`.
6. **Pago de la entrega** — `components/delivery/ConfirmPaymentDialog.tsx` (gemelo del de órdenes): pendiente = `weight_cost − payment_amount − balance_applied`; permite aplicar saldo del cliente; `markDeliveryAsPaid` → `PATCH /api_data/delivery_receips/{id}/` con `{payment_amount, payment_date, payment_status?, applied_balance?}`; el backend fija `payment_status` (`Pagado`/`Parcial`/`No pagado`).

### 6.7 Facturación (Invoices — costos de envío del courier)

1. `/invoices`. Crear desde `InvoicesFilters` → `invoices-form.tsx`; validación `src/schemas/invoiceSchemas.ts`.
2. **Campos**: `date` (req.), `total` (≥0, 2 decimales), `tags[]` (mínimo 1). Cada tag: `type: 'pesaje' | 'nominal'`; si `pesaje` requiere `weight > 0` y `cost_per_lb > 0` (subtotal = peso × costo/lb); si `nominal` requiere `fixed_cost > 0`; `subtotal > 0` siempre.
3. **Endpoints**: `POST /api_data/invoice/` (tags anidados), `PUT/PATCH /api_data/invoice/{id}/`, `DELETE`, `GET /api_data/invoice/{invoiceId}/tags/`. Invalidación con `invoiceKeys` (`src/hooks/invoice/useInvoices.ts`).
4. **Agregado por rango**: `GET /api_data/invoice/calculate_range_data/?start&end` → `InvoiceRangeData` (conteo, monto total, peso total de tags, costos fijos, subtotales) — insumo del Balance (peso "registrado") vía `useInvoiceRangeData` (`src/hooks/balance/useInvoiceRangeData.ts`).

### 6.8 Gastos (Expenses)

1. `/expenses`. Crear/editar con `expenses-form.tsx` (`createExpenseSchema`: `date` req., `amount > 0` con 2 decimales, `category` enum, `description ≤ 2048`, `recurrent?`).
2. `POST/PATCH/DELETE /api_data/expense/`; listado paginado real. `expenseKeys` para caché (`src/hooks/expense/useExpenses.ts`).
3. Analítica: `GET /api_data/expense/analysis/` y `GET /api_data/reports/expenses/` (`ExpenseAnalysisResponse`: total, promedio, conteo, por categoría, tendencia mensual) — usada en el Balance.

### 6.9 Balance y operaciones de tarjetas

1. `/balance` — historial (modelo `Balance` en `src/types/models/balance.ts`: rango de fechas, `system_weight` vs `registered_weight`, `revenues`, `buys_costs`, `costs`, `expenses`, computados `weight_difference`, `total_cost`, `real_profit`). Eliminar → `DELETE /api_data/balance/{id}/`; resumen → `GET /api_data/balance/summary/`.
2. `/balance/new-balance` (`balance-report.tsx`) — flujo de generación:
   1. Elegir rango (presets o custom).
   2. `useBalanceData` (`src/hooks/useBalanceData.ts`) dispara en paralelo: `useOrdersAnalysis` (`/api_data/reports/orders/`), `useDeliveryAnalysis` (`/api_data/reports/deliveries/`), `usePurchasesAnalysis` (`/api_data/reports/purchases/`), `useExpensesAnalysis` (`/api_data/reports/expenses/`), `useInvoiceRangeData` (`/api_data/invoice/calculate_range_data/`), `useProfitReports` (`/api_data/reports/profits/`).
   3. **Resumen integrado** (memo en `balance-report.tsx`): `totalIncome = (paid_revenue + pagos fuera de fecha de órdenes) + total_delivery_revenue`; `totalCosts = compras reales pagadas + facturas courier + gastos`; `netProfit = totalIncome − totalCosts`; margen %.
   4. Guardar → `POST /api_data/balance/` con `{start_date, end_date, system_weight: total_weight de entregas, registered_weight: total_tag_weight de facturas, revenues: totalIncome, buys_costs: compras pagadas, costs: facturas, expenses: gastos, notes}`; invalida `['balance']` y `['balance-summary']`, animación de éxito y redirect a `/balance`.
3. **Tarjetas**: dentro del reporte, `CardTransactionsDialog`/`card-transactions.tsx` consultan `GET /cards/operations/` (filtros: rango de fechas, `card_id`) mostrando historial por tarjeta (tipos en `src/types/services/cardOperations.ts`).

### 6.10 Categorías / Tags

- **Categorías de envío** (sección 4, Categories): definen `$X/lb` interno y cobro al cliente; son la base del cálculo de entregas (6.6).
- **Tags de factura** (6.7) y **tags embebidos en descripción de producto** (`src/lib/tags.ts`, `parseTags.ts`; serializados dentro de `description` con separador `--TAGS--`) — atributos libres tipo talla/color.

### 6.11 Reportes y analytics del dashboard

- **Dashboard**: `GET /api_data/dashboard/stats/` (respuesta distinta por rol: `DashboardMetrics` para admin, `AgentDashboardMetrics` para agente). Hooks derivados por dominio en `src/hooks/useDashboardMetrics.ts` (`useUserMetrics`, `useOrderMetrics`, `usePurchaseMetrics`, etc.) alimentan `MetricsSummaryCards`, `CompactMetricsSummary` (variantes users/products/orders) y `AlertsMetrics` (pedidos >30 días, entregas impagas >60 días, clientes con deuda alta, etc.).
- **Analytics**: `GET /api_data/reports/profits/` → reportes mensuales (ingresos, gastos por tipo, ganancias de agentes, ganancia del sistema, proyección) + por agente.
- **Notificaciones**: `NotificationsPopover` + hooks `src/hooks/notifications/*` → CRUD `/api_data/notifications/` (mark_as_read/unread, unread_count, stats, grouped, groups/{id}/…, preferences) y **SSE en tiempo real** con `src/services/notifications/sse-client.ts` (fetch streaming a `/api_data/notifications/stream/` con header `Authorization`, reconexión con backoff y heartbeat 60 s).

---

## 7. Servicios y consumo de API

Cliente base: `src/lib/api-client.ts`. Barrel: `src/services/index.ts`. Endpoints relativos a `VITE_API_URL` (= `.../arye_system`).

| Servicio (archivo) | Endpoint | Método | Uso |
|---|---|---|---|
| `services/auth/*`, `constants/auth.ts` | `/auth/` · `/auth/refresh/` · `/user/` · `/register/` · `/logout/` | POST/GET | Login JWT, refresh, usuario actual, registro, logout |
| `services/users/*` | `/api_data/user/` · `/api_data/user/{id}/` | GET/POST/PATCH/DELETE | CRUD usuarios, rol, verificación, activación, `agent_profit`, password |
| `hooks/useChangePassword.ts` | `/api_data/user/change_password/` | POST | Cambio de contraseña propio |
| `services/users/verification.ts` | `/verify_user/{secret}` | GET | Verificación por enlace |
| `services/shops/*.service.ts` | `/api_data/shop/` · `/{id}/` | GET/POST/PATCH/PUT/DELETE | CRUD tiendas (4 clases: get/create/update/delete + `shops.service.ts`) |
| `services/api.ts` → `buyingAccountService` | `/api_data/buying_account/` · `/{id}/` | GET/POST/PATCH/DELETE | Cuentas de compra |
| `services/orders/*` | `/api_data/order/` · `/{id}/` | GET/POST/PATCH/DELETE | CRUD pedidos, `markOrderAsPaid` (received_value, applied_balance), cancelación |
| `services/orders/get-order-reports.ts` | `/api_data/reports/orders/` | GET | Análisis de órdenes por rango |
| `services/products/*` | `/api_data/product/` · `/{id}/` | GET/POST/PATCH/DELETE | CRUD productos (shop/category como nombre) |
| `services/api.ts` → `productService` | `/api_data/product/{id}/upload_image/` | POST (multipart) | Imagen de producto |
| `hooks/product/useProductTimeline.ts` | `/api_data/product/{id}/timeline/` | GET | Timeline de eventos |
| `services/api.ts`, `components/products/buyed/*` | `/api_data/buyed_product/` · `/{id}/` | GET/POST/PATCH/DELETE | ProductBuyed, reembolsos |
| `services/products/product-received.ts` | `/api_data/product_received/` · `/{id}/` | GET/POST/PATCH/DELETE | ProductReceived |
| `services/api.ts` → `shoppingReceipService` | `/api_data/shopping_reciep/` · `/{id}/` | GET/POST/PATCH/DELETE | Recibos de compra (con `buyed_products` anidados) |
| `services/purchases/get-purchases.ts` | `/api_data/reports/purchases/` · `/summary/` · `/products/` | GET | Analítica de compras y reembolsos |
| `services/purchases/card-history.ts` | `/cards/operations/` | GET | Historial de operaciones de tarjeta |
| `services/packages/*` | `/api_data/package/` · `/{id}/` | GET/POST/PATCH/DELETE | CRUD paquetes |
| `hooks/package/useAddProductsToPackage.ts`, `package-form.tsx` | `/api_data/package/{id}/add_products/` | POST | Añadir ProductReceived |
| `hooks/package/useRemoveProductFromPackage.ts` | `/api_data/package/{id}/remove_product/{prId}/` | DELETE | Quitar ProductReceived |
| `services/delivery/*` | `/api_data/delivery_receips/` · `/{id}/` | GET/POST/PATCH/DELETE | CRUD entregas, `markDeliveryAsPaid` |
| `hooks/delivery/useAddProductToDelivery.ts` | `/api_data/delivery_receips/{id}/add_products/` | POST | Añadir ProductDelivery |
| `hooks/delivery/useRemoveProductFromDelivery.ts` | `/api_data/delivery_receips/{id}/remove_product/{pdId}/` | DELETE | Quitar ProductDelivery |
| `services/delivery/get-deliveries.ts` | `/api_data/reports/deliveries/` | GET | Análisis de entregas (por categoría, tendencia) |
| `services/category/*` | `/api_data/category/` · `/{id}/` | GET/POST/PATCH/DELETE | CRUD categorías |
| `services/invoices/*` | `/api_data/invoice/` · `/{id}/` · `/{id}/tags/` · `/calculate_range_data/` | GET/POST/PUT/PATCH/DELETE | CRUD facturas + agregado por rango |
| `services/expenses/expenses.ts` | `/api_data/expense/` · `/{id}/` · `/analysis/` y `/api_data/reports/expenses/` | GET/POST/PATCH/DELETE | CRUD y analítica de gastos |
| `services/balance/index.ts` | `/api_data/balance/` · `/{id}/` · `/summary/` | GET/POST/PATCH/DELETE | Balances |
| `services/reports/reports.ts` | `/api_data/reports/profits/` · `/api_data/reports/clients/balances/` · `/api_data/reports/clients/operations/?client_id=` | GET | Ganancias, saldos de clientes, estado de cuenta |
| `services/api.ts` → `dashboardService` | `/api_data/dashboard/stats/` (+ `orders/ products/ sales/ activity/`) | GET | Métricas del dashboard (solo `stats/` usado realmente) |
| `hooks/useSystemConfig.ts` | `/api_data/common_information/` · `/{id}/` | GET/POST/PATCH | Tasa de cambio y costo por libra (crea default si no existe) |
| `hooks/useSystemInfo.ts` | `/api_data/system/info/` | GET | Info del sistema (Settings) |
| `services/notifications/*` | `/api_data/notifications/` (+ `{id}/mark_as_read/`, `unread_count/`, `stats/`, `grouped/`, `groups/*`, `throttling-info/`) · `/api_data/notification-preferences/` (+`create-default/`) · `stream/` (SSE) | GET/POST/PATCH/DELETE | Notificaciones y preferencias |
| `services/cloudinaryService.ts`, `lib/imageUpload.ts` | `https://api.cloudinary.com/v1_1/{cloud}/image/upload` (directo, preset `arye_products`, carpeta `arye_system/{entidad}`) | POST | Subida de imágenes sin pasar por el backend |
| `services/files/*` | `/files/` · `/files/{id}/` · `/files/bulk-delete/` | GET/POST/DELETE | Gestión de archivos (backend no confirmado) |
| `services/scrapping/scrap-amazon.ts` | *(no llama a la API; solo helpers y tipos — bug de recursión, ver §12)* | — | Scraping Amazon (previsto `/amazon/scrape/`) |

---

## 8. Estado global y hooks

### Contextos

- `src/context/AuthContext.tsx` — único Context real (sesión). Consumido por `src/hooks/auth/useAuth.tsx` (y derivados `useAuthUser`, `useIsAdmin`, `useRoles`, `usePermissions`...). Re-export en `src/auth/index.ts`.
- `src/components/utils/ApiRedirectProvider.tsx` — no guarda estado; conecta api-client ↔ router/toasts.

### QueryClient (`src/App.tsx`)

`staleTime: 2 min`, `gcTime: 2 min`, `retry: 1`, `refetchOnWindowFocus: false`. Devtools solo en DEV.

### Claves de TanStack Query e invalidaciones

**Con factory** (patrón `all/lists/list(filters)/details/detail(id)`):
- `userKeys` (`hooks/user/useUsers.ts`, base `['users']`, + `current()`), `categoryKeys` (`hooks/category/useCategory.ts`), `invoiceKeys` (`hooks/invoice/useInvoices.ts`), `expenseKeys` (`hooks/expense/useExpenses.ts`). Sus mutaciones invalidan `lists()` y `detail(id)`.

**Claves planas** (string literal):
| Clave | Hooks | Invalidada por |
|---|---|---|
| `['products']`, `['product', id]`, `['product-timeline', id]` | `useProducts`, `useProduct`, `useProductTimeline` | mutaciones de productos, compras, paquetes y entregas (17 puntos de invalidación) |
| `['orders']`, `['order', id]`, `['orders','available-for-delivery',clientId]` | `useOrders`, `useOrder`, `use-orders-available-for-delivery` | create/update/delete/pago/añadir productos |
| `['shopping-receipts']`, `['shopping-receipt', id]`, `['products-buyed']`, `['product-buyed']` | `useShoppingReceipts`, `useShoppingReceipt`, `useProductsBuyed` | CRUD de compras y reembolsos |
| `['packages']`, `['package', id]`, `['product-received']` | `usePackages` (expone `invalidatePackages`), `usePackage`, `useProductReceiveds` | CRUD paquetes/add-remove products |
| `['deliveries']`, `['delivery', id]` | `useDeliveries` (`useDeliverys.ts`), `useSingleDelivery` | CRUD entregas, add/remove product, pago |
| `['clientBalances']`, `['client-operations-statement', clientId]` | `ConfirmPaymentDialog`s, `useClientOperationsStatement` | pagos y cambios de entregas |
| `['deliveryReportsAnalysis', …]`, `['orderReportsAnalysis', …]`, `['purchasesReportsAnalysis', …]`, `['expenseReportsAnalysis', …]`, `['invoices-range-data', …]`, `['profitReports']` | hooks de `hooks/balance/*` (staleTime 5 min, `enabled` por fechas) | mutaciones de entregas/pagos |
| `['balance']`, `['balance-summary']` | `pages/Balance.tsx`, `balance-report.tsx` | crear/eliminar balance |
| `['dashboard-metrics']` (+`['dashboard-metrics','agent']`) | `useDashboardMetrics` | refresh manual en Orders/Products |
| `['systemConfig']`, `['system-info']`, `['cardHistory', filters]` | `useSystemConfig`, `useSystemInfo`, `use-card-history` | update de configuración |
| `['notifications', …]`, `['notifications','unread-count']`, `['notification-preferences']` | `hooks/notifications/*` | acciones de notificación + eventos SSE |
| `['shops']`, `['shops', filters]` | `hooks/shop/useShops.ts` (versión react-query) | `ShopFormPopover` |

### Hooks personalizados destacables (no query)

- `hooks/use-mobile.ts` (breakpoint 768 px) y `hooks/use-responsive-view.ts` (`viewMode: 'table' | 'cards'`).
- `hooks/use-theme.ts` — tema light/dark/system en `localStorage['theme']` aplicando clase al `<html>` (la UI actual es de facto solo light).
- `hooks/useShops.ts` — versión con `useState` (usada por Shops y PurchaseForm) — **duplicada** con `hooks/shop/useShops.ts` (react-query, usada por ProductForm).
- `hooks/useApiRedirect.ts`, `hooks/useCloudinary.ts`, `hooks/useInvoiceForm.ts`, `hooks/useExpenseForm.ts` (duplicado con `hooks/expense/useExpenseForm.ts`), `hooks/useClientOperationsStatement.ts`.
- `hooks/notifications/use-notification-sse.ts` — integra el cliente SSE con la caché de react-query.

---

## 9. Componentes destacados y sistema de diseño actual

### Tema (negro / naranja / blanco)

- **Definido en `src/index.css`** con variables CSS en formato **oklch** sobre `:root` + `@theme inline` de Tailwind 4 (no hay `tailwind.config`): fondo blanco casi puro (`--background: oklch(99% 0 0)`), texto gris muy oscuro, **primario naranja** (`--primary: oklch(71% 0.159 64.9)`), acentos naranja claro, destructivo rojo coral, radios `--radius: 0.75rem`.
- **Sidebar oscuro** (negro): `--sidebar: hsl(240 5.9% 10%)` con acento naranja `--sidebar-accent: hsl(31 81% 54%)` — es lo que produce la identidad "sidebar negro + naranja + contenido blanco".
- Tipografía **Inter** importada por `@import url(googleapis...)`. Scrollbars personalizados naranjas. Estilos custom para toasts de sonner.
- `@custom-variant dark` declarado pero sin paleta dark definida (dark mode incompleto).
- Paletas auxiliares `beeColors`/`honeyColors` (naranjas/ámbar) en `src/lib/colors.ts` para gráficas.
- Gradientes recurrentes en la UI: `from-orange-500 to-amber-500` (botones primarios de Profile/Settings), `from-orange-400 to-amber-500` (avatares).

### Componentes compartidos clave

- **`src/components/shared/mobile-data-card.tsx`** — `MobileDataCard` + `MobileDataCardList`: tarjeta con borde izquierdo naranja (`border-l-primary`), título/subtítulo, métrica principal, filas icono-label-valor, badges y acciones. Es el patrón estándar de tablas en móvil (usado en Balance, Analytics, tablas principales).
- **`src/hooks/use-responsive-view.ts`** — decide `cards` (móvil <768 px) vs `table`; las páginas alternan `<Table>` ↔ `MobileDataCardList`.
- **Navegación**: `AsideNav.tsx` (sidebar shadcn con grupos: Dashboard / Gestión / Órdenes y Productos / Logística / Finanzas + Configuración abajo + footer con avatar/rol/menú de usuario y logout), `AppSidebarWrapper.tsx` (header sticky de 80 px con `SidebarTrigger`, `BreadcrumbNavigation` y `NotificationsPopover`).
- **Badges de estado**: `OrderStatusBadge`, `PaymentStatusBadge`, `DeliveryStatusBadge`, `PackageStatusBadge`, `purshases/StatusBadge`, `utils/PayStatusBadge` — mapa de colores consistente (verde=pagado/completado, amarillo=parcial/proceso, rojo=no pagado/cancelado, azul=encargado).
- **Métricas**: `MetricCard`, `CardStats`, `CompactMetricsSummary` (mini-tarjetas por página), `ExchangeRateCard`, `AlertsMetrics`, `OrdersMetricsChart` (Recharts).
- **Utilidades UI** (`components/utils/`): `DatePicker`/`DatePickerRange` (react-day-picker + popover), `TablePagination`, `LoadingSpinner`, `honey-loader`, `CircularProgres`, `ValueWithUnit`, `ProductListPopover`, `paymentPanel`, `AvatarUser`, `EmptyCalculation`, `ErrorMessage`.
- **Imágenes**: `images/ImageUploader.tsx` (drag&drop + preview), `QuickImageUpload`, `CloudinaryImage` (transformaciones url-gen), `TableImageCell`.
- **Formularios grandes con layout "editorial"**: patrón repetido en `purshase-form`, `delivery-form`, `package-form` — grid 12 columnas, secciones con títulos uppercase-tracking, sidebar sticky con resumen financiero y botón principal negro (`bg-slate-900`), diálogo full-screen de selección de productos.
- **DecimalInput** (`ui/decimal-input.tsx`), `InputGroup` (inputs con addons), `ui/chart.tsx` (wrapper Recharts con `ChartContainer/Tooltip/Legend`).

---

## 10. Validación y esquemas

- **Carpeta `src/schemas/`** (Zod puro):
  - `expenseSchemas.ts` — `createExpenseSchema` / `editExpenseSchema` (fecha requerida, monto >0 con máximo 2 decimales vía `refine`, categoría enum, descripción ≤2048).
  - `invoiceSchemas.ts` — `tagSchema` con `superRefine` condicional por tipo (pesaje ⇒ weight y cost_per_lb >0; nominal ⇒ fixed_cost >0), `createInvoiceSchema` (≥1 tag), `editInvoiceSchema`.
- **Esquemas Zod inline en componentes** (patrón dominante): `login.tsx` (`loginSchema` con autodetección email/teléfono), `UserForm.tsx` (`createUserSchema`/`editUserSchema`), `purshase-form.tsx` (`createShoppingReceipSchema`), `delivery-form.tsx` (`createDeliverySchema`), `package-form.tsx` (`packageSchema`), `CategoryForm`, `expenses-form`, `invoices-form`.
- **Integración**: `react-hook-form` + `zodResolver` + componentes `Form/FormField/FormMessage` de `src/components/ui/form.tsx`.
- **Validaciones imperativas adicionales**: clases de servicio de shops (`create-shop.service.ts` valida nombre/URL y duplicados), `ProductForm` (estado controlado sin Zod, validación manual), `Settings.tsx` (validación manual de contraseñas y variables), checks "al menos 1 producto" con toast en los 3 formularios logísticos.
- **Réplicas de lógica backend**: `src/lib/payment-status-calculator.ts` (estado de pago con redondeo, documentado como espejo de `backend/api/models/orders.py`) y `src/lib/purchase-calculations.ts` (costo total del producto).

---

## 11. Configuración y variables de entorno

Fuente: `.env.example` y usos reales (`import.meta.env.*`).

| Variable | Usada en | Propósito |
|---|---|---|
| `VITE_API_URL` | `lib/api-client.ts`, `services/notifications/sse-client.ts` | Base URL del backend, **incluye** el prefijo `/arye_system` (default `http://localhost:8000/arye_system`) |
| `VITE_AUTH_TOKEN_KEY` | Solo `sse-client.ts` (el api-client usa el literal `access_token`) | Clave del token en storage |
| `VITE_REFRESH_TOKEN_KEY` | Documentada; en código se usa el literal `refresh_token` | Clave del refresh token |
| `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET` / `VITE_CLOUDINARY_API_KEY` / `VITE_CLOUDINARY_API_SECRET` | `lib/imageUpload.ts`, `services/cloudinaryService.ts` (este último lee `CLOUDINARY_CLOUD_NAME` sin prefijo VITE_ — bug, cae al default `ditwmsrsh`) | Subida directa a Cloudinary (preset `arye_products`, carpetas `arye_system/{products|packages|deliveries}`) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | 1 uso residual | Legacy |
| Resto de `.env.example` (`VITE_APP_MODE`, `VITE_API_TIMEOUT`, `VITE_DEFAULT_PAGE_SIZE`, feature flags, etc.) | **No leídas en el código** — solo documentales | — |

**Build/deploy**: `vite.config.ts` — alias `@→src`, target `es2020`, terser con `drop_console` en prod, `manualChunks` (vendor/router/...); scripts `build:cloudflare`, `deploy:cloudflare` (falta `deploy-cloudflare.js` en el repo), `nginx.conf` para hosting alternativo. Dev: puerto 5173.

---

## 12. Puntos débiles y deuda técnica observada

**Bugs concretos**
1. `src/services/scrapping/scrap-amazon.ts` — `scrapeAmazonCart` **se llama a sí misma** (recursión infinita) y `scrapeAmazonProduct` depende de ella; nunca se llama al endpoint real `/amazon/scrape/`. El módulo está roto.
2. `src/services/image/image-upload.tsx` — importa `Button` desde `'../../../../client/src/components/ui/button'` (**cruza al app client**); rompe el aislamiento del paquete y el build si client cambia.
3. `src/pages/DeliveryDetail.tsx` — botones "Volver" navegan a `/deliveries`, ruta inexistente (la real es `/delivery`) → cae en 404/unauthorized.
4. `src/components/delivery/delivery-form.tsx` — bug de precedencia en los auto-cálculos: `form.getValues("weight_cost") || 0 - cost` se evalúa como `a || (0 - cost)`, así que el guard "solo si cambió" no funciona como se pretende.
5. `src/services/products/create-product-buyed.ts` — usa `/api/product-buyed/` (prefijo y nombre incorrectos; el resto usa `/api_data/buyed_product/`).
6. `src/services/cloudinaryService.ts` lee `import.meta.env.CLOUDINARY_CLOUD_NAME` (sin prefijo `VITE_`, siempre undefined en Vite).
7. `package.json` con entradas de dependencias corruptas (`"react@^15.0.0": "link:..."`, etc.).
8. `src/components/balance/balance-report.tsx` — `orderProfit = total_revenue − total_revenue` (siempre 0, cálculo muerto).
9. `pages/Products.tsx` y `pages/Orders.tsx` llaman `toast.error(...)` durante el render cuando hay error (efecto secundario en render; dispara toasts duplicados).

**Inconsistencias de API / nombres**
10. Endpoints con typos consolidados: `delivery_receips` y `shopping_reciep` (el CLAUDE.md del monorepo documenta `delivery_receipts` — la fuente de verdad es el código). Carpeta `components/purshases/` (sic), hook `useDeliverys.ts` (sic). Al portar, conservar los typos de endpoint o migrarlos coordinadamente con el backend.
11. `UserRole` definido 3 veces con valores distintos (`types/models/user.ts`, `types/models/base.ts` con `buyer`/`community_manager`, `routes/role-config.ts`); `roleLabels` duplicado. `PRODUCT_STATUSES` desalineado con `ProductStatus`.
12. `AUTH_ENDPOINTS.LOGOUT = '/logout/'` y varios servicios de auth (password-reset, logout-all, verify) apuntan a endpoints que el propio código comenta como inexistentes.

**Arquitectura / duplicación**
13. `ProtectedRoute` duplicado (`components/utils/` — el usado — vs `routes/protected-route.tsx`); `useShops` duplicado (estado local vs react-query); `useExpenseForm` duplicado; dos `ConfirmPaymentDialog` casi idénticos (orders/delivery); servicios de shops sobre-ingenierizados (5 clases para un CRUD); `services/api.ts` mezcla dominios ya extraídos a carpetas.
14. **Paginación fake**: `apiClient.getPaginated` fuerza `page_size: 1000` — todas las listas cargan el dataset completo y varias páginas re-filtran client-side (Orders filtra dos veces: API + memoria). Riesgo de rendimiento al crecer los datos; el port debería implementar paginación real (solo Expenses la usa).
15. Formularios grandes sin RHF (`ProductForm`, `CreateOrderDialog` con `useState` manual) conviven con formularios RHF+Zod — patrones mixtos.
16. Sincronización de productos de una entrega por diff con N llamadas secuenciales (remove+add por ítem) — sin transaccionalidad; un fallo intermedio deja estado parcial.
17. Doble mecanismo de refresco: react-query invalidations + `refreshTrigger` locales en las páginas `*ProductsManagement` (redundante).
18. `permissions` del AuthContext nunca poblado; `hasPermission` es letra muerta — toda la autorización es por rol.

**UI / limpieza**
19. `TailwindTest.tsx`, `config/adminFeatures.ts`/`components/admin/AdminFeatures.tsx` y dependencia `@supabase/supabase-js` prácticamente sin uso; `lib/cloudinary.ts` vacío; `services/files/*` apunta a endpoints `/files/` no confirmados en el backend.
20. Dark mode declarado pero incompleto (variables solo light; `use-theme.ts` aplica clases sin paleta dark). Colores hardcodeados (`orange-500`, `slate-900`) en vez de tokens en muchísimos componentes — dificulta re-theming en el port.
21. Textos mezclados español/inglés; `console.log/error` abundantes (mitigado por `drop_console` en prod).
22. Sin tests reales pese a vitest/testing-library configurados (`src/setupTests.ts`).
23. `QRLink` usa `logoImage="/src/assets/logo/logo.svg"` (ruta de dev que no existe en build de producción).
24. Claves de token literales (`access_token`) en vez de `VITE_AUTH_TOKEN_KEY` en `api-client.ts`/`storage.ts` — divergencia con lo documentado y con el SSE client.
