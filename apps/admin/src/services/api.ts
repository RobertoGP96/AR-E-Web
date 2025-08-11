/**
 * API Service - Servicio para consumir los endpoints específicos del backend Django
 * 
 * Este módulo define todas las funciones para interactuar con la API del backend,
 * organizadas por módulos y funcionalidades.
 */

import { apiClient } from '../lib/api-client';
import type { 
  ApiResponse, 
  PaginatedApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  BaseFilters,
  UserFilters,
  OrderFilters,
  ProductFilters,
  DashboardMetrics
} from '../types/api';

// Importar tipos del backend
import type {
  CustomUser,
  Order,
  Product,
  Shop,
  BuyingAccount,
  CommonInformation,
  ShoppingReceip,
  ProductBuyed,
  ProductReceived,
  Package,
  DeliverReceip
} from '../types/database';

// =============================================================================
// AUTENTICACIÓN
// =============================================================================

export const authService = {
  /**
   * Iniciar sesión
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient.login(credentials);
  },

  /**
   * Registrar nuevo usuario
   */
  register: async (userData: RegisterData): Promise<ApiResponse<CustomUser>> => {
    return apiClient.register(userData) as Promise<ApiResponse<CustomUser>>;
  },

  /**
   * Cerrar sesión
   */
  logout: async (): Promise<void> => {
    return apiClient.logout();
  },

  /**
   * Obtener usuario actual
   */
  getCurrentUser: async (): Promise<ApiResponse<CustomUser>> => {
    return apiClient.get('/api_data/user/me/');
  },

  /**
   * Verificar usuario por email
   */
  verifyUser: async (verificationSecret: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.get(`/verify_user/${verificationSecret}`);
  },

  /**
   * Refrescar token
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/token/refresh/', { refresh: refreshToken }, { skipAuth: true });
    return response as unknown as AuthResponse;
  },
};

// =============================================================================
// USUARIOS
// =============================================================================

export const userService = {
  /**
   * Obtener lista de usuarios con paginación
   */
  getUsers: async (filters?: UserFilters): Promise<PaginatedApiResponse<CustomUser>> => {
    return apiClient.getPaginated('/api_data/user/', filters as BaseFilters);
  },

  /**
   * Obtener usuario por ID
   */
  getUserById: async (id: number): Promise<ApiResponse<CustomUser>> => {
    return apiClient.get(`/api_data/user/${id}/`);
  },

  /**
   * Crear nuevo usuario
   */
  createUser: async (userData: Partial<CustomUser>): Promise<ApiResponse<CustomUser>> => {
    return apiClient.post('/api_data/user/', userData);
  },

  /**
   * Actualizar usuario
   */
  updateUser: async (id: number, userData: Partial<CustomUser>): Promise<ApiResponse<CustomUser>> => {
    return apiClient.patch(`/api_data/user/${id}/`, userData);
  },

  /**
   * Eliminar usuario
   */
  deleteUser: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api_data/user/${id}/`);
  },

  /**
   * Cambiar estado activo del usuario
   */
  toggleUserStatus: async (id: number, isActive: boolean): Promise<ApiResponse<CustomUser>> => {
    return apiClient.patch(`/api_data/user/${id}/`, { is_active: isActive });
  },

  /**
   * Cambiar rol del usuario
   */
  updateUserRole: async (id: number, roleData: {
    is_agent?: boolean;
    is_accountant?: boolean;
    is_buyer?: boolean;
    is_logistical?: boolean;
    is_comunity_manager?: boolean;
  }): Promise<ApiResponse<CustomUser>> => {
    return apiClient.patch(`/api_data/user/${id}/`, roleData);
  },
};

// =============================================================================
// ÓRDENES
// =============================================================================

export const orderService = {
  /**
   * Obtener lista de órdenes
   */
  getOrders: async (filters?: OrderFilters): Promise<PaginatedApiResponse<Order>> => {
    return apiClient.getPaginated('/api_data/order/', filters as BaseFilters);
  },

  /**
   * Obtener orden por ID
   */
  getOrderById: async (id: number): Promise<ApiResponse<Order>> => {
    return apiClient.get(`/api_data/order/${id}/`);
  },

  /**
   * Crear nueva orden
   */
  createOrder: async (orderData: Partial<Order>): Promise<ApiResponse<Order>> => {
    return apiClient.post('/api_data/order/', orderData);
  },

  /**
   * Actualizar orden
   */
  updateOrder: async (id: number, orderData: Partial<Order>): Promise<ApiResponse<Order>> => {
    return apiClient.patch(`/api_data/order/${id}/`, orderData);
  },

  /**
   * Eliminar orden
   */
  deleteOrder: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api_data/order/${id}/`);
  },

  /**
   * Actualizar estado de orden
   */
  updateOrderStatus: async (id: number, status: string): Promise<ApiResponse<Order>> => {
    return apiClient.patch(`/api_data/order/${id}/`, { status });
  },

  /**
   * Actualizar estado de pago
   */
  updatePaymentStatus: async (id: number, payStatus: string): Promise<ApiResponse<Order>> => {
    return apiClient.patch(`/api_data/order/${id}/`, { pay_status: payStatus });
  },

  /**
   * Obtener productos de una orden
   */
  getOrderProducts: async (orderId: number): Promise<PaginatedApiResponse<ProductBuyed>> => {
    return apiClient.getPaginated('/api_data/buyed_product/', { order: orderId } as BaseFilters);
  },
};

// =============================================================================
// PRODUCTOS
// =============================================================================

export const productService = {
  /**
   * Obtener lista de productos
   */
  getProducts: async (filters?: ProductFilters): Promise<PaginatedApiResponse<Product>> => {
    return apiClient.getPaginated('/api_data/product/', filters as BaseFilters);
  },

  /**
   * Obtener producto por ID
   */
  getProductById: async (id: number): Promise<ApiResponse<Product>> => {
    return apiClient.get(`/api_data/product/${id}/`);
  },

  /**
   * Crear nuevo producto
   */
  createProduct: async (productData: Partial<Product>): Promise<ApiResponse<Product>> => {
    return apiClient.post('/api_data/product/', productData);
  },

  /**
   * Actualizar producto
   */
  updateProduct: async (id: number, productData: Partial<Product>): Promise<ApiResponse<Product>> => {
    return apiClient.patch(`/api_data/product/${id}/`, productData);
  },

  /**
   * Eliminar producto
   */
  deleteProduct: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api_data/product/${id}/`);
  },

  /**
   * Subir imagen de producto
   */
  uploadProductImage: async (productId: number, image: File): Promise<ApiResponse<Product>> => {
    const response = await apiClient.uploadFile(`/api_data/product/${productId}/upload_image/`, image);
    return response as ApiResponse<Product>;
  },

  /**
   * Obtener productos comprados
   */
  getBuyedProducts: async (filters?: BaseFilters & { order?: number }): Promise<PaginatedApiResponse<ProductBuyed>> => {
    return apiClient.getPaginated('/api_data/buyed_product/', filters as BaseFilters);
  },

  /**
   * Crear producto comprado
   */
  createBuyedProduct: async (data: Partial<ProductBuyed>): Promise<ApiResponse<ProductBuyed>> => {
    return apiClient.post('/api_data/buyed_product/', data);
  },

  /**
   * Obtener productos recibidos
   */
  getReceivedProducts: async (filters?: BaseFilters): Promise<PaginatedApiResponse<ProductReceived>> => {
    return apiClient.getPaginated('/api_data/product_received/', filters as BaseFilters);
  },

  /**
   * Crear producto recibido
   */
  createReceivedProduct: async (data: Partial<ProductReceived>): Promise<ApiResponse<ProductReceived>> => {
    return apiClient.post('/api_data/product_received/', data);
  },
};

// =============================================================================
// TIENDAS
// =============================================================================

export const shopService = {
  /**
   * Obtener lista de tiendas
   */
  getShops: async (filters?: BaseFilters): Promise<PaginatedApiResponse<Shop>> => {
    return apiClient.getPaginated('/api_data/shop/', filters as BaseFilters);
  },

  /**
   * Obtener tienda por ID
   */
  getShopById: async (id: number): Promise<ApiResponse<Shop>> => {
    return apiClient.get(`/api_data/shop/${id}/`);
  },

  /**
   * Crear nueva tienda
   */
  createShop: async (shopData: Partial<Shop>): Promise<ApiResponse<Shop>> => {
    return apiClient.post('/api_data/shop/', shopData);
  },

  /**
   * Actualizar tienda
   */
  updateShop: async (id: number, shopData: Partial<Shop>): Promise<ApiResponse<Shop>> => {
    return apiClient.patch(`/api_data/shop/${id}/`, shopData);
  },

  /**
   * Eliminar tienda
   */
  deleteShop: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api_data/shop/${id}/`);
  },

  /**
   * Obtener productos de una tienda
   */
  getShopProducts: async (shopId: number, filters?: ProductFilters): Promise<PaginatedApiResponse<Product>> => {
    return apiClient.getPaginated('/api_data/product/', { ...filters, shop: shopId } as BaseFilters);
  },
};

// =============================================================================
// CUENTAS DE COMPRA
// =============================================================================

export const buyingAccountService = {
  /**
   * Obtener cuentas de compra
   */
  getBuyingAccounts: async (filters?: BaseFilters): Promise<PaginatedApiResponse<BuyingAccount>> => {
    return apiClient.getPaginated('/api_data/buying_account/', filters as Record<string, unknown>);
  },

  /**
   * Crear cuenta de compra
   */
  createBuyingAccount: async (data: Partial<BuyingAccount>): Promise<ApiResponse<BuyingAccount>> => {
    return apiClient.post('/api_data/buying_account/', data);
  },

  /**
   * Actualizar cuenta de compra
   */
  updateBuyingAccount: async (id: number, data: Partial<BuyingAccount>): Promise<ApiResponse<BuyingAccount>> => {
    return apiClient.patch(`/api_data/buying_account/${id}/`, data);
  },

  /**
   * Eliminar cuenta de compra
   */
  deleteBuyingAccount: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api_data/buying_account/${id}/`);
  },
};

// =============================================================================
// INFORMACIÓN COMÚN
// =============================================================================

export const commonInfoService = {
  /**
   * Obtener información común
   */
  getCommonInfo: async (filters?: BaseFilters): Promise<PaginatedApiResponse<CommonInformation>> => {
    return apiClient.getPaginated('/api_data/common_information/', filters as BaseFilters);
  },

  /**
   * Crear información común
   */
  createCommonInfo: async (data: Partial<CommonInformation>): Promise<ApiResponse<CommonInformation>> => {
    return apiClient.post('/api_data/common_information/', data);
  },

  /**
   * Actualizar información común
   */
  updateCommonInfo: async (id: number, data: Partial<CommonInformation>): Promise<ApiResponse<CommonInformation>> => {
    return apiClient.patch(`/api_data/common_information/${id}/`, data);
  },

  /**
   * Eliminar información común
   */
  deleteCommonInfo: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api_data/common_information/${id}/`);
  },
};

// =============================================================================
// RECIBOS DE COMPRA
// =============================================================================

export const shoppingReceipService = {
  /**
   * Obtener recibos de compra
   */
  getShoppingReceipts: async (filters?: BaseFilters): Promise<PaginatedApiResponse<ShoppingReceip>> => {
    return apiClient.getPaginated('/api_data/shopping_reciep/', filters as BaseFilters);
  },

  /**
   * Crear recibo de compra
   */
  createShoppingReceipt: async (data: Partial<ShoppingReceip>): Promise<ApiResponse<ShoppingReceip>> => {
    return apiClient.post('/api_data/shopping_reciep/', data);
  },

  /**
   * Actualizar recibo de compra
   */
  updateShoppingReceipt: async (id: number, data: Partial<ShoppingReceip>): Promise<ApiResponse<ShoppingReceip>> => {
    return apiClient.patch(`/api_data/shopping_reciep/${id}/`, data);
  },

  /**
   * Eliminar recibo de compra
   */
  deleteShoppingReceipt: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api_data/shopping_reciep/${id}/`);
  },
};

// =============================================================================
// PAQUETES
// =============================================================================

export const packageService = {
  /**
   * Obtener paquetes
   */
  getPackages: async (filters?: BaseFilters): Promise<PaginatedApiResponse<Package>> => {
    return apiClient.getPaginated('/api_data/package/', filters as BaseFilters);
  },

  /**
   * Obtener paquete por ID
   */
  getPackageById: async (id: number): Promise<ApiResponse<Package>> => {
    return apiClient.get(`/api_data/package/${id}/`);
  },

  /**
   * Crear paquete
   */
  createPackage: async (data: Partial<Package>): Promise<ApiResponse<Package>> => {
    return apiClient.post('/api_data/package/', data);
  },

  /**
   * Actualizar paquete
   */
  updatePackage: async (id: number, data: Partial<Package>): Promise<ApiResponse<Package>> => {
    return apiClient.patch(`/api_data/package/${id}/`, data);
  },

  /**
   * Eliminar paquete
   */
  deletePackage: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api_data/package/${id}/`);
  },

  /**
   * Actualizar estado del paquete
   */
  updatePackageStatus: async (id: number, status: string): Promise<ApiResponse<Package>> => {
    return apiClient.patch(`/api_data/package/${id}/`, { status });
  },
};

// =============================================================================
// RECIBOS DE ENTREGA
// =============================================================================

export const deliveryReceipService = {
  /**
   * Obtener recibos de entrega
   */
  getDeliveryReceipts: async (filters?: BaseFilters): Promise<PaginatedApiResponse<DeliverReceip>> => {
    return apiClient.getPaginated('/api_data/deliver_reciep/', filters as BaseFilters);
  },

  /**
   * Crear recibo de entrega
   */
  createDeliveryReceipt: async (data: Partial<DeliverReceip>): Promise<ApiResponse<DeliverReceip>> => {
    return apiClient.post('/api_data/deliver_reciep/', data);
  },

  /**
   * Actualizar recibo de entrega
   */
  updateDeliveryReceipt: async (id: number, data: Partial<DeliverReceip>): Promise<ApiResponse<DeliverReceip>> => {
    return apiClient.patch(`/api_data/deliver_reciep/${id}/`, data);
  },

  /**
   * Eliminar recibo de entrega
   */
  deleteDeliveryReceipt: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api_data/deliver_reciep/${id}/`);
  },
};

// =============================================================================
// DASHBOARD Y ESTADÍSTICAS
// =============================================================================

export const dashboardService = {
  /**
   * Obtener métricas del dashboard
   */
  getDashboardStats: async (): Promise<ApiResponse<DashboardMetrics>> => {
    return apiClient.get('/api_data/dashboard/stats/');
  },

  /**
   * Obtener estadísticas de órdenes
   */
  getOrderStats: async (period?: string): Promise<ApiResponse<unknown>> => {
    return apiClient.get('/api_data/dashboard/orders/', { params: { period } });
  },

  /**
   * Obtener estadísticas de productos
   */
  getProductStats: async (period?: string): Promise<ApiResponse<unknown>> => {
    return apiClient.get('/api_data/dashboard/products/', { params: { period } });
  },

  /**
   * Obtener estadísticas de ventas
   */
  getSalesStats: async (period?: string): Promise<ApiResponse<unknown>> => {
    return apiClient.get('/api_data/dashboard/sales/', { params: { period } });
  },

  /**
   * Obtener actividad reciente
   */
  getRecentActivity: async (limit?: number): Promise<ApiResponse<unknown[]>> => {
    return apiClient.get('/api_data/dashboard/activity/', { params: { limit } });
  },
};

// =============================================================================
// UTILIDADES Y EXPORTACIONES
// =============================================================================

export const utilService = {
  /**
   * Exportar datos a CSV
   */
  exportToCsv: async (endpoint: string, filters?: Record<string, unknown>): Promise<void> => {
    return apiClient.downloadFile(`${endpoint}export/csv/`, `export-${Date.now()}.csv`, {
      params: filters,
    });
  },

  /**
   * Exportar datos a Excel
   */
  exportToExcel: async (endpoint: string, filters?: Record<string, unknown>): Promise<void> => {
    return apiClient.downloadFile(`${endpoint}export/excel/`, `export-${Date.now()}.xlsx`, {
      params: filters,
    });
  },

  /**
   * Subir archivo genérico
   */
  uploadFile: async (endpoint: string, file: File): Promise<ApiResponse<unknown>> => {
    return apiClient.uploadFile(endpoint, file);
  },

  /**
   * Verificar salud de la API
   */
  healthCheck: async (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
    return apiClient.get('/health/', { skipAuth: true });
  },
};

// =============================================================================
// SERVICIO PRINCIPAL (LEGACY COMPATIBILITY)
// =============================================================================

/**
 * Servicio API principal para compatibilidad con el código existente
 */
export const apiService = {
  // Auth
  login: authService.login,
  register: authService.register,
  logout: authService.logout,
  getCurrentUser: authService.getCurrentUser,

  // Dashboard
  getDashboardStats: dashboardService.getDashboardStats,

  // Users
  getUsers: userService.getUsers,
  createUser: userService.createUser,
  updateUser: userService.updateUser,
  deleteUser: userService.deleteUser,

  // Products
  getProducts: productService.getProducts,
  createProduct: productService.createProduct,
  updateProduct: productService.updateProduct,
  deleteProduct: productService.deleteProduct,

  // Orders
  getOrders: orderService.getOrders,
  updateOrderStatus: orderService.updateOrderStatus,

  // Shops
  getShops: shopService.getShops,
  createShop: shopService.createShop,
  updateShop: shopService.updateShop,
  deleteShop: shopService.deleteShop,
};

// Exportar tipos para uso externo
export type {
  CustomUser,
  Order,
  Product,
  Shop,
  BuyingAccount,
  CommonInformation,
  ShoppingReceip,
  ProductBuyed,
  ProductReceived,
  Package,
  DeliverReceip
};
