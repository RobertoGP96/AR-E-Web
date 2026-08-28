# Admin Next (apps/admin-next)

Documento de referencia técnica para mantenimiento y desarrollo futuro. Todas las rutas de archivo son relativas a `apps/admin-next/`, salvo que se indique lo contrario. Generado a partir de la lectura directa del código (agosto 2026).

---

## 1. Propósito y relación con apps/admin

**Admin Next** es la reimplementación del panel de administración de AR-E (Shein Shop Management) sobre **Next.js 16 (App Router)**. Es un *port* funcional y visual del admin Vite (`apps/admin`, React 19 + Vite 7 + TanStack Query que consume la API Django), pero con una arquitectura radicalmente distinta:

- **NO consume el backend Django (`backend/`) por HTTP.** No hay llamadas a `/arye_system/...`, ni axios/fetch hacia la API REST, ni JWT de simplejwt.
- En su lugar, **escribe y lee directamente la misma base de datos Neon Postgres que usa Django**, mediante **Prisma 7** con el driver adapter de Neon (`src/lib/prisma.ts`). El esquema Prisma (`prisma/schema.prisma`) es un espejo de los modelos Django de `backend/api/models/`, mapeado a las tablas `api_*` con `@@map`/`@map`.
- Como Django mantiene sus invariantes con **signals** (recalcular balance de cliente, totales de orden, estado de producto), y esta app escribe la BD directamente, toda esa lógica está **re-implementada fielmente en TypeScript** en `src/lib/` (`balance.ts`, `order-cost.ts`, `product-status.ts`) y debe invocarse manualmente tras cada mutación.
- La autenticación es propia (**Auth.js/NextAuth v5** con provider Credentials) pero **compatible con Django**: verifica y genera hashes `pbkdf2_sha256` en el mismo formato (`src/lib/password.ts`), por lo que los usuarios existentes de Django inician sesión con sus credenciales de siempre, y las contraseñas cambiadas aquí siguen funcionando en Django.
- Corre en el puerto **5175** (`next dev --port 5175`) para convivir con admin Vite (5173) y client (5174). Se despliega en **Vercel** (ver `DEPLOY.md`).

En la práctica, admin-next reemplaza al binomio "admin Vite + API Django" con una sola app full-stack (Server Components + Server Actions + Prisma). El admin Vite sigue siendo la **fuente de verdad de RBAC y de diseño**: `src/lib/action-helpers.ts` y `src/lib/route-roles.ts` declaran que espejan `apps/admin/src/routes/role-config.ts`, y `src/app/globals.css` porta los tokens de `apps/admin/src/index.css`.

Advertencia operativa clave (de `DEPLOY.md`): **la BD es compartida con Django — nunca ejecutar `prisma migrate` contra ella**; si Django cambia el esquema, sincronizar con `prisma db pull`. De hecho **no existe carpeta `prisma/migrations/`** en la app.

---

## 2. Stack técnico y dependencias clave

| Dependencia | Versión | Propósito |
|---|---|---|
| `next` | 16.2.6 | Framework (App Router, Server Components, Server Actions, proxy/middleware) |
| `react` / `react-dom` | 19.2.4 | UI (hooks `useActionState`, `useTransition`, etc.) |
| `next-auth` | 5.0.0-beta.31 | Auth.js v5: sesión JWT, provider Credentials |
| `@prisma/client` / `prisma` | ^7.8.0 | ORM contra Neon Postgres (esquema espejo de Django) |
| `@prisma/adapter-neon` | ^7.8.0 | Driver adapter de Prisma para el driver serverless de Neon |
| `@neondatabase/serverless` | ^1.1.0 | Driver Postgres sobre WebSocket (serverless-friendly) |
| `ws` | ^8.20.1 | Constructor WebSocket para el driver Neon en Node |
| `zod` | ^4.0.17 | Validación de formularios/inputs en server actions (`schema.ts` por dominio) |
| `tailwindcss` + `@tailwindcss/postcss` | ^4 | Estilos utilitarios (Tailwind v4, config vía CSS `@theme inline`) |
| `lucide-react` | ^0.539.0 | Iconografía completa de la app |
| `sonner` | ^2.0.7 | Toasts (montado en `src/lib/providers.tsx`, posición top-right, richColors) |
| `recharts` | ^2.15.4 | Gráficas de Analytics (área, pie, barras) |
| `react-qrcode-logo` | ^4.0.0 | QR con logo en `src/components/qr-link.tsx` |
| `vitest` | ^3.2.4 (dev) | Tests unitarios de `src/lib` |
| `sharp` + `png-to-ico` | dev | Script `scripts/gen-icons.mjs` (generación de favicons/iconos PWA) |
| `dotenv` | dev | `prisma.config.ts` lee `.env.local` para la CLI de Prisma |
| `eslint` + `eslint-config-next` | 9 / 16.2.6 | Lint |
| `typescript` | ^5 | Tipado |

**Importante para el rediseño:** NO hay librería de componentes UI (no shadcn/ui, no Radix, no Headless UI, no CVA, no `tailwind-merge`, no React Hook Form). Todos los diálogos, popovers, tablas, selects e inputs son **HTML nativo estilizado a mano con clases Tailwind**. Tampoco está instalado `tailwindcss-animate` / `tw-animate-css` (ver §9 y §12).

Configuración Next relevante (`next.config.ts`): `outputFileTracingRoot` apunta a la raíz del monorepo (pnpm), `serverExternalPackages` para `@prisma/client`, `@prisma/adapter-neon`, `@neondatabase/serverless` y `ws`, y `images.remotePatterns` permite solo `res.cloudinary.com`.

---

## 3. Modelo de datos (Prisma)

`prisma/schema.prisma` refleja los modelos Django. Nota de diseño crítica (comentada en el propio schema): las columnas de rol/estado/categoría son **`VARCHAR` en la BD propiedad de Django (CharField + choices), NO enums de Postgres**. Modelarlas como enums Prisma provocaba el error 42704 (`type "public"."UserRole" does not exist`); por eso son `String` y los valores permitidos se validan con Zod en aplicación.

| Modelo (tabla) | Campos clave | Relaciones | Estados/choices (validados en app) |
|---|---|---|---|
| `CustomUser` (`api_customuser`) | `password` (hash Django), `email?` único, `phoneNumber` único, `name`, `lastName`, `homeAddress`, `role` (default `client`), `agentProfit`, `balance`, `isActive`, `isVerified`, `isStaff`, `isSuperuser`, `dateJoined` | auto-relación `assignedAgent`/`assignedClients`; `orders` (cliente), `managedOrders` (gestor), `deliveries`, `createdExpenses`, `notifications`/`sentNotifications` | roles: `user`, `agent`, `accountant`, `logistical`, `admin`, `client` |
| `Notification` (`api_notification`) | `notificationType`, `priority` (`urgent/high/normal/low`), `title`, `message`, `actionUrl?`, `isRead`, `readAt?`, `metadata` Json, `expiresAt?` | `recipient`, `sender?` | **Espejo solo-lectura/marcado**: Django crea las filas vía signals; esta app solo lista y marca leídas. `content_type_id`/`object_id` intencionalmente sin mapear |
| `Shop` (`api_shop`) | `name` único, `link` único, `isActive`, `taxRate` | `products`, `buyingAccounts`, `buys` (ShoppingReceip) | — |
| `Category` (`api_category`) | `name` único, `shippingCostPerPound`, `clientShippingCharge` | `products`, `deliveries` | — |
| `BuyingAccounts` (`api_buyingaccounts`) | `accountName` | `shop?` (Cascade), `buys` | — |
| `ShoppingReceip` (`api_shoppingreceip`) | `statusOfShopping` (default `No pagado`), `cardId?`, `buyDate`, `totalCostOfPurchase` | `shoppingAccount` (Cascade), `shopOfBuy` (Cascade), `buyedProducts` | pago: `No pagado`, `Pagado`, `Parcial` |
| `Order` (`api_order`) | `status` (default `Encargado`), `payStatus` (default `No pagado`), `observations?`, `receivedValueOfClient`, `balanceApplied`, `paymentDate`, `totalCosts` (cacheado) | `client` (Cascade), `salesManager?`, `products` | estado: `Encargado`, `Procesando`, `Completado`, `Cancelado`; pago: `No pagado`, `Parcial`, `Pagado` |
| `Product` (`api_product`) | **id UUID**, `sku?`, `name`, `link?`, `imageUrl?`, `description?`, `observation?`, `amountRequested/Purchased/Received/Delivered`, `status`, `productPictures?`, cascada de costos: `shopCost`, `shopDeliveryCost`, `shopTaxes`, `chargeIva`, `baseTax`, `shopTaxAmount`, `ownTaxes`, `addedTaxes`, `totalCost` | `shop` (Cascade), `category?` (SetNull), `order` (Cascade), `buys`, `receiveds`, `delivers` | estado: `Encargado` → `Comprado` → `Recibido` → `Entregado` (derivado, ver abajo) |
| `ProductBuyed` (`api_productbuyed`) | `amountBuyed`, `quantityRefuned`, `isRefunded`, `refundDate?`, `refundAmount`, `refundNotes?`, `shopDiscount`, `offerDiscount` | `originalProduct` (Cascade), `shopingReceip?` (Cascade) | — |
| `Package` (`api_package`) | `agencyName`, `numberOfTracking` único, `statusOfProcessing` (default `Enviado`), `arrivalDate`, `packagePicture?` | `packageProducts` (ProductReceived) | estado: `Enviado`, `Recibido`, `Procesado` |
| `ProductReceived` (`api_productreceived`) | `amountReceived`, `observation?` | `originalProduct` (Cascade), `package?` (Cascade) | — |
| `DeliverReceip` (`api_deliverreceip`) | `weight`, `status` (default `Pendiente`), `paymentStatus` (default `No pagado`), `paymentDate?`, `paymentAmount`, `balanceApplied`, `deliverDate`, `deliverPicture?`, `weightCost`, `managerProfit` | `client` (Cascade), `category?` (SetNull), `deliveredProducts` | estado: `Pendiente`, `En transito`, `Entregado`, `Fallida`; pago: `No pagado`, `Parcial`, `Pagado` |
| `ProductDelivery` (`api_productdelivery`) | `amountDelivered` | `originalProduct` (Cascade), `deliverReceip?` (Cascade) | — |
| `CommonInformation` (`api_commoninformation`) | `changeRate`, `costPerPound` | — | Singleton (patrón `get_instance()` de Django: se usa la primera fila) |
| `Balance` (`api_balance`) | `startDate`, `endDate` (Date), `systemWeight`, `registeredWeight`, `revenues`, `buysCosts`, `costs`, `expenses` (Decimal 12,2), `notes?` | — | — |
| `Expense` (`api_expense`) | `date`, `amount`, `category` (default `Operativo`), `description?` | `createdBy?` (SetNull) | categorías: `Envio`, `Tasas`, `Sueldo`, `Publicidad`, `Operativo`, `Entrega`, `Otro` |
| `Invoice` (`invoices`) | `date`, `total` (Decimal 10,2) | `tags` | Ojo: tabla `invoices`, no `api_*` |
| `Tag` (`tags`) | `type` (`pesaje`/`nominal`), `weight`, `costPerLb`, `fixedCost`, `subtotal` (Decimal 10,2) | `invoice` (Cascade) | — |

**Ciclo de vida del estado de producto** (`deriveProductStatus` en `src/lib/order-cost.ts`, espejo de `_determine_product_status()` de `api/signals.py`):

- `Entregado`: comprado ≥ pedido, recibido ≥ pedido, entregado ≥ recibido, entregado ≥ comprado, entregado > 0.
- `Recibido`: comprado ≥ pedido, recibido ≥ pedido, entregado < recibido, recibido > 0.
- `Comprado`: comprado ≥ pedido, recibido < pedido, comprado > 0.
- `Encargado`: en cualquier otro caso (incluye reversión tras un reembolso total).

Las cantidades se recalculan siempre por agregación de las tablas hijas (`src/lib/product-status.ts`): `amount_purchased = Σ(amountBuyed − quantityRefuned)`, `amount_received = Σ amountReceived`, `amount_delivered = Σ amountDelivered`.

---

## 4. Autenticación, roles y autorización

**Arquitectura en dos instancias de NextAuth:**

- `src/auth.config.ts` — configuración base *sin providers* y sin Prisma: `trustHost: true`, `session: { strategy: 'jwt' }`, `pages: { signIn: '/login' }`, callbacks `jwt`/`session` que copian `id`, `role` y `phoneNumber` al token y a la sesión. Exporta el tipo `Role` (`user | agent | accountant | logistical | admin | client`).
- `src/auth.ts` — instancia completa: añade el provider **Credentials**. `authorize()` acepta `identifier` (email si contiene `@`, si no teléfono) + `password`; busca el `CustomUser`, exige `isActive`, verifica con `verifyDjangoPassword`, y **estrecha el rol** al conjunto conocido (cualquier valor inesperado degrada a `user`, el rol más débil). Exporta `handlers`, `auth`, `signIn`, `signOut`.
- `src/app/api/auth/[...nextauth]/route.ts` — expone `GET/POST` de los handlers.
- `src/proxy.ts` — middleware (convención `proxy` de Next 16). Construye su **propia** instancia NextAuth solo con `authConfig` (sin Prisma/ws, que no pueden empaquetarse en el chunk de middleware); decodifica la misma cookie firmada con `AUTH_SECRET`. Lógica:
  1. `PUBLIC_PATHS = ['/login', '/api/auth', '/manifest.webmanifest']`.
  2. Sin sesión y ruta no pública → redirect a `/login?next=<pathname>`.
  3. Con sesión en `/login` → redirect a `/dashboard`.
  4. RBAC por página: si `canAccessPath(role, pathname)` falla (y no es `/unauthorized`) → redirect a `/unauthorized`.
  5. `config.matcher` excluye estáticos de `_next` e imágenes.

**RBAC declarativo** en `src/lib/route-roles.ts` (espejo de `apps/admin/src/routes/role-config.ts`), aplicado sobre el **primer segmento** de la ruta (o `primero/segundo` para las sub-vistas de `settings`; la clave más específica gana):

| Segmento | Roles permitidos |
|---|---|
| `dashboard`, `settings`, `profile` | staff (admin, agent, accountant, logistical) |
| `settings/data` | admin, accountant (grupo `finance`) |
| `settings/import`, `settings/system` | admin |
| `users`, `shops`, `categories`, `purchases` | admin |
| `orders` | admin, agent |
| `products` | admin, agent, logistical |
| `delivery` | admin, agent, logistical (agente solo lectura: las actions de escritura exigen admin/logistical) |
| `packages` | admin, logistical |
| `balance`, `invoices`, `expenses`, `analytics`, `client-balances` | admin, accountant (grupo `finance`) |
| Segmento desconocido dentro del área admin | cualquier staff |

`isStaff()` bloquea a `user`/`client` en todo el panel. `visibleNavItems()` filtra la navegación con la misma tabla.

**Tres capas de defensa:**
1. `src/proxy.ts` (edge, redirects).
2. `src/app/(admin)/layout.tsx` (server): re-verifica sesión y `isStaff`, redirige a `/login` o `/unauthorized`.
3. Cada server action llama `requireRole(ROLES.<dominio>)` / `requireStaff()` de `src/lib/action-helpers.ts` antes de tocar la BD.

**Página `/unauthorized`** (`src/app/unauthorized/page.tsx`): tarjeta centrada con logo, icono `ShieldAlert` ámbar, mensaje que incluye el rol de la sesión y `SignOutButton`. Es alcanzable por cualquier usuario autenticado.

---

## 5. Estructura de rutas y páginas

Grupos: `(auth)` para login (sin shell), `(admin)` para el panel (con sidebar/header), más `/unauthorized` y `/api/auth`.

| Ruta | Archivo | Descripción | Roles |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Redirect a `/dashboard` | — |
| `/login` | `src/app/(auth)/login/page.tsx` + `login-form.tsx` | Login split-screen | Pública |
| `/unauthorized` | `src/app/unauthorized/page.tsx` | Acceso restringido | Autenticado |
| `/dashboard` | `src/app/(admin)/dashboard/page.tsx` + `dashboard-greeting.tsx` | Métricas del negocio | staff |
| `/users` | `src/app/(admin)/users/page.tsx` + `users-client.tsx` | CRUD de usuarios | admin |
| `/shops` | `src/app/(admin)/shops/page.tsx` + `shops-client.tsx` | CRUD tiendas + cuentas de compra | admin |
| `/categories` | `src/app/(admin)/categories/page.tsx` + `categories-client.tsx` | CRUD categorías de envío | admin |
| `/orders` | `src/app/(admin)/orders/page.tsx` + `orders-client.tsx` | Listado/CRUD de órdenes + pago | admin, agent |
| `/orders/[id]` | `src/app/(admin)/orders/[id]/page.tsx` + `order-detail-client.tsx` | Detalle de orden + productos | admin, agent |
| `/products` | `src/app/(admin)/products/page.tsx` + `products-client.tsx` | Catálogo global de productos (solo lectura + QR) | admin, agent, logistical |
| `/purchases` | `src/app/(admin)/purchases/page.tsx` + `purchases-client.tsx` | CRUD de compras (ShoppingReceip) | admin |
| `/purchases/[id]` | `src/app/(admin)/purchases/[id]/page.tsx` + `purchase-detail-client.tsx` | Productos comprados + reembolsos | admin |
| `/packages` | `src/app/(admin)/packages/page.tsx` + `packages-client.tsx` | CRUD paquetes + cambio rápido de estado | admin, logistical |
| `/packages/[id]` | `src/app/(admin)/packages/[id]/page.tsx` + `package-detail-client.tsx` | Recepción de productos | admin, logistical |
| `/delivery` | `src/app/(admin)/delivery/page.tsx` + `delivery-client.tsx` | CRUD entregas + pago | admin, agent (ver), logistical |
| `/delivery/[id]` | `src/app/(admin)/delivery/[id]/page.tsx` + `delivery-detail-client.tsx` | Productos entregados | admin, agent (ver), logistical |
| `/delivery/prepare` | `src/app/(admin)/delivery/prepare/page.tsx` + `prepare-client.tsx` (+ `review-packages-step.tsx`, `build-deliveries-step.tsx`) | Mesa de preparación en 2 fases (tabs con estado conservado): **(1) Revisar paquetes** — paquetes pendientes uno a uno con checklist de llegadas por producto y cantidad (lote `registerArrivalsAction`; nota opcional por ítem; Enviado→Recibido automático al registrar; «Terminar revisión» → Procesado); **(2) Armar entregas** — recibido sin entregar agrupado por cliente, con unidades por paquete de procedencia, avisos de «en camino»/«sin comprar» para entregas parciales incrementales, y creación de la entrega en un paso | admin, agent (ver), logistical |
| `/invoices` | `src/app/(admin)/invoices/page.tsx` + `invoices-client.tsx` | Facturas de costos de envío (tags) | admin, accountant |
| `/expenses` | `src/app/(admin)/expenses/page.tsx` + `expenses-client.tsx` | Registro de gastos | admin, accountant |
| `/balance` | `src/app/(admin)/balance/page.tsx` + `balance-client.tsx` | Balances periódicos manuales | admin, accountant |
| `/client-balances` | `src/app/(admin)/client-balances/page.tsx` + `client-balances-client.tsx` | Balance por cliente (agregado en vivo) | admin, accountant |
| `/analytics` | `src/app/(admin)/analytics/page.tsx` + `analytics-charts.tsx` | Reportes de 12 meses (Recharts) | admin, accountant |
| `/settings` | `src/app/(admin)/settings/page.tsx` + `settings-form.tsx` (+ `layout.tsx` + `settings-nav.tsx`: hub con tabs por ruta General/Datos/Importar Excel/Sistema, filtradas por rol) | CommonInformation (tasa de cambio, costo/lb) + enlaces a otros elementos configurables (categorías, tiendas, agentes) | staff (edita admin/accountant) |
| `/settings/data` | `src/app/(admin)/settings/data/page.tsx` + `data-client.tsx` + `export/route.ts` | Gestión de datos: salva completa JSON, export .xlsx (una hoja por entidad marcada) y CSV por entidad (separador `;`, BOM). Registro de entidades exportables en `src/lib/data-export.ts` (12 entidades, sin contraseñas ni secretos). El GET `/settings/data/export?format=json\|xlsx\|csv&entities=a,b` re-verifica rol | admin, accountant |
| `/settings/system` | `src/app/(admin)/settings/system/page.tsx` | Estado del sistema: ping/latencia a la BD, registros por entidad, usuarios por rol, versión del panel, entorno, parámetros vigentes | admin |
| `/profile` | `src/app/(admin)/profile/page.tsx` + `profile-forms.tsx` | Perfil propio + cambio de contraseña | staff |
| `/settings/import` | `src/app/(admin)/settings/import/page.tsx` + `import-client.tsx` (antes `/import`; esa ruta ahora redirige aquí) | Importación de embarques desde Excel "AR&E Shipps #NNN" (subir → previsualizar/omitir → importar). Parser/mapeador en `src/lib/excel-import/` (exceljs); actions `analyzeExcelAction`/`runImportAction` (transacción única: shops, cuentas, agentes, clientes con teléfono placeholder `imp-…`, órdenes por cliente, productos, ShoppingReceip por fila "Factura" con coste real, paquetes por tracking, recepciones si hay F. llegada, gastos de la hoja General). Tarifas de tienda replicadas del Excel: Shein 7 % IVA, Amazon +1 %, Temu +3 %, Otras +5 %. Scripts de diagnóstico: `scripts/inspect-import.ts` y `scripts/dry-run-import.ts` (npx tsx). | admin |
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | Endpoints Auth.js | — |
| `manifest.webmanifest` | `src/app/manifest.ts` | PWA manifest (standalone, theme `#e8772e`) | Pública |
| error / not-found | `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/(admin)/not-found.tsx` | Estados de error 500/404 | — |

**Patrón de página estándar** (se repite en casi todos los dominios): `page.tsx` es un Server Component que (1) parsea `searchParams` (`q`, filtros, `page`, `per` vía `parsePagination`), (2) construye un `where` Prisma, (3) ejecuta `Promise.all` de consultas (filas + opciones de selects + count), (4) serializa BigInt/Date a strings y (5) renderiza `<XClient initialRows=... />` + `<TablePagination />`. El cliente (`*-client.tsx`) maneja búsqueda/filtros escribiendo la URL (`router.replace` dentro de `startTransition`) y abre diálogos de crear/editar/eliminar; tras cada éxito llama `router.refresh()` y muestra un toast de sonner.

### Detalle por página

**Login (`(auth)/login`)** — Split-screen: panel izquierdo (solo `lg:`) sobre base casi negra `bg-[oklch(21.779%_0.00002_271.152)]` con dos blobs `clip-path: polygon(...)` degradados naranja/ámbar con `blur-3xl`, logo invertido, titular y 3 highlights con iconos en chips `bg-white/10 ring-white/20`; panel derecho blanco con `LoginForm` (client): inputs h-12 `rounded-xl` con icono izquierdo (`AtSign`, `Lock`), check verde de validación de identificador, toggle mostrar/ocultar contraseña, checkbox "Recordarme" (decorativo), alerta de error `role="alert"`, botón `bg-brand` con `Loader2` girando y flecha que se desliza al hover. Usa `signIn('credentials', { redirect: false })` y sanitiza `?next=` (solo rutas relativas del mismo sitio).

**Dashboard** — `force-dynamic`. Server component con ~17 agregaciones Prisma en paralelo. Estructura: `DashboardGreeting` (client: saludo según hora, tarjeta "Tasa Cambio" naranja con el `changeRate` de CommonInformation, tarjeta calendario/reloj en vivo con `setInterval` 1s) + 3 grupos de metric cards con borde-acento izquierdo: "Resumen General" (usuarios, productos, órdenes del mes, ingresos del mes), "Finanzas" (ganancia total, margen, entregas sin pagar, gastos del mes), "Clientes & Operaciones" (deudas, saldos a favor, peso entregado, comisiones de agentes, reembolsos). Cards: `rounded-xl border-2 bg-white`, círculo decorativo translúcido del color del icono, icono en cuadro sólido, hover `-translate-y-0.5` + sombra. Sin gráficas (las gráficas viven en Analytics).

**Usuarios** — Búsqueda por nombre/email/teléfono, filtros por rol/activo/verificado. Tabla con acciones: editar (`UserDialog`, `user-dialog.tsx` con campos de rol, `agentProfit`, `balance`, agente asignado, activo), cambiar contraseña (`change-password-dialog.tsx`), verificar (`BadgeCheck`), activar/desactivar (`Power`), eliminar (`delete-dialog.tsx`). Server actions correspondientes en `users/actions.ts`.

**Tiendas** — CRUD con `shop-dialog.tsx` (nombre, link http(s), `taxRate` 0-100, activa), toggle activa, borrado (bloqueado por FK), y **`accounts-dialog.tsx`** para gestionar las cuentas de compra anidadas (añadir/renombrar/eliminar — eliminación rechazada si la cuenta tiene compras).

**Categorías** — CRUD simple con `category-dialog.tsx`: nombre, `shippingCostPerPound` (costo real por libra) y `clientShippingCharge` (lo que se cobra al cliente por libra).

**Órdenes (lista)** — Búsqueda por cliente/teléfono; `FilterPopover` con estado y tipo de pago; tabla desktop (`lg:`) con columnas Cliente (link al detalle), Gestor, Estado (`OrderStatusBadge`), Pay (`PayStatusBadge`), Productos, Total, Creado, Acciones (botón `$` confirmar pago — deshabilitado visualmente si ya está Pagado, con toast informativo —, Open, editar, eliminar); lista de cards en móvil. Diálogos: `order-dialog.tsx` (cliente, gestor opcional, estado, recibido, saldo aplicado, observaciones; el total es derivado de los productos), `delete-dialog.tsx`, `confirm-payment-dialog.tsx` (envuelve `PaymentPanel`).

**Orden detalle (`/orders/[id]`)** — Link "Volver a órdenes", header card con cliente/teléfono/gestor/observaciones, pills de estado y 4 stats (Total, Received, Saldo aplicado, Outstanding — en rojo si > 0). Tabla de productos con `product-dialog.tsx` (formulario grande de 2 columnas con **vista previa en vivo del costo** usando `computeProductCost`; al elegir tienda auto-rellena `shopTaxes` con el `taxRate` de la tienda) y `product-delete-dialog.tsx`. Pie de tabla con total de la orden.

**Productos (global)** — Solo lectura (los productos se crean desde la orden). Búsqueda por nombre/SKU/cliente, filtros por estado y tienda, **selector de columnas persistido en `localStorage`** (`ColumnsSelector`), `ProductStatusBadge`, progreso de cantidades (pedido/comprado/recibido/entregado), link a la orden y `QRLink` (QR del enlace del producto).

**Compras (lista)** — CRUD de `ShoppingReceip` con `purchase-dialog.tsx` (tienda → cuenta de compra dependiente, estado de pago con `PurchasePayBadge` sólido, `cardId`, fecha, costo total). Detalle **`/purchases/[id]`**: añadir productos comprados (candidatos = productos de la misma tienda, mostrando pendientes = pedido − comprado; el server valida el tope), quitarlos y **`RefundDialog`** (cantidad ≤ restante, monto, notas; los reembolsos se acumulan).

**Paquetes (lista)** — Búsqueda agencia/tracking, filtro de estado, **select inline de estado por fila** (con estilos pill por estado; `setPackageStatusAction`), `PictureHover` de la captura, acciones recepción/editar/eliminar. `package-dialog.tsx` incluye `ImageUploadField` (Cloudinary). Detalle **`/packages/[id]`**: recepción de productos (candidatos con `remaining = comprado − recibido`, observación opcional ≤ 200), listado de recibidos con cliente, y eliminación de recepciones.

**Entregas (lista)** — Búsqueda cliente/teléfono, filtro estado (`FilterPopover`), badges de estado/pago, `PictureHover`, pago (`confirm-payment-dialog.tsx` → `PaymentPanel`), editar/eliminar. `delivery-dialog.tsx`: cliente, categoría, peso, estado, fecha, pago inicial/saldo, `ImageUploadField`, y **preview en vivo del costo por peso** (`weight × clientShippingCharge`). Detalle **`/delivery/[id]`**: stats (weightCost, managerProfit), añadir/quitar productos entregados (candidatos con `remaining = recibido − entregado`).

**Costos de Envío (`/invoices`)** — Tabla de facturas (ID, fecha, nº de tags, total en verde). `invoice-dialog.tsx` permite componer N tags de tipo `pesaje` (peso × costo/lb + costo fijo) o `nominal` (costo fijo), con subtotales y total calculados también en el servidor.

**Gastos** — CRUD con categoría (7 choices), fecha, monto, descripción; guarda `createdById` del usuario de la sesión; con paginación.

**Balance (`/balance`)** — CRUD de registros por período con **generador**: en el diálogo se elige el rango y "Calcular datos del período" (`calculateBalanceRangeAction`) agrega con Prisma los datos del rango (réplica del generador Vite `balance-report.tsx`, ver fórmulas en el docstring de la action): peso de entregas (`systemWeight`), peso de tags de facturas (`registeredWeight`), ingresos = órdenes pagadas creadas en rango + pagos fuera de fecha + `weightCost` de entregas, compras netas de reembolsos, facturas y gastos. Los valores prellenan el formulario (editables) junto a un panel resumen con desglose y ganancia proyectada; también admite escritura manual. Columna calculada **Ganancia = revenues − buysCosts − costs − expenses** en el cliente. Nota: el generador Vite sumaba a los ingresos `payment_out_date.total_payments` (un conteo, bug); aquí esos pedidos aportan su `receivedValueOfClient`.

**Balance de Clientes (`/client-balances`)** — Sin mutaciones. Recalcula el balance **en vivo** por agregación (misma fórmula que `recalculate_balance`) y lo contrasta con la columna cacheada; tarjetas resumen (deuda total, saldo a favor total, clientes), filtro deuda/favor/al día, orden por mayor deuda primero, `BalanceBadge` (DEUDA roja / SALDO A FAVOR esmeralda / AL DÍA azul).

**Análisis (`/analytics`)** — Server arma 12 meses de series y 3 datasets agrupados; `analytics-charts.tsx` (client) renderiza: AreaChart apilado de 5 series con gradientes y selector de rango 12/6/3 meses, PieChart de órdenes por estado, BarChart de top tiendas, PieChart de gastos por categoría. Paleta 100 % naranja portada del admin Vite.

**Configuración** — Form de 2 campos (tasa de cambio, costo por libra) sobre el singleton CommonInformation; solo admin/accountant ven el form, el resto ve valores en lectura.

**Perfil** — `profile-forms.tsx`: formulario de datos personales (nombre, apellido, email, dirección) y formulario de cambio de contraseña propia (verifica la actual).

**Shell del admin** (`(admin)/layout.tsx`): sidebar + header + `<main>`; navegación en `admin-nav.tsx` (grupos: Dashboard / Gestión / Órdenes y Productos / Logística / Finanzas + inferior Configuración/Perfil, filtrada por rol), `mobile-nav.tsx` (drawer), `breadcrumbs.tsx` (mapa ruta→etiqueta/icono, detecta IDs numéricos/UUID para "Detalles de X"), `notifications-bell.tsx` (campana con polling de 60 s vía server action, badge animado, dropdown con dot de prioridad, marcar una/todas leídas), `sign-out-button.tsx`.

---

## 6. Server Actions y API routes

Única API route: `src/app/api/auth/[...nextauth]/route.ts` (Auth.js). Todo lo demás son **Server Actions** (`'use server'`). Convenciones comunes: retorno `ActionResult = { ok: true; id? } | { ok: false; error; fieldErrors? }`; guard `requireRole`/`requireStaff`; `parseId` (BigInt seguro, regex `^\d{1,19}$`); validación Zod con `zodFieldErrors`; traducción de errores Prisma `P2002` (único), `P2025` (no existe), `P2003` (FK); `revalidatePath` de las rutas afectadas.

| Action | Archivo | Qué hace | Modelos | Validaciones clave |
|---|---|---|---|---|
| `createOrderAction` / `updateOrderAction` | `(admin)/orders/actions.ts` | Alta/edición de orden; recalcula payStatus y balance de cliente (ambos clientes si cambia) | Order, CustomUser | `orderFormSchema`; ids válidos |
| `confirmOrderPaymentAction` | ídem | Pago acumulativo (`receivedValueOfClient += amount`, `balanceApplied += applyBalance`), payStatus recalculado o forzado a Pagado, `paymentDate` sellado; transaccional con recálculo de balance | Order, CustomUser | monto/saldo ≥ 0; saldo aplicado ≤ balance disponible del cliente |
| `deleteOrderAction` | ídem | Borra orden; recalcula balance | Order, CustomUser | P2003 → mensaje de vínculos |
| `createProductAction` / `updateProductAction` (→ `upsertProduct`) | ídem | Crea/edita producto con cascada de costos server-side (`computeProductCost`), deriva status, y `refreshOrderTotals` (transacción: suma `totalCost`, recomputa payStatus, recalcula balance) | Product, Order, CustomUser | `productFormSchema` |
| `deleteProductAction` | ídem | Borra producto + refresca totales de la orden | Product, Order | P2003 si tiene compras/recepciones/entregas |
| `createDeliveryAction` / `updateDeliveryAction` | `(admin)/delivery/actions.ts` | Alta/edición de entrega; deriva `weightCost` y `managerProfit` server-side, payStatus, gestión de `paymentDate` (sella al pasar de 0, preserva en ediciones, limpia si vuelve a 0); recalcula balance | DeliverReceip, Category, CustomUser | `deliveryFormSchema` |
| `createPreparedDeliveryAction` | ídem | Flujo `/delivery/prepare`: crea la entrega Y sus `ProductDelivery` en una sola transacción (deriva costos, recompute por producto, recalcula balance); si un producto ya no tiene unidades disponibles no se crea nada | DeliverReceip, ProductDelivery, Product, CustomUser | `preparedDeliverySchema`; sin duplicados; productos del cliente; `amount ≤ recibido − entregado` |
| `confirmDeliveryPaymentAction` | ídem | Pago acumulativo de entrega (espejo de `add_payment()`), transaccional | DeliverReceip, CustomUser | mismas que órdenes |
| `deleteDeliveryAction` | ídem | Borra entrega; recalcula balance | DeliverReceip | P2003 |
| `addDeliveredProductAction` / `removeDeliveredProductAction` | ídem | Alta/baja de `ProductDelivery` + `recomputeProductAmounts` | ProductDelivery, Product | entero > 0; `amount ≤ recibido − entregado` |
| `createPurchaseAction` / `updatePurchaseAction` / `deletePurchaseAction` | `(admin)/purchases/actions.ts` | CRUD de ShoppingReceip | ShoppingReceip | `purchaseFormSchema`; P2003 al borrar |
| `addBuyedProductAction` / `removeBuyedProductAction` | ídem | Alta/baja de `ProductBuyed` + recompute | ProductBuyed, Product | `amount ≤ pedido − comprado` |
| `refundBuyedProductAction` | ídem | Reembolso **acumulativo** (`quantityRefuned += q`, `refundAmount` increment, `isRefunded` si total), recompute | ProductBuyed, Product | `refundSchema`; `q ≤ comprado − ya reembolsado` |
| `createPackageAction` / `updatePackageAction` / `deletePackageAction` | `(admin)/packages/actions.ts` | CRUD de paquetes | Package | tracking único (P2002 → fieldError) |
| `setPackageStatusAction` | ídem | Cambio rápido de estado | Package | estado ∈ `PACKAGE_STATUSES` |
| `addReceivedProductAction` / `removeReceivedProductAction` | ídem | Recepción/eliminación de `ProductReceived` + recompute | ProductReceived, Product, Package | `amount ≤ comprado − recibido`; observación ≤ 200 |
| `registerArrivalsAction` | ídem | Lote de la fase «Revisar paquetes» de `/delivery/prepare`: N recepciones en un paquete en una sola transacción (+ recompute por producto) y cambio opcional de estado del paquete (Enviado → Recibido) | ProductReceived, Product, Package | `arrivalBatchSchema`; sin productos duplicados; `amount ≤ comprado − recibido` por ítem; observación ≤ 200 |
| `createUserAction` / `updateUserAction` | `(admin)/users/actions.ts` | CRUD usuarios; hash Django al crear | CustomUser | `createUserSchema`/`editUserSchema`; email/teléfono únicos |
| `changePasswordAction` | ídem | Reset de contraseña por admin (hash Django) | CustomUser | min 6 + confirmación |
| `toggleUserActiveAction` / `verifyUserAction` / `deleteUserAction` | ídem | Activar/desactivar, verificar (también activa), borrar (no a uno mismo) | CustomUser | P2003 |
| `createShopAction` / `updateShopAction` / `toggleShopActiveAction` / `deleteShopAction` | `(admin)/shops/actions.ts` | CRUD tiendas | Shop | nombre/link únicos |
| `addBuyingAccountAction` / `renameBuyingAccountAction` / `deleteBuyingAccountAction` | ídem | Cuentas de compra anidadas | BuyingAccounts | nombre 1–100; no borrar con compras |
| `createCategoryAction` / `updateCategoryAction` / `deleteCategoryAction` | `(admin)/categories/actions.ts` | CRUD categorías | Category | nombre único |
| `createBalanceAction` / `updateBalanceAction` / `deleteBalanceAction` | `(admin)/balance/actions.ts` | CRUD balances | Balance | `balanceFormSchema` (endDate ≥ startDate) |
| `calculateBalanceRangeAction` | `(admin)/balance/actions.ts` | Solo lectura: agrega el rango (órdenes, entregas, compras−reembolsos, facturas+tags, gastos) para prellenar el form del balance | — | `balanceRangeSchema`; fechas como días calendario UTC, fin inclusivo |
| `createExpenseAction` / `updateExpenseAction` / `deleteExpenseAction` | `(admin)/expenses/actions.ts` | CRUD gastos (sella `createdById`) | Expense | `expenseFormSchema` |
| `createInvoiceAction` / `updateInvoiceAction` / `deleteInvoiceAction` | `(admin)/invoices/actions.ts` | CRUD facturas; el servidor recalcula subtotales/total (nunca confía en el cliente); update = deleteMany tags + recreate en transacción | Invoice, Tag | `invoiceInputSchema` (superRefine por tipo de tag) |
| `updateCommonInfoAction` | `(admin)/settings/actions.ts` | Upsert del singleton | CommonInformation | ≥ 0 |
| `updateProfileAction` / `changeOwnPasswordAction` | `(admin)/profile/actions.ts` | Perfil propio; cambio de contraseña verificando la actual | CustomUser | email único; min 6 + match |
| `getNotificationsAction` / `markNotificationReadAction` / `markAllNotificationsReadAction` | `(admin)/notifications/actions.ts` | Lista 20 últimas no expiradas + contador; marca leídas **scoped al destinatario** | Notification | requireStaff |
| `uploadImageAction` | `src/app/actions/upload.ts` | Sube imagen a Cloudinary firmada server-side, devuelve `secure_url` | — | staff; ≤ 8 MB; `image/*` |

---

## 7. Lógica de negocio en lib/

**`src/lib/order-cost.ts`** — Núcleo financiero puro (testeado). Espejo del `calculateTotalCost` del admin Vite y del redondeo de `api/models/products.py`:

```
subtotal      = shopCost × amountRequested
base          = subtotal + shopDeliveryCost
baseTax       = chargeIva ? base × 0.07 : 0        (IVA 7 %)
shopTaxAmount = (base + baseTax) × (shopTaxes / 100)
totalCost     = base + baseTax + shopTaxAmount + addedTaxes + ownTaxes
```
Todo redondeado a 2 decimales con `round2(n) = Math.round((n + ε) × 100) / 100`. También:
- `computePayStatus(totalCosts, received, balanceApplied)`: `Pagado` si `received + balanceApplied ≥ totalCosts` con `totalCosts > 0` (regla Django: una orden de costo 0 nunca es "Pagado"); `Parcial` si pagado > 0; si no `No pagado`. Redondea antes de comparar (tolera ruido de coma flotante).
- `deriveProductStatus(...)` (ver §3).

**`src/lib/balance.ts`** — `recalculateClientBalance(clientId, tx?)`, re-implementación de `CustomUser.recalculate_balance()`:

```
balance = (Σ order.received_value_of_client + Σ delivery.payment_amount)
        − (Σ order.total_costs             + Σ delivery.weight_cost)
```
Nota documentada: `balance_applied` NO entra en la suma (solo cuenta el efectivo realmente recibido, igual que el agregado Django). Si no recibe `tx`, envuelve lectura+escritura en su propia transacción para evitar interleaving.

**`src/lib/product-status.ts`** — `recomputeProductAmounts(productId, tx?)`: agrega `ProductBuyed`/`ProductReceived`/`ProductDelivery`, deriva el estado y actualiza el producto (con `Math.max(0, purchased)`). Debe llamarse tras cualquier mutación de esas tablas hijas (sustituye a los signals de Django).

**`src/lib/action-helpers.ts`** — `ActionResult`/`ActionFailure`, `STAFF_ROLES`, `ROLES` (mapa dominio→roles, fuente: role-config del admin Vite), `requireRole`/`requireStaff` (leen la sesión con `auth()`), `zodFieldErrors` (aplana issues a `{ "campo.path": mensaje }`), `parseId` (BigInt defensivo).

**`src/lib/pagination.ts`** — `PAGE_SIZE_OPTIONS = [5,10,20,50,100]`, default 10; `parsePagination({page, per})` → `{page, perPage, skip}` con saneo estricto.

**`src/lib/format.ts`** — `formatCurrency` (`$` + `toFixed(2)`, sin separador de miles) y `formatDate` (es-ES `dd/mm/aaaa`).

**`src/lib/password.ts`** — Interop de contraseñas con Django: `hashDjangoPassword` produce `pbkdf2_sha256$<iter>$<salt>$<b64>` (600 000 iteraciones por defecto, salt base64 saneado de 22 chars sin `$`), `verifyDjangoPassword` parsea el formato, deriva con PBKDF2-HMAC-SHA256 y compara con `timingSafeEqual`; rechaza formatos malformados sin lanzar.

**`src/lib/cloudinary.ts`** — Upload server-side firmado (SHA-1 de params ordenados + `API_SECRET`); el secreto nunca llega al cliente. `isCloudinaryConfigured()` permite operar sin Cloudinary (los campos de imagen fallan con toast). Carpeta configurable (`CLOUDINARY_FOLDER`, default `ar-e-admin`).

**`src/lib/prisma.ts`** — Singleton de `PrismaClient` con `PrismaNeon` adapter y `ws` como WebSocket; cachea en `globalThis` fuera de producción (hot-reload safe).

**`src/lib/providers.tsx`** — `SessionProvider` de next-auth + `<Toaster position="top-right" richColors />` de sonner.

**`src/lib/route-roles.ts`** — ver §4.

Otras fórmulas de negocio que viven en actions/páginas:
- Entregas (`delivery/actions.ts`): `weightCost = weight × category.clientShippingCharge`; `managerProfit = weight × client.assignedAgent.agentProfit` (0 sin agente). La fórmula es autoritativa (no hay override manual, a diferencia de Django/Vite).
- Facturas (`invoices/schema.ts`): `subtotal(pesaje) = weight × costPerLb + fixedCost`; `subtotal(nominal) = fixedCost`; `total = Σ subtotales` (recalculado en servidor).
- Dashboard: `ganancia = ingresos(órdenes + entregas) − compras − gastos`; `margen = ganancia / ingresos`.
- Analytics: `system_profit = revenue − product_expenses − delivery_expenses(weight × costPerPound) − agent_profits` por mes.

---

## 8. Flujos de negocio implementados

**Pedidos (órdenes):**
1. Admin/agente crea la orden (`/orders` → "Nueva orden"): cliente, gestor opcional, estado, pago inicial. Redirige al detalle si se crea.
2. En `/orders/[id]` añade productos; el formulario muestra la cascada de costos en vivo y el servidor la recalcula (fuente de verdad).
3. Cada alta/edición/borrado de producto dispara `refreshOrderTotals` (total de orden + payStatus + balance del cliente, en transacción).
4. El estado del producto arranca en `Encargado` y evoluciona solo por compras/recepciones/entregas.

**Compras:**
1. Admin crea la compra (`/purchases`): tienda → cuenta de compra de esa tienda, estado de pago, tarjeta, fecha, costo total.
2. En `/purchases/[id]` asocia productos de esa tienda (tope: pedido − comprado). Esto incrementa `amountPurchased` y puede pasar el producto a `Comprado`.
3. Reembolsos parciales/total acumulativos que revierten cantidades y estado.

**Paquetes / recepción:**
1. Logístico crea el paquete (agencia, tracking único, estado, fecha de llegada, foto Cloudinary).
2. Cambia el estado inline en la tabla (Enviado → Recibido → Procesado).
3. En `/packages/[id]` registra recepciones (tope: comprado − recibido) → producto pasa a `Recibido` y queda disponible para entregas. Flujo recomendado: la fase «Revisar paquetes» de `/delivery/prepare` hace lo mismo en lote — checklist multi-producto sobre el paquete abierto (`registerArrivalsAction`), pensada para paquetes que llegan incompletos: lo no marcado sigue pendiente y se recibe cuando llegue en otro paquete/división.

**Entregas:**
1. Logístico crea la entrega: cliente, categoría, peso → `weightCost` y `managerProfit` derivados; foto opcional; pago inicial opcional.
2. En `/delivery/[id]` añade productos entregados (tope: recibido − entregado) → producto puede pasar a `Entregado`.
3. Pago vía `PaymentPanel` (igual que órdenes).
4. Flujo recomendado: `/delivery/prepare` en 2 fases. Fase 1 «Revisar paquetes»: se abre cada paquete pendiente y se marca qué productos llegaron y cuántas unidades (`registerArrivalsAction` en lote; un producto puede llegar repartido en varios paquetes — p. ej. 150 compradas que llegan 95 + 25 + 20). Fase 2 «Armar entregas»: lo recibido sin entregar agrupado por cliente (procedencia con unidades por paquete, todo preseleccionado, avisos de unidades «en camino» para decidir entregas parciales), y `createPreparedDeliveryAction` crea la entrega con sus productos en una sola transacción; redirige a `/delivery/[id]`. Se pueden crear varias entregas sucesivas al mismo cliente según va llegando la mercancía.

**Pagos (órdenes y entregas):**
1. Botón `$` en la fila → `PaymentPanel`: costo pendiente vs saldo disponible del cliente.
2. Monto en efectivo + toggle "aplicar saldo del cliente" (aplica `min(saldo, pendiente − monto)`) + opción de marcar Pagado manualmente.
3. Resumen en vivo: % cubierto con barra de progreso, faltante, excedente al saldo, saldo resultante.
4. El server acumula (`+=`), valida el saldo disponible dentro de la transacción y recalcula el balance.

**Balance de cliente:** recalculado tras cada mutación de orden/entrega (`recalculateClientBalance`); `/client-balances` lo audita en vivo contra la columna cacheada.

**Usuarios:** alta con contraseña Django-compatible, edición, verificación, activación, reset de contraseña, borrado protegido; asignación de agente con `agentProfit` (alimenta `managerProfit` de entregas).

**Tiendas:** CRUD + cuentas de compra (prerequisito del flujo de compras); `taxRate` de la tienda pre-rellena `shopTaxes` del formulario de producto.

**Estado del port respecto al admin Vite** (rutas Vite en `apps/admin/src/routes/AppRoutes.tsx`):
- ✅ Portado: login, dashboard (métricas), users, shops (+cuentas), categories, orders + detalle + productos, products (lista), purchases + detalle (add/manage/refund consolidados en `/purchases/[id]`), packages + detalle (recepción consolidada), delivery + detalle (gestión consolidada), invoices, expenses, balance, client-balances, analytics, settings, profile, unauthorized, notificaciones (campana), pagos con saldo.
- ⚠️ Faltante/incompleto:
  - **`/products/:id` (detalle de producto)** existe en Vite y no aquí (aquí solo lista con selector de columnas).
  - **Imágenes de producto** (`imageUrl`, `productPictures` existen en el schema) no se exponen en ningún formulario.
  - Las páginas dedicadas de Vite `balance/new-balance`, `delivery/new`, `packages/new`, `*/edit` se sustituyeron por diálogos (decisión de diseño, no gap funcional). El generador de balance por rango de `balance/new-balance` se reintrodujo dentro del diálogo de balance (`calculateBalanceRangeAction`); quedan fuera los paneles analíticos extensos y el historial de operaciones de tarjeta de esa página.
  - **Operaciones de tarjeta** (`/cards/operations/` del backend; `cardId` en compras es solo texto) no portadas.
  - **Override manual de `weight_cost`/`manager_profit`** en entregas (posible en Django/Vite): aquí la fórmula es siempre autoritativa.
  - **Creación de notificaciones**: solo lectura/marcado; las genera Django.
  - Scraping de Amazon, subida de imagen genérica del backend y reportes del backend (`/api_data/reports/*`) no aplican/no existen aquí (Analytics los reemplaza con agregación propia).

---

## 9. Sistema de diseño y UI actual

*(Sección clave para el rediseño: describe el estado real, incluidas sus inconsistencias.)*

### 9.1 Tokens y globals.css

`src/app/globals.css` importa Tailwind v4 (`@import "tailwindcss"`) y define los tokens **portados del admin Vite** (`apps/admin/src/index.css`): app claramente **light-only**, naranja de marca, sidebar casi negro.

Variables en `:root`:

| Token | Valor | Uso |
|---|---|---|
| `--radius` | `0.75rem` | Base de `--radius-sm/md/lg/xl` (lg = 0.75rem) |
| `--background` | `oklch(99% 0 0)` | Fondo de página |
| `--foreground` | `oklch(25% 0.01 270)` | Texto |
| `--card` / `--card-foreground` | blanco / gris muy oscuro | Cards |
| `--primary` | `oklch(71.065% 0.15929 64.92)` | **Naranja AR-E** (mismo del login) |
| `--primary-foreground` | blanco | |
| `--brand` | `var(--primary)` | Alias usado por los botones (`bg-brand`) |
| `--brand-strong` | `oklch(64% 0.17 60)` | Hover de botones (`hover:bg-brand-strong`) |
| `--secondary` / `--muted` / `--muted-foreground` | grises fríos | |
| `--accent` | `oklch(88% 0.08 45)` (melocotón claro) | hover de paginación |
| `--destructive` | `oklch(58% 0.2 25)` | |
| `--border` | `oklch(87% 0.005 270)` | |
| `--input` | `oklch(96% 0.005 270)` | |
| `--ring` | `oklch(62% 0.2 40)` | |
| `--chart-1..5` | 5 tonos naranja/gris en oklch | Definidos pero **no consumidos** (Recharts usa HSL hardcodeados) |
| `--sidebar` | `hsl(240 5.9% 10%)` | Fondo sidebar (casi negro) |
| `--sidebar-foreground` | `hsl(240 4.8% 95.9%)` | |
| `--sidebar-primary` | `hsla(0,0%,41%,0.679)` | |
| `--sidebar-accent` | `hsl(31, 81%, 54%)` | **Naranja del item activo** |
| `--sidebar-border` | `hsl(240 3.7% 15.9%)` | |
| `--sidebar-ring` | `hsl(29, 95%, 64%)` | |

El bloque `@theme inline` mapea cada variable a colores Tailwind (`--color-background`, `--color-brand`, `--color-sidebar-accent`, etc.), de modo que existen utilidades `bg-background`, `text-muted-foreground`, `bg-brand`, `bg-sidebar`, `border-border`, `focus:border-brand`, etc. También define `--font-sans: var(--font-inter)` y `--font-mono: var(--font-geist-mono)`.

Extras globales: **scrollbar naranja** (webkit, thumb `var(--primary)`, hover `var(--accent)`), y override de fuente/peso para toasts de sonner (`[data-sonner-toast]` → Inter, título 600).

### 9.2 Tipografía e iconos

- **Inter** (variable `--font-inter`, `next/font/google`) como sans para todo; **Geist Mono** cargada como mono (solo usada implícitamente en clases `font-mono` de trackings/IDs). Configuradas en `src/app/layout.tsx` (`lang="es"`, `antialiased`).
- Iconos: **lucide-react** en todas partes (nav, badges, botones, empty states). Tamaños típicos `h-4 w-4` (acciones), `h-5 w-5` (header), `h-8 w-8 text-orange-400` (títulos de página).
- Jerarquía de títulos de página: `h1` `text-3xl font-bold text-gray-900` + icono naranja + subtítulo `text-gray-600`; secciones `text-lg font-semibold tracking-tight`.

### 9.3 Layout del shell admin

`src/app/(admin)/layout.tsx`:
- **Sidebar** (`aside`): `hidden md:flex w-64 shrink-0 bg-sidebar text-sidebar-foreground`; cabecera con logo (h-16, borde inferior `border-orange-400`); `AdminNav` con grupos titulados en `text-[13px] font-semibold uppercase tracking-wide text-orange-400/85`; items `rounded-md px-3 py-2 text-[15px]`, activo = `bg-sidebar-accent text-white font-medium`, hover = `bg-white/10`; pie con avatar de iniciales en gradiente `from-orange-400 to-amber-500` y chip de rol `bg-white/10`.
- **Header**: `h-16 sm:h-20`, `bg-background/95 backdrop-blur-sm shadow-sm border-b`; contiene `MobileNav` (hamburguesa `md:hidden`), `Breadcrumbs` (Home + chevrons SVG naranjas inclinados, iconos por ruta, oculta crumbs en `<sm`), `NotificationsBell` y `SignOutButton`.
- **Main**: `min-h-0 flex-1 overflow-auto bg-background p-3 sm:p-6 xl:p-10`.
- **MobileNav** (`mobile-nav.tsx`): overlay `bg-black/50` + drawer izquierdo `w-72 max-w-[85vw] bg-sidebar` con el mismo `AdminNav`; bloquea scroll del body mientras está abierto.

### 9.4 Componentes compartidos (`src/components/`)

| Componente | Descripción visual/funcional |
|---|---|
| `filter-popover.tsx` | Botón "Filtrar" (borde, icono `Filter`, contador en círculo `bg-orange-500`) + popover absoluto `w-[min(420px,calc(100vw-2rem))] rounded-xl shadow-xl` con título/subtítulo, campos hijos (aplican al cambiar), chips de filtros activos (`bg-orange-50 text-orange-700` con X), footer "Limpiar"/"Aplicar" (`bg-brand`). Cierre por click fuera (listener `pointerdown` manual, sin Radix). |
| `table-pagination.tsx` | Barra "Mostrar N filas de X" + paginación URL-driven (`?page`/`?per`), hasta 5 números con elipsis; página activa `border-orange-400 bg-orange-50 text-orange-600`; en móvil se colapsa a "actual / total". |
| `status-badges.tsx` | Pills `inline-flex gap-1 px-2 py-1 rounded-full border text-xs font-semibold` con icono lucide, portadas 1:1 del Vite: `OrderStatusBadge` (Encargado azul/Procesando amarillo/Completado verde/Cancelado rojo), `PayStatusBadge` (No pagado rojo/Parcial amarillo/Pagado verde), `DeliveryStatusBadge` (Pendiente gris/En tránsito azul/Entregado verde/Fallida rojo), `PackageStatusBadge`, `ProductStatusBadge` (Entregado cian), y `PurchasePayBadge` (variante **sólida sin borde**: rojo-400/verde-500/amarillo-400). Patrón: `bg-{color}-100 text-{color}-800 border-{color}-300`. |
| `payment-panel.tsx` | Modal de pago (descrito en §8): tarjetas de costo pendiente/saldo (labels `text-[10px] font-bold uppercase tracking-widest`), input con prefijo `$`, toggle de saldo estilo card (`border-orange-300 bg-orange-50` activo), barra de progreso con gradiente `from-orange-400 to-amber-500`, `dl` de resumen con `tabular-nums`, footer Cancelar/Confirmar. |
| `image-upload-field.tsx` | Dropzone-botón punteado (`border-dashed`, icono `Upload`), sube vía server action, luego muestra thumbnail 14×14 + URL truncada + botón quitar; guarda la URL en un `input hidden` del formulario contenedor. |
| `picture-hover.tsx` | Celda "Captura": thumbnail 8×8 `rounded-md` que revela preview 32×32 flotante en hover (grupo CSS, sin JS); icono `Camera` gris si no hay imagen. |
| `qr-link.tsx` | Botón mini QR que abre popover con `react-qrcode-logo` (estilo `dots`, `eyeRadius 6`, logo `/icon-192.png` inset) + URL truncada; fallback `https://arye-shipps.netlify.app`. |

### 9.5 Patrones de UI recurrentes (hechos a mano)

- **Diálogos/modales**: siempre `div fixed inset-0 z-50 flex items-center justify-center bg-black/50` con `role="dialog" aria-modal`, cierre al click en el backdrop (`e.target === e.currentTarget`), panel `rounded-xl border bg-white shadow-xl max-w-{sm|md|lg|2xl}`. **Sin focus-trap, sin Escape, sin portal, sin animación de entrada.**
- **Popovers/dropdowns** (filtros, QR, campana): posicionamiento `absolute` + cierre por `pointerdown` fuera vía `useEffect`.
- **Tablas**: contenedor `overflow-hidden rounded-lg border bg-white`; `thead` `bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500`; filas `divide-y`; números con `tabular-nums`. **Doble render responsive**: tabla `hidden md:block` (o `lg:`) + lista de cards `md:hidden` con la misma data.
- **Formularios**: inputs/selects nativos `rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand` (el login usa una variante más grande `h-12 rounded-xl` con `focus:ring-2 ring-brand/30`); errores de campo `text-xs text-red-600` bajo el input y borde `border-red-500`; envío con `useActionState` + botón `bg-brand ... hover:bg-brand-strong disabled:opacity-*` con texto "Guardando…".
- **Botón primario estándar**: `inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-strong`.
- **Acciones de fila**: iconos ghost `rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100` (rojo al hover para eliminar, verde para pago).
- **Feedback**: toasts sonner en cada éxito/error; estados vacíos como celda centrada "No hay X." (a veces "Cargando…" si hay transición pendiente).
- **Transiciones existentes**: casi todo se limita a `transition`/`transition-colors` de hover. Piezas con más movimiento: campana (badge `animate-ping`, icono `group-hover:scale-110`), metric cards del dashboard (`hover:-translate-y-0.5`, círculo `group-hover:scale-110`), tarjeta de tasa (`hover:-translate-y-1 hover:shadow-lg`), flecha del login (`group-hover:translate-x-0.5`), spinners `animate-spin`. **Ojo**: el dashboard usa clases `animate-in fade-in slide-in-from-top/bottom duration-*` que pertenecen al plugin `tailwindcss-animate`/`tw-animate-css`, **que no está instalado** — hoy no generan CSS (no hay animación real de entrada).

### 9.6 Paleta en la práctica e inconsistencias (relevante para el rediseño)

- Conviven **cuatro escalas de gris**: `gray-*` (títulos/subtítulos de página, dashboard), `zinc-*` (tablas, diálogos, inputs de la mayoría de dominios), `slate-*` (login) y tokens (`text-muted-foreground`, `border-border`) — sin criterio unificado.
- El naranja aparece tanto como token (`bg-brand`) cuanto hardcodeado (`text-orange-400`, `bg-orange-500`, `border-orange-400`, gradientes `from-orange-400 to-amber-500`, HSL en Recharts). Los tokens `--chart-*` no se usan.
- Muchos componentes llevan variantes `dark:*` (zinc-950, etc.) heredadas del scaffolding, pero **no existe modo oscuro**: no hay toggle ni definición de tokens dark; el `body` fuerza fondo claro. Las clases `dark:` son código muerto en la práctica.
- Textos de UI mezclan español e inglés (ver §12).
- Breakpoint de colapso tabla→cards inconsistente: `lg:` en órdenes, `md:` en el resto.
- PWA: manifest standalone con `theme_color #e8772e` y `background_color #1c1c1f`; iconos generados por `scripts/gen-icons.mjs`.

---

## 10. Configuración, entorno y despliegue

**Variables de entorno** (`.env.local.example`):

| Variable | Notas |
|---|---|
| `DATABASE_URL` | Neon Postgres **pooled** (compartida con Django). Necesaria también en build (prisma generate + `prisma.config.ts`) |
| `AUTH_SECRET` | `openssl rand -base64 32`; firma el JWT en ambas instancias NextAuth |
| `AUTH_URL` | Solo en local (`http://localhost:5175`); en Vercel se infiere (`trustHost: true`) — **no** setearla salvo dominio custom fijo |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET/FOLDER` | Opcionales; sin ellas la subida de imágenes devuelve error controlado (toast). Folder default `ar-e-admin` |

**Scripts** (`package.json`): `dev`/`start` en puerto 5175; `build` = `prisma generate && next build`; `postinstall` = `prisma generate`; `lint`, `type-check`, `test` (vitest run).

**`prisma.config.ts`**: hace que la CLI de Prisma lea `.env.local` (dotenv), fija schema y ruta de migraciones (carpeta que hoy no existe) y el datasource URL.

**`vercel.json`**: framework nextjs, `buildCommand: prisma generate && next build`.

**`DEPLOY.md`** (resumen): (1) rotar credenciales filtradas (password Neon y `ADMIN_CREATION_SECRET_KEY` de Django) antes de desplegar; (2) proyecto Vercel con Root Directory `apps/admin-next` (workspace pnpm autodetectado); (3) env vars arriba para Production y Preview; (4) deploy por push o `vercel --prod`; (5) smoke test: `/login` con usuario Django, `/dashboard`, `/orders`, `/orders/[id]`, `/analytics`, crear orden + producto, subir imagen. Gotchas: BD compartida (no `prisma migrate`; `prisma db pull` para sincronizar), funciones en Node.js/Fluid Compute, `serverExternalPackages` para Neon+ws, `outputFileTracingRoot` monorepo.

**`scripts/gen-icons.mjs`**: one-off que rasteriza `public/logo.svg` a `favicon.ico`, `icon.png`, `apple-icon.png`, `icon-192/512.png` con sharp + png-to-ico.

**`AGENTS.md` / `CLAUDE.md` locales**: `CLAUDE.md` solo referencia `@AGENTS.md`; éste contiene la advertencia generada de Next 16 ("This is NOT the Next.js you know": leer `node_modules/next/dist/docs/` antes de escribir código, respetar deprecations). `README.md` es el boilerplate de create-next-app (sin valor documental).

---

## 11. Tests existentes

Runner: **Vitest** (`vitest.config.ts`: alias `@ → src`, entorno `node`, patrón `src/**/*.test.ts`). Solo hay tests unitarios de la lógica financiera y de contraseñas — no hay tests de componentes, actions ni E2E.

- **`src/lib/order-cost.test.ts`**: `round2` (redondeo a 2 decimales, negativos); `computeProductCost` (cascada sin IVA/tasas, IVA 7 % sobre base y tarifa de tienda sobre base+IVA con verificación del redondeo binario 32.425→32.42 idéntico al `round()` de Python, montos cero); `computePayStatus` (Pagado con cobertura, mezcla efectivo+saldo, Parcial, No pagado, regla `tc > 0` — una orden de costo 0 nunca es Pagado —, tolerancia a ruido de coma flotante 0.1+0.2); `deriveProductStatus` (todas las transiciones Encargado→Comprado→Recibido→Entregado y reversión tras reembolso total).
- **`src/lib/password.test.ts`**: formato pbkdf2_sha256 de 4 partes con digest de 32 bytes, salt aleatorio por hash, round-trip verificar/rechazar, vector estilo Django, y rechazo sin excepción de hashes malformados (vacío, texto plano, algoritmo distinto, iteraciones 0/no numéricas, hash vacío, partes extra). Usa 1 000 iteraciones para velocidad.

---

## 12. Estado del port y deuda técnica

No hay marcadores `TODO/FIXME/HACK` en `src/` — la deuda es estructural, no anotada.

**Funcionalidad faltante vs apps/admin** (ver también §8):
- Sin página de detalle de producto (`/products/:id` del Vite).
- Campos de imagen de producto (`imageUrl`, `productPictures`) sin UI.
- Operaciones de tarjeta no portadas (`cardId` es texto libre).
- Sin override manual de `weight_cost`/`manager_profit` en entregas.
- Notificaciones solo-lectura (Django es el productor).

**Bugs/inconsistencias detectadas en el código:**
- `order-dialog.tsx` (línea ~96): al **editar** una orden, el select "Gestor de venta" siempre usa `defaultValue=""` — el gestor asignado no se preselecciona y guardar sin tocarlo lo borra (`OrderRow` ni siquiera transporta `salesManagerId`).
- Clases de animación `animate-in`/`fade-in`/`slide-in-from-*` (dashboard, greeting) sin el plugin `tailwindcss-animate` instalado → no producen CSS.
- Cientos de variantes `dark:` sin modo oscuro real (código muerto que ensucia el markup y confundirá al rediseño).
- Mezcla de idiomas en la UI: "Open/Edit/Delete" (tabla de órdenes móvil), "Client/Status/Observations (optional)" (order-dialog), "Change rate" (settings), "Bought", "No invoices yet.", "Weight (sys / reg)" (balance), "Upload an image"/"Image uploaded" (upload), mensajes de error de actions mayormente en inglés mientras los de pago están en español.
- Cuatro escalas de gris (gray/zinc/slate/tokens) y naranja duplicado token-vs-hardcode (ver §9.6); breakpoints de colapso responsive inconsistentes (`lg:` vs `md:`).
- `formatCurrency` sin separador de miles (el dashboard usa su propio `fmt` con `toLocaleString` — dos formatos de moneda conviviendo).
- Listas sin paginación server: `invoices`, `balance`, `categories`, `shops`, `client-balances` (cap `take: 1000` y filtrado en memoria); dropdowns de clientes con `take: 1000` y candidatos de compra con `take: 500` — límites silenciosos si el negocio crece.
- Los tokens `--chart-*` no se consumen; Recharts usa HSL literales.
- `PictureHover`/`ImageUploadField` aceptan cualquier URL almacenada, pero `next.config.ts` solo permite `res.cloudinary.com` en `next/image` — imágenes históricas de otros hosts romperían el render.

**Riesgos arquitectónicos a vigilar:**
- **Doble escritor de la BD**: Django (signals) y admin-next (lib/) deben mantenerse en paridad; cualquier cambio en las fórmulas de `api/models/*` o `api/signals.py` exige replicarlo en `src/lib/*`. El esquema solo debe evolucionar desde Django (`prisma db pull` aquí; no hay migraciones Prisma).
- La columna `CustomUser.balance` puede quedar obsoleta si Django y admin-next escriben concurrentemente entre agregado y update (mitigado con transacciones locales, no entre procesos); `/client-balances` sirve de auditoría.
- `next-auth` está en beta (5.0.0-beta.31) y Next 16 introduce convenciones nuevas (`proxy.ts`, docs embebidas) — revisar breaking changes al actualizar.
- Credenciales: `DEPLOY.md` documenta que hubo secretos filtrados que requieren rotación; verificar que se hizo antes de cualquier despliegue nuevo.

**Puntos fuertes a conservar en el rediseño:**
- Separación limpia server/client (RSC data-fetching + `*-client.tsx` de presentación) y validación Zod centralizada por dominio (`schema.ts`).
- Lógica financiera pura, testeada y documentada con referencias línea-a-línea a Django.
- RBAC en tres capas coherente con el admin Vite.
- Filtros/paginación URL-driven (estado compartible y compatible con SSR), buena base para cualquier rediseño de tablas.
