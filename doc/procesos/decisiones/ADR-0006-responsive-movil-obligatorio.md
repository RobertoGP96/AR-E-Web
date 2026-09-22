# ADR-0006 — Responsive móvil obligatorio en toda pantalla nueva o modificada

**Estado:** Aceptada
**Fecha:** 2026-09-22
**Reglas y estados afectados:** ninguna regla de negocio; criterio de aceptación de interfaz para todas las fases
**Apps impactadas:** admin-next

## Contexto

El logístico marca llegadas y pesa bolsas en el almacén con el teléfono; el agente consulta órdenes y el contador registra cobros fuera de la oficina. Las pantallas de admin-next con tablas anchas y diálogos grandes obligaban a scroll horizontal o a usar el portátil. El usuario lo pidió de forma explícita al aprobar el plan de rediseño. El design system del panel (HeroUI v3, `ResponsiveTable`, `MobileCard`, BottomNav flotante, reglas de `view-transition-name` en `globals.css`) ya tiene primitivos para ello.

## Decisión

Toda pantalla **nueva o modificada** en admin-next debe funcionar a **~375 px de ancho sin scroll horizontal**. En concreto:

- Listas y checklists: tarjetas apiladas en móvil (`ResponsiveTable` / `MobileCard`), tabla en escritorio.
- Controles táctiles: steppers de cantidad y botones con área mínima de 44 px; nada que dependa de hover.
- Barra inferior `sticky` con el resumen del lote (marcados, unidades, total) y el botón principal, colocada **por encima** del BottomNav flotante y respetando las reglas de `view-transition-name` de `globals.css`.
- Diálogos grandes (`AppModal size="lg"`) se convierten en pantalla completa en móvil.
- Sin texto truncado que oculte cantidades o estados; los chips de estado se mantienen visibles.
- Verificación obligatoria antes de cerrar cada fase: revisión a 375 px con `resize_window` del navegador integrado (sin scroll horizontal, barra inferior visible sobre el BottomNav) y captura en el PR.

## Consecuencias

- Positivas: el flujo de recepción y pesaje puede hacerse desde el almacén; el checklist compartido (ADR-0002/0003/0004) se diseña una vez para ambos tamaños.
- Negativas: más trabajo por pantalla y componentes algo más complejos; algunas tablas densas (compras, balances) pierden columnas en móvil y las muestran en el detalle.
- Trabajo derivado: casilla en la plantilla de PR; sección de verificación responsive en cada fase del plan.

## Alternativas descartadas

- **Solo escritorio, móvil "best effort".** Descartada por petición explícita del usuario y porque el uso principal del logístico es móvil.
- **App móvil separada.** Descartada: duplicaría lógica y pantallas; el panel Next ya es responsive por diseño con los primitivos existentes.
- **Tablas con scroll horizontal en móvil.** Descartada: oculta cantidades y estados, que es justo lo que se opera con el pulgar.
