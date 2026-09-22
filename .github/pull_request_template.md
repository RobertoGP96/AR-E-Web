## Resumen

<!-- Qué cambia y por qué, en dos o tres frases. Enlaza el issue o la fase del plan si aplica. -->

## Apps afectadas

- [ ] `backend/` (Django)
- [ ] `apps/admin-next`
- [ ] `apps/admin` (Vite)
- [ ] `apps/client`
- [ ] Solo documentación / CI

## ¿Este cambio toca una regla de negocio, un estado, una transición, una fórmula o un invariante?

Si la respuesta es sí, la especificación en `doc/procesos/` es la fuente de verdad y el PR debe incluir **todo** lo siguiente (ver `doc/procesos/README.md`, "Gobierno del cambio"):

- [ ] **ADR nuevo** en `doc/procesos/decisiones/ADR-nnnn-*.md` (a partir de `ADR-0000-plantilla.md`); si sustituye una decisión, el ADR anterior queda marcado "Reemplazada por".
- [ ] **Regla o estado actualizado** en `doc/procesos/reglas/*.md` o `doc/procesos/estados/*.md` (identificador `RN-nnn` / `INV-nnn` / `ES-<entidad>` estable; nunca renumerar).
- [ ] **CHANGELOG** en `doc/procesos/CHANGELOG.md` con versión, fecha, reglas afectadas, ADR y apps impactadas.
- [ ] **Conformidad** actualizada en `doc/procesos/conformidad.md` para cada app (✅ / ❌ / N/A / ⏳ con enlace a código y test).
- [ ] **Casos JSON** añadidos o modificados en `doc/procesos/casos/*.json` y ambos tests espejo en verde: `pnpm --filter @ar-e-web/admin-next test` y `cd backend && python -m pytest api/tests/test_spec_cases.py --no-cov`.
- [ ] El código referencia el identificador (`// RN-011`, `# INV-001`) en el punto donde aplica la regla.

- [ ] No, este cambio no toca reglas de negocio ni estados.

## Verificación

- [ ] `pnpm --filter @ar-e-web/admin-next type-check` y `build` en verde (si toca admin-next).
- [ ] Tests de la app afectada en verde.
- [ ] Pantallas nuevas o modificadas de admin-next revisadas a ~375 px sin scroll horizontal, con la barra inferior visible sobre el BottomNav (ADR-0006). Adjunta captura.
- [ ] Si toca `doc/apps/*.md`, sigue describiendo "cómo lo implementa la app" y enlaza a la regla en `doc/procesos/` en lugar de redefinirla.

## Notas para revisión

<!-- Riesgos, migraciones de datos (recalcular estados/balances), decisiones tomadas por suposición, pendientes. -->
