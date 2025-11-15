/**
 * Archivo de índice para exportar todos los tipos de modelos
 */

// Tipos base y estados
export type {
  ID,
  UUID,
  DateTime,
  Date,
  OrderStatus,
  PayStatus,
  ProductStatus,
  ShoppingStatus,
  DeliveryStatus,
  PackageStatus,
  UserRole
} from './base';

export {
  ORDER_STATUSES,
  PAY_STATUSES,
  PRODUCT_STATUSES,
  SHOPPING_STATUSES,
  DELIVERY_STATUSES,
  PACKAGE_STATUSES
} from './base';

// Modelo de Usuario
export type {
  CustomUser,
  CreateUserData,
  UpdateUserData,
  UserFilters,
  UserPermissions
} from './user';

// Modelo de Tienda
export type {
  Shop,
  CreateShopData,
  UpdateShopData
} from './shop';

// Modelo de Pedido
export type {
  Order,
  CreateOrderData,
  UpdateOrderData,
  OrderFilters,
  OrderStats
} from './order';

// Modelo de Producto
export type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductFilters
} from './product';

// Modelo de Imágenes de evidencia
export type {
  EvidenceImage,
  CreateEvidenceImageData
} from './evidence';

// Modelo de Cuenta de compra
export type {
  BuyingAccount,
  CreateBuyingAccountData,
  UpdateBuyingAccountData
} from './buying-account';

// Modelo de Información común
export type {
  CommonInformation,
  UpdateCommonInformationData
} from './common-info';

// Modelo de Recibo de compra
export type {
  ShoppingReceip,
  CreateShoppingReceipData,
  UpdateShoppingReceipData
} from './shopping-receip';

// Modelo de Entrega
export type {
  DeliverReceip,
  CreateDeliverReceipData,
  UpdateDeliverReceipData
} from './delivery';

// Modelo de Paquete
export type {
  Package,
  CreatePackageData,
  UpdatePackageData
} from './package';

// Modelo de Producto comprado
export type {
  ProductBuyed,
  CreateProductBuyedData,
  UpdateProductBuyedData
} from './product-buyed';

// Modelo de Producto recibido
export type {
  ProductReceived,
  CreateProductReceivedData,
  UpdateProductReceivedData
} from './product-received';

// Modelo de Producto entregado
export type {
  ProductDelivery,
  CreateProductDeliveryData,
  UpdateProductDeliveryData
} from './product-delivery';

// Modelo de Métricas Esperadas
export type {
  ExpectedMetrics,
  CreateExpectedMetricsData,
  UpdateExpectedMetricsData,
  ExpectedMetricsFilters,
  ExpectedMetricsSummary,
  CalculateActualsResponse,
  ExpectedMetricsListItem
} from './expected-metrics';

// Estadísticas del dashboard
export type {
  DashboardStats
} from './dashboard';

// Sistema de notificaciones
export type {
  Notification,
  NotificationType,
  NotificationPriority,
  CreateNotificationData,
  UpdateNotificationData,
  NotificationFilters,
  NotificationStats,
  NotificationPreference,
  UpdateNotificationPreferenceData,
  NotificationGroup,
  GroupedNotificationsResponse,
  MarkAsReadData,
  UnreadCountResponse,
  NotificationSSEEvent,
  SSEState,
  SSEConfig
} from './notification';

export {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_PRIORITY_LABELS,
  notificationTypeUtils,
  notificationPriorityUtils
} from './notification';
