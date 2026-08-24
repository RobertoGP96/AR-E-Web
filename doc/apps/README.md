# Documentación de las aplicaciones — AR&E Shipps

Referencia completa de las tres aplicaciones del monorepo, generada por lectura directa del código (agosto 2026). Objetivo: preservar los flujos y descripciones de cada app para mantenimiento y desarrollos futuros (en particular, el rediseño del design system de `apps/admin-next`).

| Documento | App | Resumen |
|---|---|---|
| [client.md](client.md) | `apps/client` | App pública para clientes (React 19 + Vite + shadcn/ui). Landing, precios/calculadora, tiendas, registro/login por teléfono, lista local de productos, seguimiento de órdenes y entregas. Consume la API Django (`/arye_system/`). |
| [admin.md](admin.md) | `apps/admin` | Panel de administración original (React 19 + Vite + shadcn/ui + TanStack Query). Fuente de verdad de los flujos de negocio y del RBAC. Consume la API Django. |
| [admin-next.md](admin-next.md) | `apps/admin-next` | Port del panel a Next.js 16 (App Router + Prisma + NextAuth v5). **No usa la API Django**: escribe directamente la misma BD Neon Postgres y replica los signals de Django en `src/lib/`. Es la app objetivo del rediseño de design system. |

## El negocio en una vista

AR&E Shipps compra por encargo en tiendas online (Shein, Amazon, Temu…) y entrega en Cuba. El ciclo completo:

```
Cliente (apps/client)                    Panel admin (apps/admin / admin-next)
─────────────────────                    ─────────────────────────────────────
Se registra (rol client)          →      Agente crea la ORDEN con sus PRODUCTOS
Arma lista local de productos            (estado producto: Encargado)
                                                    │
                                         Admin registra la COMPRA (ShoppingReceip
                                         + ProductBuyed) → producto: Comprado
                                                    │
                                         Logístico recibe el PAQUETE (Package
                                         + ProductReceived) → producto: Recibido
                                                    │
Sigue sus órdenes y entregas      ←      Logístico crea la ENTREGA (DeliverReceip
(solo lectura)                           + ProductDelivery) → producto: Entregado
                                                    │
                                         Contador: pagos (efectivo + saldo del
                                         cliente), facturas courier, gastos,
                                         balances y reportes
```

### Estados canónicos compartidos

- **Orden**: `Encargado → Procesando → Completado | Cancelado`
- **Producto**: `Encargado → Comprado → Recibido → Entregado` (derivado de cantidades agregadas)
- **Pago** (orden/entrega/compra): `No pagado | Parcial | Pagado`
- **Entrega**: `Pendiente → En transito → Entregado | Fallida`
- **Paquete**: `Enviado → Recibido → Procesado`

### Fórmulas de negocio clave (idénticas en Django, admin Vite y admin-next)

- **Costo de producto**: `base = shop_cost×cantidad + envío`; `+7% IVA` si aplica; `+tarifa de tienda` sobre (base+IVA); `+impuestos adicionales/propios`. Redondeo a 2 decimales.
- **Entrega**: `weight_cost = peso × client_shipping_charge` (cobro al cliente); `manager_profit = peso × agent_profit` del agente asignado; ganancia del sistema = `weight_cost − manager_profit − (peso × shipping_cost_per_pound)`.
- **Balance del cliente**: `(Σ pagos de órdenes + Σ pagos de entregas) − (Σ costos de órdenes + Σ weight_cost de entregas)`; `balance_applied` no suma como efectivo.
- **Estado de pago**: `Pagado` si `recibido + saldo aplicado ≥ costo` (y costo > 0); `Parcial` si > 0; si no `No pagado`.

## Roles

| Rol | client (app) | admin: alcance |
|---|---|---|
| `admin` | — | Todo |
| `agent` | — | Usuarios, órdenes/productos de sus clientes, entregas (lectura) |
| `accountant` | — | Facturas, gastos, balances, balance de clientes, análisis |
| `logistical` | — | Productos, paquetes, entregas |
| `client` | Toda la app cliente | Sin acceso al panel (logout forzado) |

## Advertencias operativas críticas

1. **BD compartida** entre Django y admin-next: el esquema solo evoluciona desde Django (migraciones Django); en admin-next se sincroniza con `prisma db pull`. **Nunca** `prisma migrate` contra la BD.
2. **Doble escritor**: cualquier cambio en fórmulas de `backend/api/models/*` o `backend/api/signals.py` debe replicarse en `apps/admin-next/src/lib/` (order-cost, balance, product-status) y viceversa.
3. **Typos consolidados en la API Django**: `delivery_receips`, `shopping_reciep` — no "corregir" sin coordinar backend + ambos frontends.
4. Puertos dev: admin Vite 5173, client 5174 (⚠️ su vite.config fija 5173 — conflicto conocido), admin-next 5175.

Cada documento incluye una sección final de deuda técnica y bugs conocidos; revisarla antes de tocar el área correspondiente.
