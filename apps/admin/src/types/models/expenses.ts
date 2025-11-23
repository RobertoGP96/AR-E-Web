/**
 * Tipos para el modelo Expense (Gastos)
 * Basado en backend/api/models/expenses.py y serializer ExpenseSerializer
 */

import type { ID, DateTime } from './base';
import type { CustomUser } from './user';

// Categorías aceptadas por el backend
export type ExpenseCategory =
	| 'Envio'
	| 'Tasas'
	| 'Sueldo'
	| 'Publicidad'
	| 'Operativo'
	| 'Entrega'
	| 'Otro';

export interface Expense {
	id: ID;
	date: DateTime; // ISO date-time
	amount: number;
	category: ExpenseCategory;
	description?: string | null;
	created_by?: CustomUser | ID | null;
	created_at: DateTime;
	updated_at: DateTime;
}

// Payload para crear un gasto (el backend agrega created_by automáticamente)
export interface CreateExpenseData {
	date?: DateTime; // opcional, backend usa timezone.now() si no se provee
	amount: number;
	category: ExpenseCategory;
	description?: string | null;
	recurrent?: boolean;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {
	id: ID;
}

export interface ExpenseFilters {
	created_by?: ID | 'me';
	category?: ExpenseCategory;
	start_date?: string; // YYYY-MM-DD or ISO string
	end_date?: string; // YYYY-MM-DD or ISO string
}

// Estructuras de análisis devueltas por los endpoints de análisis
export interface ExpenseAnalysisMonthly {
	month: string | null; // formato YYYY-MM
	total: number;
}

export interface ExpenseAnalysisResponse {
	total_expenses: number;
	average_expense: number;
	count: number;
	expenses_by_category: Record<ExpenseCategory | string, number>;
	monthly_trend: ExpenseAnalysisMonthly[];
}

export default {};
