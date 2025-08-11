/**
 * Servicio para reportes analíticos
 */

import { apiClient } from '../../lib/api-client';
import type { ReportData, ApiResponse } from '../../types';

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  agent_id?: number;
  client_id?: number;
  status?: string;
  format?: 'json' | 'csv' | 'pdf';
}

/**
 * Genera reporte de órdenes
 */
export const generateOrdersReport = async (filters: ReportFilters): Promise<ApiResponse<ReportData>> => {
  return await apiClient.get<ReportData>('/analytics/reports/orders/', {
    params: filters
  });
};

/**
 * Genera reporte de usuarios
 */
export const generateUsersReport = async (filters: ReportFilters): Promise<ApiResponse<ReportData>> => {
  return await apiClient.get<ReportData>('/analytics/reports/users/', {
    params: filters
  });
};

/**
 * Genera reporte de ventas
 */
export const generateSalesReport = async (filters: ReportFilters): Promise<ApiResponse<ReportData>> => {
  return await apiClient.get<ReportData>('/analytics/reports/sales/', {
    params: filters
  });
};

/**
 * Genera reporte de productos
 */
export const generateProductsReport = async (filters: ReportFilters): Promise<ApiResponse<ReportData>> => {
  return await apiClient.get<ReportData>('/analytics/reports/products/', {
    params: filters
  });
};

/**
 * Descarga reporte en formato específico
 */
export const downloadReport = async (reportType: string, filters: ReportFilters, format: 'csv' | 'pdf' = 'csv') => {
  const reportFilters = { ...filters, format };
  return await apiClient.downloadFile(
    `/analytics/reports/${reportType}/`,
    `${reportType}_report.${format}`,
    { params: reportFilters }
  );
};
