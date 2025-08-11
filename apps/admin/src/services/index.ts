/**
 * Servicios de la aplicación
 * Barrel export para todos los servicios organizados por módulos
 */

// Servicios de usuarios
export * from './users';

// Servicios de autenticación
export * from './auth';

// Servicios de órdenes
export * from './orders';

// Servicios de productos
export * from './products';

// Servicios de tiendas
export * from './shops';

// Servicios de paquetes
export * from './packages';

// Servicios de analytics y reportes
export * from './analytics';

// Servicios de archivos
export * from './files';

// Reexport del cliente API
export { apiClient } from '../lib/api-client';
