/**
 * Tipos para las respuestas de la API y utilidades
 */

import type { CustomUser } from "./models";

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

// Estructura de respuesta paginada de Django REST Framework
export interface PaginatedApiResponse<T = unknown> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Tipos para formularios de autenticación
export interface LoginCredentials {
  email?: string;
  phone_number?: string;
  password: string;
}

export interface AuthResponse {
  user: CustomUser;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterData {
  email: string;
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

export interface OrderFilters extends BaseFilters {
  status?: string;
  pay_status?: string;
  client?: number; // client id filter alias
  client_id?: number; // alias for client
  sales_manager?: number; // sales manager id
  sales_manager_id?: number; // alias for sales manager
  date_from?: string; // range start - align with backend param `date_from`
  date_to?: string; // range end - align with backend param `date_to`
}

export interface ProductFilters extends BaseFilters {
  status?: string;
  shop?: number;
  order?: number;
  category?: string;
  price_min?: number;
  price_max?: number;
}

export interface ShopFilters extends BaseFilters {
  is_active?: boolean;
}

export interface BuyingAccountFilters extends BaseFilters {
  shop?: number;
}

export interface ShoppingReceipFilters extends BaseFilters {
  status_of_shopping?: string;
  shopping_account?: number;
  shopping_account_id?: number; // alias
  shop_of_buy?: number;
  shop_of_buy_id?: number; // alias used by services
  buy_date_from?: string;
  buy_date_to?: string;
}

export interface ProductBuyedFilters extends BaseFilters {
  order?: number;
  original_product?: string;  // UUID
  shoping_receip?: number;
  buy_date_from?: string;
  buy_date_to?: string;
}

export interface ProductReceivedFilters extends BaseFilters {
  order?: number;
  original_product?: string;  // UUID
  package_where_was_send?: number;
  deliver_receip?: number;
  reception_date_from?: string;
  reception_date_to?: string;
}

export interface PackageFilters extends BaseFilters {
  status_of_processing?: string;
  agency_name?: string;
  arrival_date_from?: string;
  arrival_date_to?: string;
  search?: string;
}

export interface DeliverReceipFilters extends BaseFilters {
  order?: number;
  status?: string;
  zone?: string;
  search?: string;
  deliver_date_from?: string;
  deliver_date_to?: string;
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
    ordered: number;
    purchased: number;
    received: number;
    delivered: number;
    by_category: {
      category: string;
      count: number;
    }[];
  };
  users: {
    total: number;
    active: number;
    verified: number;
    agents: number;
    clients: number;
  };
  revenue: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
    last_month: number;
  };
  purchases: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
  };
  packages: {
    total: number;
    sent: number;
    in_transit: number;
    delivered: number;
    delayed: number;
  };
  deliveries: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
    pending: number;
    in_transit: number;
    delivered: number;
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
