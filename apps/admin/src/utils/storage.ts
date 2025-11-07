/**
 * Storage Utilities - Utilidades para manejo de localStorage
 * 
 * Proporciona funciones helper para persistir y recuperar datos
 * del localStorage de manera segura con manejo de errores.
 */

// Claves para el almacenamiento local
export const STORAGE_KEYS = {
  USER: 'admin_auth_user',
  PERMISSIONS: 'admin_auth_permissions',
  LAST_ACTIVITY: 'admin_auth_last_activity',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

/**
 * Obtiene un valor del localStorage parseando JSON de manera segura
 */
export function getStoredValue<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    // Error parsing stored value, return default
    if (import.meta.env.DEV) {
      console.warn(`Failed to parse stored value for key: ${key}`);
    }
    return defaultValue;
  }
}

/**
 * Establece un valor en localStorage serializando a JSON
 */
export function setStoredValue(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Error storing value - silent failure in production
    if (import.meta.env.DEV) {
      console.warn(`Failed to store ${key} in localStorage`);
    }
  }
}

/**
 * Remueve un valor del localStorage
 */
export function removeStoredValue(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Error removing value - silent failure
    if (import.meta.env.DEV) {
      console.warn(`Failed to remove ${key} from localStorage`);
    }
  }
}

/**
 * Limpia múltiples valores del localStorage
 */
export function clearStoredValues(keys: string[]): void {
  keys.forEach(key => removeStoredValue(key));
}

/**
 * Verifica si localStorage está disponible
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene el tamaño usado en localStorage en bytes (aproximado)
 */
export function getStorageSize(): number {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

/**
 * Valida la consistencia de los datos de autenticación almacenados
 */
export interface AuthDataValidation {
  isValid: boolean;
  hasToken: boolean;
  hasUser: boolean;
  hasConsistentData: boolean;
  issues: string[];
}

export function validateAuthData(): AuthDataValidation {
  const issues: string[] = [];
  
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  
  const hasToken = !!accessToken;
  const hasUser = !!userStr;
  
  // Caso 1: Token sin usuario
  if (hasToken && !hasUser) {
    issues.push('Token exists but no user data found');
  }
  
  // Caso 2: Usuario sin token
  if (!hasToken && hasUser) {
    issues.push('User data exists but no token found');
  }
  
  // Caso 3: Usuario con datos inválidos
  if (hasUser) {
    try {
      const user = JSON.parse(userStr);
      if (!user || typeof user !== 'object' || !user.id) {
        issues.push('User data is invalid or missing ID');
      }
    } catch {
      issues.push('User data is not valid JSON');
    }
  }
  
  const hasConsistentData = hasToken && hasUser && issues.length === 0;
  const isValid = hasConsistentData || (!hasToken && !hasUser);
  
  return {
    isValid,
    hasToken,
    hasUser,
    hasConsistentData,
    issues,
  };
}

/**
 * Limpia todo el almacenamiento relacionado con autenticación
 */
export function clearAuthStorage(): void {
  clearStoredValues([
    STORAGE_KEYS.USER,
    STORAGE_KEYS.PERMISSIONS,
    STORAGE_KEYS.LAST_ACTIVITY,
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
  ]);
}