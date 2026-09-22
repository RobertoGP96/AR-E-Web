# Matriz de conformidad

Estado de cada regla, invariante y máquina de estados en las cuatro implementaciones. Fecha de evaluación: 2026-09-22 (versión 1.0.0 de la especificación).

Leyenda: ✅ cumple · ❌ no cumple (con identificador del bug del plan: B* Django, N* admin-next, C* contradicciones documentales/cliente/Vite) · N/A no aplica (la app no implementa esa operación) · ⏳ pendiente de implementar (regla nueva).

**Las ❌ y ⏳ de admin-next se corrigen en las fases 1 a 4 del plan de rediseño** (ADR-0001 a ADR-0006; fase 1 compras, fase 2 recepción y paquetes, fase 3 entregas y RN-011, fase 4 endurecimiento transaccional); cada fase actualiza esta matriz y el `CHANGELOG.md`. Las ❌ de Django, admin Vite y app cliente quedan como deuda documentada (ADR-0001).

## Reglas de costos

| Regla | Django API | admin-next | admin Vite | app cliente | Test |
|---|---|---|---|---|---|
| RN-001 costo de producto | ✅ `api/models/shops.py` `_calculate_product_cost`, `api/services/purchases_service.py`; rounding `api/models/products.py:78-88` | ✅ `src/lib/order-cost.ts` `computeProductCost` | ✅ `src/components/products/ProductForm.tsx` `calculateTotalCost` | N/A (solo muestra `total_cost`; moneda ARS en detalle, bug de presentación) | `spec-cases.test.ts` RN-001; `test_spec_cases.py::ProductCostSpecCasesTest` |
| RN-002 costo por peso | N/A (lo recibe del cliente) | ✅ `delivery/actions.ts` `deriveCosts` | ✅ `delivery-form.tsx` (❌ precedencia `\|\| 0 - cost` en líneas 233/243 puede dar valores erróneos) | N/A (no muestra pago de entrega, C-tipo sin `payment_status`) | pendiente (función no pura; fase 3 añade test de `registerBagWeightAction`) |
| RN-003 comisión gestor | N/A | ✅ `delivery/actions.ts` `deriveCosts` (agente asignado al cliente) | ✅ `delivery-form.tsx` | N/A | idem RN-002 |
| RN-004 estimación compra parcial | ✅ `shops.py:79-112`, `purchases_service.py` | ⏳ `estimatePurchaseCost` / `estimateBuyedCost` en `order-cost.ts` (fase 1) | ❌ `purshase-form` usa `total_cost` siempre | N/A | `test_spec_cases.py::test_rn_004_*`; `order-cost.test.ts` (fase 1) |

## Reglas de estados

| Regla | Django API | admin-next | admin Vite | app cliente | Test |
|---|---|---|---|---|---|
| RN-010 estado de producto derivado | ✅ `api/signals.py` `_determine_product_status`, `services/product_status_service.py` (❌ B4 compra parcial documentada como limitación, no incumplimiento; ❌ B9-B14 `mark_purchased/received/delivered` no persisten) | ✅ `src/lib/order-cost.ts` `deriveProductStatus` + `src/lib/product-status.ts` | ✅ vía API | ❌ C16/C18 tipos `ProductStatus` con valores de orden (`Procesando`, `Completado`, `Cancelado`) | `spec-cases.test.ts` RN-010; `test_spec_cases.py::ProductStatusSpecCasesTest`; `test_product_status_signals.py` |
| RN-011 solo cuentan entregas `Entregado` | ❌ cuenta todas las `ProductDelivery` (ADR-0005, deuda) | ⏳ ❌ N1: producto pasa a `Entregado` al embolsar (fase 3, `product-status.ts` `deliveredFinal`) | ❌ vía API (misma deuda que Django) | ❌ muestra el estado que llega | `spec-cases.test.ts` RN-011 (función pura); `test_spec_cases.py` (función pura) |
| RN-012 estado de orden derivado | ✅ `api/models/orders.py:70-127` (❌ B26 borrar producto no recalcula) | ❌ N4: `Order.status` manual, ninguna action deriva (fases 3-4) | ✅ vía API (❌ `markOrderAsCompleted/cancelOrder` envían `completed`/`cancelled`, B8/B15 rechazados) | ❌ claves internas inglesas (`procesing`, `canceled`) mapeadas a mano | `test_product_status_signals.py` (Django); pendiente en admin-next |

## Reglas de pagos

| Regla | Django API | admin-next | admin Vite | app cliente | Test |
|---|---|---|---|---|---|
| RN-020 estado de pago | ✅ `orders.py` `add_received_value`/`save`, `deliveries.py` `add_payment_amount` (❌ B3 no recalcula al cambiar `total_costs`; ❌ B24 estado manual congela) | ✅ `order-cost.ts` `computePayStatus`, `refreshOrderTotals`, `confirm*PaymentAction` | ❌ `ConfirmPaymentDialog` envía `pay_status: "Pendiente"` (valor inexistente) y calcula sin redondeo; C13 `calculatePaymentStatus` es código muerto | ❌ etiquetas `paid/unpaid/partial`; no muestra `payment_status` de entrega | `spec-cases.test.ts` RN-020; `test_spec_cases.py::PayStatusSpecCasesTest` |
| RN-021 balance del cliente | ✅ `users.py:137-179` `recalculate_balance` (❌ B33 `balance_report` accesible para cualquier usuario) | ✅ `src/lib/balance.ts` (❌ N6 `purgeDataAction` no recalcula; ❌ N7 bolsas en `calculateBalanceRangeAction`) | ✅ vía API (❌ `balance-report.tsx:1030` `orderProfit` siempre 0, `deliveryExpenses` no se suma) | ❌ no muestra saldo | `test_balance_payments.py` (Django; `test_balance.py` contradice y debe revisarse); pendiente test puro en admin-next |
| RN-022 aplicar saldo hasta el disponible | ❌ B1/B2 `order/{id}/apply_balance/` lo registra como efectivo e ignora `balance_applied` (saldo reutilizable); ✅ PATCH `applied_balance` | ✅ `confirmOrderPaymentAction`, `confirmDeliveryPaymentAction` (acumulan `balanceApplied`) | ❌ usa `apply_balance` | N/A | pendiente (fase 4: test de `confirm*PaymentAction`) |

## Invariantes

| Invariante | Django API | admin-next | admin Vite | app cliente | Test |
|---|---|---|---|---|---|
| INV-001 requested ≥ purchased ≥ received ≥ delivered | ❌ B5 `ProductReceived` valida contra `amount_requested`, no `amount_purchased`; ❌ B6 rutas anidadas no validan hijos; ✅ `ProductBuyed`/`ProductDelivery` directos | ✅ compra (`purchased ≤ requested`), recepción (`≤ purchased − received`), entrega (`≤ received − delivered`); ❌ N8 remove/refund de compra sin comprobar recepciones (fase 1) | ❌ `DeliveryProductSelector.tsx:171` `maxAvailable = amount_purchased \|\| 999` permite entregar más de lo recibido; ✅ `PackageProductSelector` | N/A | `open-bags.test.ts`; `purchase-rules.test.ts` (fase 1); pendiente informe `/settings/system` |
| INV-002 categoría obligatoria para recibir/embolsar | ❌ `category` opcional en `Product`; no valida al recibir | ✅ `createProductAction` exige categoría; `registerArrivalsAction` exige categoría; ❌ N3 importación Excel crea productos sin categoría (fase 2: "Asignar categoría") | ❌ no exige | N/A | pendiente |
| INV-003 bolsa = `Pendiente`, peso 0, sin pagos; se borra si vacía | N/A (no conoce bolsas; las ve como entregas `Pendiente`) | ✅ `open-bags.ts` (`OPEN_BAG_WHERE`, `deleteBagIfEmpty`); ❌ N5 `removeDeliveredProductAction` no borra bolsas vacías; ❌ N5 `addUnitsToOpenBag` puede duplicar bolsas; ❌ N7 bolsas contadas como pendientes (fases 3-4) | ❌ muestra bolsas como entregas pendientes | ❌ muestra bolsas como entregas pendientes | `open-bags.test.ts` |
| INV-004 no re-pesar salvo admin | N/A (PATCH libre de `weight`) | ❌ N8 `registerBagWeightAction` solo comprueba `Pendiente`, no `weight === 0`; `updateDeliveryAction` acepta `weight` (fase 3) | ❌ edición libre de peso | N/A | pendiente `delivery-status.test.ts` (fase 3) |
| INV-005 producto de su tienda en compras y de su cliente en entregas | ❌ no valida tienda ni cliente en serializers | ❌ N8 validado solo en página, no en action (fases 1 y 3) | ❌ correlación cliente↔producto por `client_name` texto | N/A | pendiente `purchase-rules.test.ts`, test de `addDeliveredProductAction` |
| INV-006 estados de paquete/entrega solo por transiciones permitidas | ❌ PATCH libre de `status` | ⏳ ❌ N8 `setPackageStatusAction` sin máquina; `updateDeliveryAction` acepta `status` (fases 2 y 3: `package-status.ts`, `delivery-status.ts`) | ❌ select libre | N/A | `package-status.test.ts`, `delivery-status.test.ts` (fases 2-3) |

## Máquinas de estado

| Máquina | Django API | admin-next | admin Vite | app cliente |
|---|---|---|---|---|
| ES-orden | ✅ derivada (RN-012); ❌ B8/B15 `change_status` rechaza valores válidos; ❌ B33 `change_status` para cualquier autenticado | ❌ manual (N4) | ✅ vía API, ❌ envía `completed`/`cancelled` | ❌ claves inglesas |
| ES-producto | ✅ | ✅ RN-010, ❌ RN-011 (N1) | ✅ vía API | ❌ C16 tipos incorrectos |
| ES-paquete | ❌ select libre; ❌ B10 queryset por rol con `FieldError` | ⏳ fase 2 | ❌ select libre | ❌ C18 `PackageStatus` con valores de orden |
| ES-entrega | ❌ PATCH libre; endpoint real `/api_data/delivery_receips/` (C12: docs decían otro) | ⏳ fase 3 (hoy select libre en `delivery-dialog.tsx`) | ❌ select libre; valor `En transito` con etiqueta "En tránsito" ✅ | ✅ solo lectura; ❌ peso en kg (es libras) |
| ES-pago | ✅ (con B3/B24) | ✅ | ❌ `Pendiente` inventado | ❌ etiquetas propias |

## Roles (roles.md)

| Aspecto | Django API | admin-next | admin Vite | app cliente |
|---|---|---|---|---|
| Compras solo admin | ✅ `permissions/` | ✅ `ROLES.purchases` | ✅ `role-config.ts` | N/A |
| Agente solo lectura en entregas | ❌ B33 (fugas en `change_status`, `balance_report`) | ✅ actions rechazan; página permite entrar | ✅ botón oculto (`isAgent`) | N/A |
| Agente ve solo sus clientes | ✅ filtros por `assigned_agent` | ❌ N9 fase 1 de prepare no filtra por agente (fase 2) | ✅ | N/A |
| Cliente sin panel | ✅ | ✅ `isStaff` en `proxy.ts` | ✅ logout forzado | ❌ sin guards de ruta en la app cliente |

## Otros defectos conocidos que afectan al ciclo (sin regla asociada todavía)

| Id | App | Descripción | Tratamiento |
|---|---|---|---|
| B7 | Django | `notify_order_created` / `notify_product_purchased` fallaban si la orden no tenía `sales_manager` (recipient no nullable). | Corregido (22-sep-2026): `Notification.create_notification` omite la notificación sin destinatario y el aviso a admins tolera órdenes sin agente. |
| B18/B29 | Django | `ShoppingReceip.delete()` y `ShoppingReceipSerializer.update()` duplican la lógica de señales | Deuda Django |
| B20/B21 | Django | sin `transaction.atomic` en `add_products` y serializers anidados; pagos sin `select_for_update` | Deuda Django |
| B9-B14 | Django | `order.assign` (NameError), `BuyingAccounts` campo inexistente, `mark_*` no persisten | Deuda Django |
| N2 | admin-next | Prisma declara `Cascade` pero la BD no tiene `ON DELETE CASCADE`: borrados con hijos fallan con P2003 | Fase 3-4: borrado explícito de hijos con mensaje claro |
| N5 | admin-next | Escrituras no atómicas en create/update de orden, entrega, producto | Fase 4 |
| N9 | admin-next | Topes silenciosos (150 paquetes, 500/1000 candidatos, 80 visibles) | Fase 2 |
| N10 | admin-next | `deliverDate` sellada al crear la bolsa; `Order.paymentDate` default now() | Fase 3 |
| C9/C10 | docs/Vite | ingresos por órdenes "pagadas" vs "completadas"; ganancia de compras con fórmulas distintas | Reportes: regla pendiente de definir (RN-03x) |
| C5-C8 | docs | condiciones de `Recibido`/`Entregado` y `pending_delivery`/`is_fully_delivered` definidas distinto en 3 docs | Resuelto por RN-010/RN-011; docs en `legacy/` |
| C1/C2 | docs | cantidad no multiplica; IVA solo sobre precio | Resuelto por RN-001 |
| C12 | docs | endpoint de entregas mal documentado | Resuelto en glosario/conformidad |

## Actualización 2026-09-22 — fases 1 a 4 implementadas en admin-next

Tras el rediseño (rama `claude/proceso-compra-paquete-entrega`), las celdas de **admin-next** de las tablas anteriores quedan así. Django, admin Vite y la app cliente no cambian.

| Regla / invariante | Estado en admin-next | Dónde | Test |
|---|---|---|---|
| RN-004 estimación de compra parcial | ✅ | `src/lib/order-cost.ts` `estimateBuyedCost`, `estimatePurchaseTotal`; `/purchases/new` y `addPurchaseItemsAction` | `order-cost.test.ts` |
| RN-011 solo cuentan entregas `Entregado` | ✅ | `src/lib/product-status.ts` `deriveAmounts` (agregado `deliveredFinal`); `transitionDeliveryStatusAction` recomputa los productos de la entrega; chip «En entrega ×n» | `product-status.test.ts`, `spec-cases.test.ts` |
| RN-012 estado de orden derivado | ✅ | `src/lib/order-cost.ts` `deriveOrderStatus`; `recomputeOrderStatus` se ejecuta tras cada recompute de producto y en `refreshOrderTotals` (corrige el equivalente a B26); `Cancelado` se respeta | `order-cost.test.ts` |
| INV-001 (quitar/reembolsar compra) | ✅ | `src/lib/purchase-rules.ts` `canRemoveBuyed`, `canRefund`; actions en transacción | `purchase-rules.test.ts` |
| INV-002 categoría obligatoria | ✅ | `AssignCategoryPopover` + `assignProductCategoryAction` desbloquean productos sin categoría desde el checklist de llegadas | — |
| INV-003 bolsa = Pendiente peso 0 | ✅ | `deleteBagIfEmpty` en todos los caminos (`adjustBagItemAction`, `removeDeliveredProductAction`, `deleteDeliveryAction` vacía la bolsa); `pg_advisory_xact_lock` en `addUnitsToOpenBag` evita bolsas duplicadas; bolsas fuera de `/delivery`, dashboards y balance por rango | `open-bags.test.ts` |
| INV-004 no re-pesar salvo admin | ✅ | `registerBagWeightAction` exige fase «En preparación»; `correctDeliveryWeightAction` solo admin | — |
| INV-005 producto de su tienda / su cliente | ✅ | `validateBatch` en compras; `fillBags` y `addProductsToDeliveryAction` en entregas | — |
| INV-006 transiciones explícitas | ✅ | `src/lib/package-status.ts`, `src/lib/delivery-status.ts`; sin select libre de estado en paquetes ni entregas | `package-status.test.ts`, `delivery-status.test.ts` |
| ES-paquete | ✅ | `transitionPackageStatusAction`; `Enviado→Recibido` automático en `registerArrivalsAction` | `package-status.test.ts` |
| ES-entrega | ✅ | `transitionDeliveryStatusAction` (despachar, entregar con fecha real y foto, fallida, reintentar, devolver, reabrir admin) | `delivery-status.test.ts` |
| N2 borrados con hijos | ✅ | Compras, paquetes, entregas y órdenes borran hijos explícitamente o bloquean con mensaje claro | — |
| N3 importados sin categoría | ✅ (mitigado) | asignación rápida de categoría en recepción; la importación sigue sin pedir categoría | — |
| N5 escrituras no atómicas | ✅ | todas las actions de compras, paquetes, entregas y órdenes en `$transaction` | — |
| N7 bolsas en contadores | ✅ | `logistical/admin/agent-dashboard.tsx`, `balance/actions.ts`, `/delivery` por defecto | — |
| N9 agente en fase 1 | ✅ | `loadArrivalCandidates({ agentId })`; paquetes filtrados a los que tienen recepciones de sus clientes | — |
| N10 `deliverDate` | ✅ | «Marcar entregada» fija la fecha real | — |
| Mantenimiento | ✅ | Configuración → Sistema → «Recalcular estados de productos» (`recomputeAllProductsAction`) | — |

Pendiente en admin-next: informe de invariantes sobre la BD en `/settings/system` (solo hay recompute), paridad de RN-011/RN-012 en Django (deuda ADR-0001/ADR-0005).

## Suite Django heredada (nota de CI)

`python manage.py test` en `backend/` arrastra unos 160 tests heredados rotos por deriva de la API (fixtures con `create_user` sin `phone_number`, rutas y campos que ya no existen, `ProductBuyed` con campos eliminados). Mientras no se saneen, el job `test-backend` de `.github/workflows/jekyll-gh-pages.yml` ejecuta solo los módulos mantenidos (`test_spec_cases`, `test_balance_payments`, `test_invoice_service`, `test_create_admin`), igual que `spec-tests.yml`. El script `api/tests/test_agent_profits.py` era un informe manual que Django recogía como test; ahora es `report_agent_profits.py`.
