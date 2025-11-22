import { apiClient } from '@/lib/api-client';

export interface MonthlyReport {
  month: string;
  month_short: string;
  revenue: number;
  total_expenses: number;
  product_expenses: number;
  purchase_operational_expenses: number;
  paid_purchase_expenses: number;
  delivery_expenses: number;
  agent_profits: number;
  system_delivery_profit: number;
  system_profit: number;
  projected_profit: number;
  // Campos legacy para compatibilidad hacia atrás
  costs?: number;
  product_costs?: number;
  delivery_costs?: number;
}

export interface AgentReport {
  agent_id: number;
  agent_name: string;
  agent_phone: string;
  total_profit: number;
  current_month_profit: number;
  clients_count: number;
  orders_count: number;
  orders_completed: number;
}

export interface ProfitReportsData {
  monthly_reports: MonthlyReport[];
  agent_reports: AgentReport[];
  summary: {
    total_revenue: number;
    total_expenses: number;
    total_product_expenses: number;
    total_purchase_operational_expenses: number;
    total_paid_purchase_expenses: number;
    total_delivery_expenses: number;
    total_agent_profits: number;
    total_system_delivery_profit: number;
    total_system_profit: number;
    profit_margin: number;
    // Campos legacy para compatibilidad hacia atrás
    total_costs?: number;
    total_product_costs?: number;
    total_delivery_costs?: number;
  };
}

export const fetchProfitReports = async (): Promise<ProfitReportsData> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No se encontró token de autenticación. Por favor, inicie sesión nuevamente.');
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    const fullUrl = `${apiUrl}api_data/reports/profits/`;

    const response = await apiClient.get<unknown>(fullUrl, { skipAuth: false });

    // Si la API devuelve un wrapper { success: boolean, data: ... }
    if (response && typeof response === 'object' && 'success' in (response as Record<string, unknown>)) {
      const resp = response as Record<string, unknown>;
      if (!resp.success) throw new Error('No se pudieron cargar los reportes. La API respondió con éxito=false');
      if (!('data' in resp)) throw new Error('No se pudieron cargar los reportes. Los datos están vacíos.');
      return (resp.data as ProfitReportsData);
    }

    // Si la API devuelve datos directamente
    return response as ProfitReportsData;
  } catch (error) {
    console.error('Error en fetchProfitReports:', error);
    // apiClient already formats errors and throws ApiError; map to friendly messages
    const err = error as { status?: number; message?: string }  ;
    if (err?.status === 401) {
      throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    } else if (err?.status === 403) {
      throw new Error('No tiene permisos para acceder a los reportes.');
    } else if (err?.status === 404) {
      throw new Error('El endpoint de reportes no fue encontrado.');
    } else if (err?.message) {
      throw new Error(`Error del servidor: ${err.message}`);
    }
    throw new Error('Error desconocido al cargar los reportes. Verifique su conexión a internet.');
    throw new Error('Error desconocido al cargar los reportes. Verifique su conexión a internet.');
  }
};

export default { fetchProfitReports };
