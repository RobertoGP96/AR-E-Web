# ADR-0001 — Alcance del rediseño: solo admin-next, sin cambios de esquema

**Estado:** Aceptada
**Fecha:** 2026-09-22
**Reglas y estados afectados:** todas (define dónde se implementan)
**Apps impactadas:** admin-next (cambios); Django, admin Vite y app cliente (solo documentación y conformidad)

## Contexto

Tres aplicaciones escriben o leen la misma base de datos Neon Postgres: Django (`backend/`, dueño del esquema y de las migraciones), admin-next (`apps/admin-next`, Prisma directo que replica las señales de Django en `src/lib/`) y admin Vite (`apps/admin`, vía la API Django). La app cliente solo lee. El proceso compra → paquete → entrega presenta problemas y el usuario pidió corregir los componentes para hacerlo más controlado, menos complejo y más intuitivo, además de una fuente única de verdad de los procesos.

Corregir las tres apps a la vez multiplica el riesgo: Django tiene 33 bugs catalogados (B1–B33) en endpoints que el admin Vite usa en producción, y cualquier cambio de esquema exige migración Django + `prisma db pull` coordinados.

## Decisión

El rediseño del flujo se implementa **solo en `apps/admin-next`**. No se modifican el runtime de Django, la app cliente, el admin Vite ni el esquema de base de datos (nada de `prisma migrate`; la BD es de Django). La especificación (`doc/procesos/`) es común a las cuatro apps y la matriz de conformidad registra qué cumple cada una; los incumplimientos de Django, admin Vite y cliente quedan documentados como deuda con su identificador de bug.

La única excepción en `backend/` es el test espejo `api/tests/test_spec_cases.py`, que valida las funciones puras de Django contra los mismos casos que admin-next.

## Consecuencias

- Positivas: un solo equipo de cambios, sin migraciones, sin romper el admin Vite en producción; la especificación obliga igualmente a las otras apps cuando se toquen.
- Negativas: mientras Django no implemente RN-011, un cambio hecho desde el admin Vite sobre una entrega no aplicará la nueva regla; la divergencia queda visible en `conformidad.md`. Las máquinas de estado nuevas viven en `src/lib/` de admin-next y no en la base de datos, así que Django no las hace cumplir.
- Trabajo derivado: fases 1–4 del plan en admin-next; entradas en `CHANGELOG.md` y `conformidad.md` por fase.

## Alternativas descartadas

- **Corregir Django primero y hacer que admin-next use la API.** Descartada: admin-next ya escribe directo con Prisma por rendimiento y porque los endpoints anidados de Django no validan hijos (B6, B20, B21); pasar por la API heredaría esos bugs.
- **Tabla propia para bolsas y tablas de transiciones en BD.** Descartada: requiere migración Django y cambios en el admin Vite; la bolsa se deriva de `status + weight` (INV-003) sin esquema nuevo.
- **Rediseñar también el admin Vite.** Descartada: es la app en producción y está previsto retirarla cuando admin-next la cubra.
