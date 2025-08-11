/**
 * Utilidades y constantes relacionadas con los tipos de base de datos
 */

import type { 
  OrderStatus, 
  PayStatus, 
  ProductStatus, 
  UserRole,
  CustomUser 
} from './database';

// Mapas de etiquetas para mostrar en la UI
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  "Encargado": "Encargado",
  "Procesando": "Procesando",
  "Completado": "Completado",
  "Cancelado": "Cancelado"
};

export const PAY_STATUS_LABELS: Record<PayStatus, string> = {
  "No pagado": "No pagado",
  "Pagado": "Pagado",
  "Parcial": "Parcial"
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  "Encargado": "Encargado",
  "Comprado": "Comprado",
  "Recibido": "Recibido",
  "Entregado": "Entregado"
};

// Colores para estados
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  "Encargado": "blue",
  "Procesando": "orange", 
  "Completado": "green",
  "Cancelado": "red"
};

export const PAY_STATUS_COLORS: Record<PayStatus, string> = {
  "No pagado": "red",
  "Pagado": "green",
  "Parcial": "orange"
};

export const PRODUCT_STATUS_COLORS: Record<ProductStatus, string> = {
  "Encargado": "blue",
  "Comprado": "orange",
  "Recibido": "purple",
  "Entregado": "green"
};

// Funciones de utilidad para usuarios
export const getUserFullName = (user: CustomUser): string => {
  return `${user.name} ${user.last_name}`.trim();
};

export const getUserRoles = (user: CustomUser): UserRole[] => {
  const roles: UserRole[] = [];
  
  if (user.is_agent) roles.push('agent');
  if (user.is_accountant) roles.push('accountant');
  if (user.is_buyer) roles.push('buyer');
  if (user.is_logistical) roles.push('logistical');
  if (user.is_comunity_manager) roles.push('community_manager');
  
  return roles;
};

export const hasUserRole = (user: CustomUser, role: UserRole): boolean => {
  switch (role) {
    case 'agent':
      return user.is_agent;
    case 'accountant':
      return user.is_accountant;
    case 'buyer':
      return user.is_buyer;
    case 'logistical':
      return user.is_logistical;
    case 'community_manager':
      return user.is_comunity_manager;
    default:
      return false;
  }
};

// Etiquetas para roles
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  agent: "Agente",
  accountant: "Contador",
  buyer: "Comprador",
  logistical: "Logística",
  community_manager: "Community Manager"
};

// Validadores
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Formateadores
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Constantes para configuración
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';

// Opciones para selects
export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const PAY_STATUS_OPTIONS = Object.entries(PAY_STATUS_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const PRODUCT_STATUS_OPTIONS = Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const USER_ROLE_OPTIONS = Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
  value,
  label
}));

// Funciones para trabajar con archivos
export const getFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(extension);
};

// Funciones para generar IDs únicos
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Funciones para búsqueda y filtrado
export const searchInObject = (obj: Record<string, unknown>, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase();
  
  return Object.values(obj).some(value => {
    if (typeof value === 'string') {
      return value.toLowerCase().includes(term);
    }
    if (typeof value === 'number') {
      return value.toString().includes(term);
    }
    if (typeof value === 'object' && value !== null) {
      return searchInObject(value as Record<string, unknown>, term);
    }
    return false;
  });
};

// Funciones para manejo de errores
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Ha ocurrido un error desconocido';
};

// Funciones para localStorage
export const setLocalStorageItem = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const removeLocalStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};
