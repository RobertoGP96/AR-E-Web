/**
 * Exportación central de todos los tipos
 */

// Tipos base
export * from './base';

// Modelos principales  
export type { CustomUser, CreateUserData, UpdateUserData } from './user';
export type { Order, CreateOrderData, UpdateOrderData, OrderFilters as OrderTableFilters } from './order';
export type { Product, CreateProductData, UpdateProductData, ProductFilters as ProductTableFilters } from './product';
export type { DeliverReceip, CreateDeliverReceipData, UpdateDeliverReceipData, DeliverReceipFilters } from './delivery';
export type { EvidenceImage, CreateEvidenceImageData } from './evidence';
export type { Shop, CreateShopData, UpdateShopData, ShopFilters } from './shop';
export type { Package, CreatePackageData, UpdatePackageData, PackageFilters } from './package';
export type { BuyingAccount, CreateBuyingAccountData, UpdateBuyingAccountData, BuyingAccountFilters } from './buying-account';
export type { CommonInformation, CreateCommonInformationData, UpdateCommonInformationData } from './common-information';
export type { ShoppingReceip, CreateShoppingReceipData, UpdateShoppingReceipData, ShoppingReceipFilters } from './shopping-receip';
export type { ProductBuyed, CreateProductBuyedData, UpdateProductBuyedData, ProductBuyedFilters } from './product-buyed';
export type { ProductReceived, CreateProductReceivedData, UpdateProductReceivedData, ProductReceivedFilters } from './product-received';

// Tipos de API (sin conflictos)
export type { 
  ApiError, 
  ApiResponse, 
  PaginatedApiResponse, 
  LoginCredentials, 
  AuthResponse, 
  RegisterData,
  TableColumn,
  TableProps,
  BaseFilters,
  DashboardMetrics,
  ChartData,
  FormFieldProps,
  FormProps,
  NotificationMessage,
  MenuItem,
  BreadcrumbItem,
  AppConfig,
  ExportOptions,
  FileUploadOptions,
  UploadedFile,
  Permission,
  Role,
  AuditLog,
  SystemSettings,
  ReportConfig,
  ReportData
} from './api';