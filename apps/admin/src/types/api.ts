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
  client_id?: number;
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
    total_refunded?: number;
    net_spent?: number;
    refund_rate?: number;
    total_spent?: number;
    today_spent?: number;
    this_week_spent?: number;
    this_month_spent?: number;
    products_count?: number;
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
    total_weight?: number;
    today_weight?: number;
    this_week_weight?: number;
    this_month_weight?: number;
  };
  client_balances?: {
    total_clients: number;
    with_debt: number;
    with_surplus: number;
    on_time: number;
    total_debt: number;
    total_surplus: number;
    collection_rate: number;
  };
  financial?: {
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    profit_margin: number;
    delivery_revenue: number;
    delivery_expenses: number;
    delivery_profit: number;
    unpaid_deliveries_amount: number;
    unpaid_deliveries_count: number;
    payment_collection_rate: number;
  };
  agents?: {
    total_agents: number;
    total_agent_profit: number;
    total_agent_clients: number;
    top_agents: Array<{
      agent_id: number;
      agent_name: string;
      total_profit: number;
      clients_count: number;
      orders_count: number;
    }>;
  };
  expenses?: {
    total: number;
    count: number;
    this_month: number;
    this_month_count: number;
    average: number;
  };
  product_metrics?: {
    pending_purchase: number;
    in_transit: number;
    total_ordered: number;
    total_delivered: number;
    delivery_rate: number;
    top_refunded_products: Array<{
      name: string;
      refund_count: number;
      total_refund_amount: number;
    }>;
    total_refunded_amount: number;
    refund_percentage: number;
  };
  alerts?: {
    orders_pending_30_days: number;
    deliveries_unpaid_60_days: {
      count: number;
      total_amount: number;
    };
    clients_with_high_debt: {
      count: number;
      total_debt: number;
      clients: Array<{
        id: number;
        name: string;
        debt: number;
      }>;
    };
    products_low_stock: number;
    total_alerts: number;
  };
  exchange_rate?: number;
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
