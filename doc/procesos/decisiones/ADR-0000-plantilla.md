# ADR-0000 — Plantilla

Copia este archivo como `ADR-nnnn-<tema-en-kebab-case>.md` con el siguiente número libre. Los ADR nunca se borran ni se renumeran; si una decisión cambia, el ADR antiguo pasa a "Reemplazada por ADR-nnnn" y se crea uno nuevo.

**Estado:** Propuesta | Aceptada | Reemplazada por ADR-nnnn | Retirada
**Fecha:** AAAA-MM-DD
**Reglas y estados afectados:** RN-nnn, INV-nnn, ES-<entidad>
**Apps impactadas:** Django | admin-next | admin Vite | app cliente

## Contexto

Qué problema o situación obliga a decidir. Hechos, no opiniones: bugs observados, contradicciones, restricciones técnicas o de negocio. Enlaza a código o a documentos concretos.

## Decisión

Qué se decide, en presente y en una o dos frases. Después, el detalle necesario para implementarla sin ambigüedad (tablas, fórmulas, transiciones).

## Consecuencias

- Positivas: qué mejora.
- Negativas o costes: qué se pierde, qué hay que migrar, qué queda temporalmente inconsistente.
- Trabajo derivado: cambios en `reglas/`, `estados/`, `casos/`, `conformidad.md`, código y tests.

## Alternativas descartadas

Para cada alternativa: en qué consistía y por qué se descartó.
