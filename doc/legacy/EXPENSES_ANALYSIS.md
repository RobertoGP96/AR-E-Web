# 📊 Análisis de Gastos (Expense Analysis)

Este documento describe el nuevo servicio para el análisis de datos de gastos (expenses) en el backend.

## ¿Qué incluye?
- Servicio: `api/services/expense_analysis_service.py` (función `analyze_expenses`)
- Endpoint: `GET /shein_shop/api_data/reports/expenses/` (vista `ExpenseAnalysisView`)
- Endpoint: `GET /shein_shop/api_data/expense/analysis/` (ViewSet action `ExpenseViewSet.analysis`)
- Tests: `backend/api/tests/test_expense_analysis.py`

## Cómo usar el endpoint
- Requiere autenticación y rol `admin` o `accountant`.
- Query params disponibles:
  - `start_date` - fecha ISO (YYYY-MM-DD o YYYY-MM-DDTHH:MM:SSZ)
  - `end_date` - fecha ISO

Ejemplo:
```
GET /shein_shop/api_data/reports/expenses/?start_date=2025-01-01&end_date=2025-12-31
```

## Respuesta
La respuesta contiene las métricas agregadas:
- `total_expenses`: total de gastos en el rango
- `average_expense`: gasto promedio
- `count`: número de registros
- `expenses_by_category`: totales por categoría
- `monthly_trend`: lista con totales mes a mes
