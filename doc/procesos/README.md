# Especificación de procesos — AR&E Shipps

**Versión de la especificación:** 1.0.0 (2026-09-22)
**Ámbito:** todo el monorepo (`backend/` Django, `apps/admin-next`, `apps/admin`, `apps/client`).

Este directorio es la **única fuente de verdad** de cómo funciona el negocio: qué entidades existen, por qué estados pasan, quién puede hacer cada operación, con qué fórmulas se calculan costos, pagos y balances, y qué invariantes nunca pueden romperse. Todo el código que escribe la base de datos (Django y admin-next) y todo el que la lee (admin Vite, app cliente) debe obedecer lo que aquí se describe. Cuando el código y esta especificación difieren, se corrige uno de los dos de forma explícita y registrada; nunca se deja la diferencia sin documentar.

## Por qué existe

Hasta septiembre de 2026 había tres escritores de la misma base de datos (Django, admin-next vía Prisma y el admin Vite vía la API) y unos 80 documentos sueltos en `doc/` con 18 contradicciones entre sí y con el código (ver [`../legacy/README.md`](../legacy/README.md)). El resultado eran productos que aparecían como entregados sin haber salido del almacén, saldos que se aplicaban varias veces y órdenes que nunca se completaban. Esta especificación sustituye a esos documentos y fija reglas numeradas y verificables.

## Índice

| Archivo | Contenido |
|---|---|
| [`glosario.md`](glosario.md) | Definición de cada término del negocio y la entidad de base de datos que lo representa. |
| [`roles.md`](roles.md) | Matriz canónica rol × operación (admin, agent, accountant, logistical, client). |
| [`ciclo-de-vida.md`](ciclo-de-vida.md) | Flujo end-to-end: orden → compra → paquete → bolsa → entrega → cobro, con responsables y artefactos por paso. |
| [`estados/orden.md`](estados/orden.md) | Máquina de estados de la orden (`ES-orden`). |
| [`estados/producto.md`](estados/producto.md) | Máquina de estados del producto, derivada de cantidades (`ES-producto`). |
| [`estados/paquete.md`](estados/paquete.md) | Máquina de estados del paquete (`ES-paquete`). |
| [`estados/entrega.md`](estados/entrega.md) | Máquina de estados de la entrega, incluida la bolsa (`ES-entrega`). |
| [`estados/pago.md`](estados/pago.md) | Estado de pago de orden, entrega y compra (`ES-pago`). |
| [`reglas/costos.md`](reglas/costos.md) | RN-001 a RN-004: costo de producto, costo por peso, comisión del gestor, estimación de compra parcial. |
| [`reglas/estados.md`](reglas/estados.md) | RN-010 a RN-012: derivación de estados de producto y orden. |
| [`reglas/pagos.md`](reglas/pagos.md) | RN-020 a RN-022: estado de pago, balance del cliente, saldo aplicado. |
| [`reglas/invariantes.md`](reglas/invariantes.md) | INV-001 a INV-006: condiciones que deben cumplirse siempre. |
| [`procedimientos/agente.md`](procedimientos/agente.md) | Procedimiento operativo del agente en admin-next. |
| [`procedimientos/admin-compras.md`](procedimientos/admin-compras.md) | Procedimiento operativo de compras (admin). |
| [`procedimientos/logistico.md`](procedimientos/logistico.md) | Procedimiento operativo del logístico: paquetes, bolsas, entregas. |
| [`procedimientos/contador.md`](procedimientos/contador.md) | Procedimiento operativo del contador: cobros, saldo, balances. |
| [`decisiones/`](decisiones/) | ADR-0001 a ADR-0006 (decisiones de diseño) y `ADR-0000-plantilla.md`. |
| [`conformidad.md`](conformidad.md) | Matriz regla/invariante × implementación (Django, admin-next, admin Vite, cliente) con estado y enlaces a código y tests. |
| [`casos/`](casos/) | Vectores de prueba compartidos en JSON: `product-status.json`, `product-cost.json`, `pay-status.json`. |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de versiones de la especificación. |

## Convención de identificadores

Los identificadores son **estables**: nunca se reutilizan ni se renumeran. Una regla retirada se marca como "Retirada, ver RN-xxx" y conserva su número.

| Prefijo | Significado | Formato | Ejemplo |
|---|---|---|---|
| `RN-nnn` | Regla de negocio (fórmula o decisión de cálculo/derivación) | tres dígitos, agrupados por decenas: 00x costos, 01x estados, 02x pagos | `RN-011` |
| `INV-nnn` | Invariante: condición que debe cumplirse en cualquier momento en la base de datos | tres dígitos | `INV-001` |
| `ES-<entidad>` | Máquina de estados de una entidad | nombre en minúsculas | `ES-entrega` |
| `ADR-nnnn` | Registro de decisión de arquitectura/diseño | cuatro dígitos | `ADR-0005` |
| `RN-nnn-nn` | Caso de prueba de una regla, en `casos/*.json` | regla + dos dígitos | `RN-010-06` |

Se referencian desde el código con un comentario (`// RN-011`, `# INV-001`) y desde los tests en el nombre del `describe`/clase (`describe('RN-020 ...')`, `class PayStatusSpecCasesTest`).

## Cómo se verifica

- `doc/procesos/casos/*.json` son consumidos por dos suites que deben dar el mismo resultado:
  - `apps/admin-next/src/lib/spec-cases.test.ts` (vitest): `pnpm --filter @ar-e-web/admin-next test`.
  - `backend/api/tests/test_spec_cases.py` (pytest + Django, SQLite): `cd backend && python -m pytest api/tests/test_spec_cases.py --no-cov`.
- `.github/workflows/spec-tests.yml` ejecuta ambas en cada pull request y en cada push a `main`.
- `conformidad.md` registra, por regla y por app, si la implementación cumple, con enlace al archivo y al test.

## Gobierno del cambio

Cualquier cambio en una regla, un estado, una transición, una fórmula o un invariante sigue este orden. No se acepta un PR que altere el comportamiento del negocio sin completar los cinco pasos.

1. **ADR.** Se crea `decisiones/ADR-nnnn-<tema>.md` a partir de `ADR-0000-plantilla.md` con contexto, decisión, consecuencias y alternativas descartadas. Si sustituye a una decisión previa, el ADR anterior pasa a estado "Reemplazada por ADR-nnnn"; los ADR nunca se borran.
2. **Regla o estado.** Se actualiza el archivo de `reglas/` o `estados/` afectado. Una regla nueva recibe el siguiente número libre de su decena; una regla modificada conserva su número y añade una línea "Desde la versión x.y.z".
3. **CHANGELOG.** Se añade una entrada en `CHANGELOG.md` con la versión, la fecha, las reglas afectadas, el motivo (enlace al ADR) y las apps impactadas. Versionado semántico: mayor si cambia el significado de una regla o un estado existente, menor si se añade una regla o transición, parche si solo se corrige redacción o se añaden casos.
4. **Conformidad.** Se actualiza `conformidad.md` marcando qué implementación cumple ya la regla nueva y cuál queda pendiente.
5. **Tests.** Se añaden o modifican casos en `casos/*.json` y se comprueba que `spec-cases.test.ts` y `test_spec_cases.py` pasan en verde. Si la regla no es una función pura, se añade un test en la suite de la app que la implementa y se enlaza desde `conformidad.md`.

La plantilla de PR (`.github/pull_request_template.md`) incluye esta lista como casillas y `CODEOWNERS` exige revisión del responsable del directorio.

## Relación con el resto de la documentación

- `doc/apps/*.md` describe **cómo implementa cada app** estas reglas (pantallas, servicios, hooks). Enlazan aquí y no redefinen reglas.
- `doc/legacy/` contiene los documentos anteriores, conservados solo como registro histórico. No deben usarse como referencia.
- `CLAUDE.md` en la raíz apunta a este directorio como paso previo obligatorio antes de tocar cualquier flujo.
