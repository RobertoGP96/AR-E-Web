/**
 * Servicio para reportes analíticos
 * 
 * NOTA: Estos endpoints de analytics no están implementados en el backend actual.
 * Los endpoints disponibles están en /api_data/dashboard/
 */

// import { apiClient } from '../../lib/api-client';
// import type { ReportData, ApiResponse } from '../../types';

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
 * Nota: Este endpoint no existe en el backend actual
 */
// export const generateOrdersReport = async (filters: ReportFilters): Promise<ApiResponse<ReportData>> => {
//   return await apiClient.get<ReportData>('/analytics/reports/orders/', {
//     params: filters
//   });
// };

/**
 * Genera reporte de usuarios
 * Nota: Este endpoint no existe en el backend actual
 */
// export const generateUsersReport = async (filters: ReportFilters): Promise<ApiResponse<ReportData>> => {
//   return await apiClient.get<ReportData>('/analytics/reports/users/', {
//     params: filters
//   });
// };

/**
 * Genera reporte de ventas
 * Nota: Este endpoint no existe en el backend actual
 */
// export const generateSalesReport = async (filters: ReportFilters): Promise<ApiResponse<ReportData>> => {
//   return await apiClient.get<ReportData>('/analytics/reports/sales/', {
//     params: filters
//   });
// };

/**
 * Genera reporte de productos
 * Nota: Este endpoint no existe en el backend actual
 */
// export const generateProductsReport = async (filters: ReportFilters): Promise<ApiResponse<ReportData>> => {
//   return await apiClient.get<ReportData>('/analytics/reports/products/', {
//     params: filters
//   });
// };

/**
 * Descarga reporte en formato específico
 * Nota: Este endpoint no existe en el backend actual
 */
// export const downloadReport = async (reportType: string, filters: ReportFilters, format: 'csv' | 'pdf' = 'csv') => {
//   const reportFilters = { ...filters, format };
//   return await apiClient.downloadFile(
//     `/analytics/reports/${reportType}/`,
//     `${reportType}_report.${format}`,
//     { params: reportFilters }
//   );
// };
