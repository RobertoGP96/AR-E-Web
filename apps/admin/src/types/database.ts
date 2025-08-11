/**
 * Tipos TypeScript para los modelos de la base de datos
 * Generados a partir de los modelos de Django en backend/api/models.py
 */

// Tipos base para campos comunes
export type ID = number;
export type UUID = string;
export type DateTime = string; // ISO string format
export type Date = string; // ISO date format

// Union types para estados
export type OrderStatus = "Encargado" | "Procesando" | "Completado" | "Cancelado";
export type PayStatus = "No pagado" | "Pagado" | "Parcial";
export type ProductStatus = "Encargado" | "Comprado" | "Recibido" | "Entregado";
export type ShoppingStatus = "No pagado" | "Pagado" | "Procesando";
export type DeliveryStatus = "Enviado" | "En tránsito" | "Entregado";
export type PackageStatus = "Enviado" | "En tránsito" | "Recibido";

// Constantes para los valores
export const ORDER_STATUSES = {
  ENCARGADO: "Encargado",
  PROCESANDO: "Procesando", 
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado"
} as const;

export const PAY_STATUSES = {
  NO_PAGADO: "No pagado",
  PAGADO: "Pagado",
  PARCIAL: "Parcial"
} as const;

export const PRODUCT_STATUSES = {
  ENCARGADO: "Encargado",
  COMPRADO: "Comprado",
  RECIBIDO: "Recibido",
  ENTREGADO: "Entregado"
} as const;

export const SHOPPING_STATUSES = {
  NO_PAGADO: "No pagado",
  PAGADO: "Pagado",
  PROCESANDO: "Procesando"
} as const;

export const DELIVERY_STATUSES = {
  ENVIADO: "Enviado",
  EN_TRANSITO: "En tránsito",
  ENTREGADO: "Entregado"
} as const;

export const PACKAGE_STATUSES = {
  ENVIADO: "Enviado",
  EN_TRANSITO: "En tránsito",
  RECIBIDO: "Recibido"
} as const;

// Tipos de usuario
export interface CustomUser {
  id: ID;
  email: string;
  name: string;
  last_name: string;
  home_address: string;
  phone_number: string;
  
  // Roles
  is_agent: boolean;
  is_accountant: boolean;
  is_buyer: boolean;
  is_logistical: boolean;
  is_comunity_manager: boolean;
  agent_profit: number;
  
  // Gestión de cuenta
  is_staff: boolean;
  is_active: boolean;
  is_verified: boolean;
  date_joined: DateTime;
  sent_verification_email: boolean;
  verification_secret?: string;
  password_secret?: string;
  
  // Propiedades computadas
  full_name: string;
}

// Formularios para crear/editar usuario
export interface CreateUserData {
  email: string;
  name: string;
  last_name: string;
  home_address: string;
  phone_number: string;
  password: string;
  is_agent?: boolean;
  is_accountant?: boolean;
  is_buyer?: boolean;
  is_logistical?: boolean;
  is_comunity_manager?: boolean;
  agent_profit?: number;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: ID;
}

// Tipos de tienda
export interface Shop {
  id: ID;
  name: string;
  link: string;
}

export interface CreateShopData {
  name: string;
  link: string;
}

export interface UpdateShopData extends Partial<CreateShopData> {
  id: ID;
}

// Cuentas de compra
export interface BuyingAccount {
  id: ID;
  account_name: string;
}

export interface CreateBuyingAccountData {
  account_name: string;
}

export interface UpdateBuyingAccountData extends Partial<CreateBuyingAccountData> {
  id: ID;
}

// Información común
export interface CommonInformation {
  id: ID;
  change_rate: number;
  cost_per_pound: number;
}

export interface UpdateCommonInformationData {
  change_rate?: number;
  cost_per_pound?: number;
}

// Imágenes de evidencia
export interface EvidenceImage {
  id: ID;
  public_id?: string;
  image_url: string;
}

export interface CreateEvidenceImageData {
  public_id?: string;
  image_url: string;
}

// Pedidos
export interface Order {
  id: ID;
  client: CustomUser;
  sales_manager: CustomUser;
  status: OrderStatus;
  pay_status: PayStatus;
  
  // Propiedades computadas
  total_cost: number;
  received_products: DeliverReceip[];
  received_value_of_client: number;
  extra_payments: number;
}

export interface CreateOrderData {
  client_id: ID;
  sales_manager_id: ID;
  status?: OrderStatus;
  pay_status?: PayStatus;
}

export interface UpdateOrderData extends Partial<CreateOrderData> {
  id: ID;
}

// Productos
export interface Product {
  id: UUID;
  sku: string;
  name: string;
  link?: string;
  shop: Shop;
  description?: string;
  observation?: string;
  category?: string;
  amount_requested: number;
  order: Order;
  status: ProductStatus;
  product_pictures: EvidenceImage[];
  
  // Precios
  shop_cost: number;
  shop_delivery_cost: number;
  shop_taxes: number;
  own_taxes: number;
  added_taxes: number;
  total_cost: number;
  
  // Propiedades computadas
  cost_per_product: number;
  amount_buyed: number;
  amount_received: number;
  amount_delivered: number;
}

export interface CreateProductData {
  sku: string;
  name: string;
  link?: string;
  shop_id: ID;
  description?: string;
  observation?: string;
  category?: string;
  amount_requested: number;
  order_id: ID;
  status?: ProductStatus;
  shop_cost: number;
  shop_delivery_cost?: number;
  shop_taxes?: number;
  own_taxes?: number;
  added_taxes?: number;
  total_cost?: number;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: UUID;
}

// Recibos de compra
export interface ShoppingReceip {
  id: ID;
  shopping_account: BuyingAccount;
  shop_of_buy: Shop;
  status_of_shopping: ShoppingStatus;
  buy_date: DateTime;
  
  // Propiedades computadas
  total_cost_of_shopping: number;
}

export interface CreateShoppingReceipData {
  shopping_account_id: ID;
  shop_of_buy_id: ID;
  status_of_shopping?: ShoppingStatus;
  buy_date?: DateTime;
}

export interface UpdateShoppingReceipData extends Partial<CreateShoppingReceipData> {
  id: ID;
}

// Recibos de entrega
export interface DeliverReceip {
  id: ID;
  order: Order;
  weight: number;
  status: DeliveryStatus;
  deliver_date: DateTime;
  deliver_picture: EvidenceImage[];
  
  // Propiedades computadas
  total_cost_of_deliver: number;
}

export interface CreateDeliverReceipData {
  order_id: ID;
  weight: number;
  status?: DeliveryStatus;
  deliver_date?: DateTime;
}

export interface UpdateDeliverReceipData extends Partial<CreateDeliverReceipData> {
  id: ID;
}

// Paquetes
export interface Package {
  id: ID;
  agency_name: string;
  number_of_tracking: string;
  status_of_processing: PackageStatus;
  package_picture: EvidenceImage[];
}

export interface CreatePackageData {
  agency_name: string;
  number_of_tracking: string;
  status_of_processing?: PackageStatus;
}

export interface UpdatePackageData extends Partial<CreatePackageData> {
  id: ID;
}

// Productos comprados
export interface ProductBuyed {
  id: ID;
  original_product: Product;
  order: Order;
  actual_cost_of_product: number;
  shop_discount: number;
  offer_discount: number;
  buy_date: DateTime;
  shoping_receip: ShoppingReceip;
  amount_buyed: number;
  observation?: string;
  real_cost_of_product: number;
}

export interface CreateProductBuyedData {
  original_product_id: UUID;
  order_id: ID;
  actual_cost_of_product: number;
  shop_discount?: number;
  offer_discount?: number;
  buy_date?: DateTime;
  shoping_receip_id: ID;
  amount_buyed: number;
  observation?: string;
  real_cost_of_product: number;
}

export interface UpdateProductBuyedData extends Partial<CreateProductBuyedData> {
  id: ID;
}

// Productos recibidos
export interface ProductReceived {
  id: ID;
  original_product: Product;
  order: Order;
  reception_date_in_eeuu: Date;
  reception_date_in_cuba?: Date;
  package_where_was_send: Package;
  deliver_receip?: DeliverReceip;
  amount_received: number;
  amount_delivered: number;
  observation?: string;
}

export interface CreateProductReceivedData {
  original_product_id: UUID;
  order_id: ID;
  reception_date_in_eeuu: Date;
  reception_date_in_cuba?: Date;
  package_where_was_send_id: ID;
  deliver_receip_id?: ID;
  amount_received: number;
  amount_delivered?: number;
  observation?: string;
}

export interface UpdateProductReceivedData extends Partial<CreateProductReceivedData> {
  id: ID;
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Tipos para filtros y búsquedas
export interface OrderFilters {
  status?: OrderStatus;
  pay_status?: PayStatus;
  client_id?: ID;
  sales_manager_id?: ID;
  date_from?: Date;
  date_to?: Date;
}

export interface ProductFilters {
  status?: ProductStatus;
  shop_id?: ID;
  order_id?: ID;
  category?: string;
  name?: string;
}

export interface UserFilters {
  is_active?: boolean;
  is_verified?: boolean;
  is_agent?: boolean;
  is_accountant?: boolean;
  is_buyer?: boolean;
  is_logistical?: boolean;
  is_comunity_manager?: boolean;
  search?: string;
}

// Tipos para estadísticas del dashboard
export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_products: number;
  total_users: number;
  total_revenue: number;
  monthly_revenue: number;
  weekly_revenue: number;
}

export interface OrderStats {
  total_cost: number;
  products_count: number;
  status: OrderStatus;
  pay_status: PayStatus;
  created_date: DateTime;
}

// Tipos de roles de usuario
export type UserRole = 'agent' | 'accountant' | 'buyer' | 'logistical' | 'community_manager';

// Permisos
export interface UserPermissions {
  can_create_orders: boolean;
  can_edit_orders: boolean;
  can_delete_orders: boolean;
  can_manage_users: boolean;
  can_manage_products: boolean;
  can_manage_shops: boolean;
  can_view_analytics: boolean;
  can_manage_deliveries: boolean;
}
