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
  BaseFilters,
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
} from '../types';

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
  createBuyingAccount: async (data: Partial<BuyingAccount>): Promise<BuyingAccount> => {
    return apiClient.post('/api_data/buying_account/', data);
  },

  /**
   * Actualizar cuenta de compra
   */
  updateBuyingAccount: async (id: number, data: Partial<BuyingAccount>): Promise<BuyingAccount> => {
    return apiClient.patch(`/api_data/buying_account/${id}/`, data);
  },

  /**
   * Eliminar cuenta de compra
   */
  deleteBuyingAccount: async (id: number): Promise<void> => {
    return apiClient.delete(`/api_data/buying_account/${id}/`);
  },
};

// =============================================================================
// INFORMACIÓN COMÚN
// =============================================================================


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
  getOrderStats: async (period?: string): Promise<unknown> => {
    return apiClient.get('/api_data/dashboard/orders/', { params: { period } });
  },

  /**
   * Obtener estadísticas de productos
   */
  getProductStats: async (period?: string): Promise<unknown> => {
    return apiClient.get('/api_data/dashboard/products/', { params: { period } });
  },

  /**
   * Obtener estadísticas de ventas
   */
  getSalesStats: async (period?: string): Promise<unknown> => {
    return apiClient.get('/api_data/dashboard/sales/', { params: { period } });
  },

  /**
   * Obtener actividad reciente
   */
  getRecentActivity: async (limit?: number): Promise<unknown[]> => {
    return apiClient.get('/api_data/dashboard/activity/', { params: { limit } });
  },
};

// =============================================================================
// UTILIDADES Y EXPORTACIONES
// =============================================================================


// =============================================================================
// SERVICIO PRINCIPAL (LEGACY COMPATIBILITY)
// =============================================================================

/**
 * Servicio API principal para compatibilidad con el código existente
 */
export const apiService = {

  // Dashboard
  getDashboardStats: dashboardService.getDashboardStats,

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
