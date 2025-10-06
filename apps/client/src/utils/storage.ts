/**
 * Storage Utilities - Utilidades para manejo de localStorage
 * 
 * Proporciona funciones helper para persistir y recuperar datos
 * del localStorage de manera segura con manejo de errores.
 */

// Claves para el almacenamiento local
export const STORAGE_KEYS = {
  USER: 'auth_user',
  PERMISSIONS: 'auth_permissions',
  LAST_ACTIVITY: 'auth_last_activity',
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