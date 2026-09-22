# Documentación heredada (legacy)

Los archivos de este directorio son los documentos sueltos que vivían en `doc/` hasta septiembre de 2026. **Están reemplazados por [`doc/procesos/`](../procesos/README.md)**, que es la única fuente de verdad de reglas, estados, roles y procedimientos. Se conservan solo como registro histórico: no deben usarse para desarrollar, revisar ni verificar comportamiento. Si algo de aquí parece útil y no está en `doc/procesos/`, la vía es proponerlo allí (ADR + regla), no citar estos archivos.

Las descripciones de cada app (`doc/apps/*.md`) no están aquí: siguen vigentes como "cómo lo implementa cada app" y enlazan a las reglas.

## Por qué no usar estos documentos

Durante la exploración de septiembre de 2026 se detectaron **18 contradicciones** entre estos documentos y el código (o entre ellos mismos). Cada una tiene ahora una regla que la resuelve.

| Id | Contradicción | Documentos implicados | Resuelto por |
|---|---|---|---|
| C1 | Afirma que la cantidad pedida **no** multiplica el precio unitario; el código (Django, Vite, admin-next) sí multiplica. | `PRODUCT_COST_CALCULATION.md` | RN-001 |
| C2 | Afirma que el IVA del 7 % se aplica solo sobre el precio; el código lo aplica sobre precio × cantidad + envío. | `PRODUCT_COST_CALCULATION.md` | RN-001 |
| C3 | Fórmulas de costo parcial de compra distintas entre documento y servicio. | `PURCHASES_SERVICE_DOCUMENTATION.md`, `PROFIT_CALCULATION_FIX.md` | RN-004 |
| C4 | Ganancia de entrega calculada con comisión del `sales_manager` de la orden en un documento y con el agente asignado al cliente en el código. | `DELIVERY_MANAGER_PROFIT_CALCULATION.md` | RN-003 |
| C5 | Condición de `Recibido` definida como `received > 0` en un documento y como `received ≥ requested` en el código. | `PRODUCT_STATUS_DEPENDENCIES_EXPLAINED.md`, `QUICK_REFERENCE_PRODUCT_STATUS.md` | RN-010 |
| C6 | Condición de `Entregado` sin exigir `delivered ≥ purchased` en un documento; el código la exige. | `PRODUCT_STATUS_IMPLEMENTATION_GUIDE.md` | RN-010 |
| C7 | `pending_delivery` definido como `purchased − delivered` en un documento y `received − delivered` en otro. | `PRODUCT_QUANTITIES_SYSTEM.md`, `ORDER_PRODUCT_STATUS_SYNC.md` | RN-010, `estados/producto.md` |
| C8 | `is_fully_delivered` comparado contra `amount_purchased` (método deprecado) frente a estado `Entregado` de todos los productos. | `ORDER_PRODUCT_STATUS_SYNC.md`, `PRODUCT_STATUS_FINAL_SUMMARY.md` | RN-012 |
| C9 | Ingresos calculados sobre órdenes "pagadas" en un documento y "completadas" en otro. | `REVENUE_CALCULATION_UPDATE.md`, `REPORTS_REVENUE_FIX.md` | Pendiente (RN-03x, reportes) |
| C10 | Ganancia de compras con dos fórmulas distintas (con y sin reembolsos). | `PROFIT_CALCULATION_FIX.md`, `PURCHASES_SERVICE_DOCUMENTATION.md` | RN-004, pendiente (RN-03x) |
| C11 | Estados de orden documentados en inglés (`pending`, `completed`) que el backend rechaza. | `API_DOCUMENTATION.md`, `METRICS_FIX_REPORT.md` | `estados/orden.md` |
| C12 | Endpoint de entregas documentado como `/api_data/deliver_reciep/` y `/api/delivery_receips/`; el real es `/api_data/delivery_receips/`. | `API_DOCUMENTATION.md`, `SOLUCION_ERROR_404_ENTREGAS_ORDENES.md` | `glosario.md`, `conformidad.md` |
| C13 | Afirma que `calculatePaymentStatus` se usa en `ConfirmPaymentDialog`; en el código es código muerto y el diálogo envía `Pendiente`. | `PAYMENT_STATUS_FIX.md`, `FRONTEND_BACKEND_PAYMENT_SYNC.md` | RN-020, `estados/pago.md` |
| C14 | Describe overrides de `delete()` con recálculo manual que ya no existen (las señales lo hacen). | `DELETION_LOGIC.md` | `estados/producto.md`, `conformidad.md` (B18/B29) |
| C15 | Fases de validación de consistencia y carreras marcadas como "PENDIENTE" sin cierre. | `PRODUCT_STATUS_FINAL_SUMMARY.md`, `PRODUCT_STATUS_DIAGNOSIS_COMPLETE.md` | `reglas/invariantes.md` (INV-001), fase 4 |
| C16 | `PRODUCT_STATUSES` / `ProductStatus` en la app cliente y constantes del admin con valores de orden (`Procesando`, `Completado`, `Cancelado`) en lugar de producto. | `ADMIN_TYPES_FIXED.md`, `CLIENT_SERVICE_*` | `estados/producto.md` |
| C17 | Balance del cliente documentado sumando `balance_applied` como ingreso; el código no lo suma. | `PAYMENT_SYNC_COMPLETE_SUMMARY.md`, `PAYMENT_STATUS_VERIFICATION.md` | RN-021, RN-022 |
| C18 | `PackageStatus` en la app cliente con valores de orden en lugar de `Enviado / Recibido / Procesado`. | `CLIENT_SERVICE_*` | `estados/paquete.md` |

Además, muchos documentos son informes de una iteración concreta (`*_SUMMARY.md`, `*_FIX.md`, `IMPLEMENTATION_CHECKLIST.md`, `ITERACION_COMPLETADA_*.txt`) que describen un estado del código que ya no existe.

## Documentos que siguen siendo útiles como referencia técnica (no de procesos)

Guías de despliegue y configuración (`CLOUDFLARE_*`, `RENDER_*`, `VERCEL_*`, `ENVIRONMENT_CONFIG.md`, `CORS_CONFIGURATION.md`, `EMAIL_VERIFICATION_CONFIG.md`, `IMAGE_UPLOAD_GUIDE.md`, `AMAZON_SCRAPING_API.md`, `ADMIN_COMMANDS.md`, `ADMIN_CREATION_GUIDE.md`). Pueden consultarse con la reserva de que no han sido revisadas contra el código actual; lo que digan sobre reglas de negocio no tiene validez.
