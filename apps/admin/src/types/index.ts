/**
 * Archivo de índice para exportar todos los tipos
 */

// Exportar todos los tipos de modelos
export type {
  // Tipos básicos
  ID,
  UUID,
  DateTime,
  Date,
  
  // Estados
  OrderStatus,
  PayStatus,
  ProductStatus,
  ShoppingStatus,
  DeliveryStatus,
  PackageStatus,
  UserRole,
  
  // Modelos principales
  CustomUser,
  Order,
  Product,
  Shop,
  BuyingAccount,
  CommonInformation,
  EvidenceImage,
  ShoppingReceip,
  DeliverReceip,
  Package,
  ProductBuyed,
  ProductReceived,
  
  // Tipos para crear/editar
  CreateUserData,
  UpdateUserData,
  CreateShopData,
  UpdateShopData,
  CreateBuyingAccountData,
  UpdateBuyingAccountData,
  UpdateCommonInformationData,
  CreateEvidenceImageData,
  CreateOrderData,
  UpdateOrderData,
  CreateProductData,
  UpdateProductData,
  CreateShoppingReceipData,
  UpdateShoppingReceipData,
  CreateDeliverReceipData,
  UpdateDeliverReceipData,
  CreatePackageData,
  UpdatePackageData,
  CreateProductBuyedData,
  UpdateProductBuyedData,
  CreateProductReceivedData,
  UpdateProductReceivedData,
  
  // Filtros
  OrderFilters,
  ProductFilters,
  UserFilters,
  
  // Estadísticas
  DashboardStats,
  OrderStats,
  
  // Permisos
  UserPermissions
} from './models';

// Exportar constantes de estados
export {
  ORDER_STATUSES,
  PAY_STATUSES,
  PRODUCT_STATUSES,
  SHOPPING_STATUSES,
  DELIVERY_STATUSES,
  PACKAGE_STATUSES
} from './models';

// Exportar tipos de API
export type {
  // API básica
  ApiError,
  ApiResponse,
  PaginatedApiResponse,
  
  // Autenticación
  LoginCredentials,
  AuthResponse,
  RegisterData,
  
  // Tablas de datos
  TableColumn,
  TableProps,
  
  // Filtros de búsqueda
  BaseFilters,
  UserFilters as ApiUserFilters,
  OrderFilters as ApiOrderFilters,
  ProductFilters as ApiProductFilters,
  ShopFilters as ApiShopFilters,
  BuyingAccountFilters as ApiBuyingAccountFilters,
  ShoppingReceipFilters as ApiShoppingReceipFilters,
  ProductBuyedFilters as ApiProductBuyedFilters,
  ProductReceivedFilters as ApiProductReceivedFilters,
  PackageFilters as ApiPackageFilters,
  DeliverReceipFilters as ApiDeliverReceipFilters,
  
  // Dashboard y métricas
  DashboardMetrics,
  ChartData,
  
  // Formularios
  FormFieldProps,
  FormProps,
  
  // Notificaciones
  NotificationMessage,
  
  // Navegación
  MenuItem,
  BreadcrumbItem,
  
  // Configuración
  AppConfig,
  
  // Archivos y exportación
  ExportOptions,
  FileUploadOptions,
  UploadedFile,
  
  // Roles y permisos
  Permission,
  Role,
  
  // Audit logs
  AuditLog,
  
  // Configuraciones del sistema
  SystemSettings,
  
  // Reportes
  ReportConfig,
  ReportData
} from './api';

// Exportar utilidades y constantes
export {
  // Mapas de etiquetas
  ORDER_STATUS_LABELS,
  PAY_STATUS_LABELS,
  PRODUCT_STATUS_LABELS,
  
  // Colores para estados
  ORDER_STATUS_COLORS,
  PAY_STATUS_COLORS,
  PRODUCT_STATUS_COLORS,
  
  // Funciones de utilidad para usuarios
  getUserFullName,
  getUserRoles,
  hasUserRole,
  USER_ROLE_LABELS,
  
  // Validadores
  isValidEmail,
  isValidPhoneNumber,
  isValidURL,
  
  // Formateadores
  formatCurrency,
  formatDate,
  formatDateTime,
  
  // Constantes para configuración
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  DATE_FORMAT,
  DATETIME_FORMAT,
  
  // Opciones para selects
  ORDER_STATUS_OPTIONS,
  PAY_STATUS_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
  USER_ROLE_OPTIONS,
  
  // Funciones para archivos
  getFileSize,
  isImageFile,
  
  // Funciones para generar IDs
  generateId,
  generateUUID,
  
  // Funciones para búsqueda
  searchInObject,
  
  // Funciones para manejo de errores
  getErrorMessage,
  
  // Funciones para localStorage
  setLocalStorageItem,
  getLocalStorageItem,
  removeLocalStorageItem
} from './utils';
