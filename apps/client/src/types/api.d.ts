/**
 * Tipos para las respuestas de la API y utilidades
 */

import type { CustomUser } from "./user";


// Tipos base para API
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
}

export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    count: number;
    page: number;
    pages: number;
    per_page: number;
    next?: string;
    previous?: string;
  };
}

// Tipos para formularios de autenticación
export interface LoginCredentials {
  phone_number: string;
  password: string;
}

export interface AuthResponse {
  // El backend puede devolver tokens con nombres distintos dependiendo de la versión
  // Soportamos ambas formas para mantener compatibilidad: { access, refresh } y { access_token, refresh_token }
  refresh?: string;
  access?: string;
  refresh_token?: string;
  access_token?: string;
  user: CustomUser;
}

export interface RegisterData {
  email?: string;
  password: string;
  name: string;
  last_name: string;
  home_address: string;
  phone_number: string;
}

// Tipos para tablas de datos
export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, record: T) => React.ReactNode;
  width?: string | number;
}

export interface TableProps<T = Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onSort?: (field: keyof T, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, string | number | boolean>) => void;
  selection?: {
    selectedRowKeys: React.Key[];
    onChange: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
  };
}

// Tipos para filtros de búsqueda
export interface BaseFilters extends Record<string, unknown> {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UserFilters extends BaseFilters {
  is_active?: boolean;
  is_verified?: boolean;
  role?: string;
  date_joined_from?: string;
  date_joined_to?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  pay_status?: PayStatus;
  client_id?: ID;
  sales_manager_id?: ID;
  date_from?: string;
  date_to?: string;
}

export interface ProductFilters extends BaseFilters {
  status?: string;
  shop_id?: number;
  order_id?: number;
  category?: string;
  price_min?: number;
  price_max?: number;
}

// Tipos para estadísticas del dashboard
export interface DashboardMetrics {
  orders: {
    total: number;
    pending: number;
    completed: number;
    today: number;
    this_week: number;
    this_month: number;
  };
  products: {
    total: number;
    in_stock: number;
    out_of_stock: number;
    pending_delivery: number;
  };
  users: {
    total: number;
    active: number;
    verified: number;
    agents: number;
  };
  revenue: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
    last_month: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Tipos para formularios
export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { value: string | number; label: string }[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: string | number | boolean) => string | undefined;
  };
}

export interface FormProps {
  fields: FormFieldProps[];
  initialValues?: Record<string, string | number | boolean>;
  onSubmit: (values: Record<string, string | number | boolean>) => void | Promise<void>;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
}

// Tipos para notificaciones
export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
}

// Tipos para navegación
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  permission?: string;
}

export interface BreadcrumbItem {
  title: string;
  path?: string;
}

// Tipos para configuración
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    enableAnalytics: boolean;
    enableNotifications: boolean;
    enableExport: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'es' | 'en';
    itemsPerPage: number;
  };
}

// Tipos para exportación de datos
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  columns?: string[];
  filters?: Record<string, string | number | boolean>;
  filename?: string;
}

// Tipos para cargas de archivos
export interface FileUploadOptions {
  accept: string[];
  maxSize: number; // en bytes
  multiple?: boolean;
  compress?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadDate: string;
}

// Tipos para roles y permisos
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

// Tipos para audit logs
export interface AuditLog {
  id: string;
  user: CustomUser;
  action: string;
  resource_type: string;
  resource_id: string;
  changes: Record<string, { old: string | number | boolean; new: string | number | boolean }>;
  timestamp: string;
  ip_address: string;
  user_agent: string;
}

// Tipos para configuraciones del sistema
export interface SystemSettings {
  site_name: string;
  site_logo?: string;
  support_email: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_verification_required: boolean;
  max_file_size: number;
  allowed_file_types: string[];
  session_timeout: number;
}

// Tipos para reportes
export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'table' | 'chart' | 'custom';
  parameters: {
    name: string;
    type: 'date' | 'select' | 'number' | 'text';
    required: boolean;
    options?: { value: string | number; label: string }[];
  }[];
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

export interface ReportData {
  config: ReportConfig;
  data: Record<string, string | number | boolean>[];
  generated_at: string;
  parameters: Record<string, string | number | boolean>;
}
