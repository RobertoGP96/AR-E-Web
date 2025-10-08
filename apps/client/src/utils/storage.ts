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
    // Verificar si localStorage está disponible
    if (!isStorageAvailable()) {
      if (import.meta.env.DEV) {
        console.warn('localStorage not available, returning default value');
      }
      return defaultValue;
    }

    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') {
      return defaultValue;
    }
    
    const parsed = JSON.parse(item) as T;
    
    // Validación adicional para objetos
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      if (typeof parsed !== 'object' || parsed === null) {
        if (import.meta.env.DEV) {
          console.warn(`Invalid stored object for key: ${key}, returning default`);
        }
        return defaultValue;
      }
    }
    
    return parsed;
  } catch (error) {
    // Error parsing stored value, return default
    if (import.meta.env.DEV) {
      console.warn(`Failed to parse stored value for key: ${key}`, error);
    }
    // Limpiar valor corrupto
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent failure if can't remove
    }
    return defaultValue;
  }
}

/**
 * Establece un valor en localStorage serializando a JSON
 */
export function setStoredValue(key: string, value: unknown): boolean {
  try {
    if (!isStorageAvailable()) {
      if (import.meta.env.DEV) {
        console.warn('localStorage not available, cannot store value');
      }
      return false;
    }

    // Validar que el valor se puede serializar
    const serialized = JSON.stringify(value);
    
    // Verificar límites de almacenamiento antes de guardar
    const currentSize = getStorageSize();
    const newValueSize = serialized.length + key.length;
    const maxSize = 5 * 1024 * 1024; // 5MB aproximadamente
    
    if (currentSize + newValueSize > maxSize) {
      if (import.meta.env.DEV) {
        console.warn(`Storage quota would be exceeded for key: ${key}`);
      }
      return false;
    }
    
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    // Error storing value - may be quota exceeded or other storage issues
    if (import.meta.env.DEV) {
      console.warn(`Failed to store ${key} in localStorage`, error);
    }
    
    // Intentar limpiar espacio si es error de quota
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        // Limpiar datos de autenticación antiguos si existen
        const oldKeys = Object.keys(localStorage).filter(k => 
          k.startsWith('auth_') && k !== key
        );
        oldKeys.forEach(k => localStorage.removeItem(k));
        
        // Intentar guardar nuevamente
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        // Si aún falla, retornar false
        return false;
      }
    }
    
    return false;
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

/**
 * Verifica la integridad de los datos de autenticación almacenados
 */
export function validateAuthData(): {
  isValid: boolean;
  hasToken: boolean;
  hasUser: boolean;
  hasConsistentData: boolean;
} {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const user = getStoredValue(STORAGE_KEYS.USER, null);
    const lastActivity = getStoredValue(STORAGE_KEYS.LAST_ACTIVITY, null);
    
    const hasToken = !!token && token !== 'undefined' && token !== 'null';
    const hasUser = !!user && typeof user === 'object';
    
    // Verificar consistencia: si hay token, debe haber usuario y viceversa
    const hasConsistentData = (hasToken && hasUser) || (!hasToken && !hasUser);
    
    // Verificar que la última actividad no sea muy antigua (más de 7 días)
    let isActivityValid = true;
    if (lastActivity) {
      const lastActivityDate = new Date(lastActivity);
      const now = new Date();
      const daysSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
      isActivityValid = daysSinceActivity <= 7;
    }
    
    const isValid = hasConsistentData && isActivityValid;
    
    return {
      isValid,
      hasToken,
      hasUser,
      hasConsistentData,
    };
  } catch {
    return {
      isValid: false,
      hasToken: false,
      hasUser: false,
      hasConsistentData: false,
    };
  }
}

/**
 * Migra datos de autenticación de formatos antiguos (si los hubiera)
 */
export function migrateAuthData(): boolean {
  try {
    // Verificar y limpiar datos corruptos o incompletos
    const validation = validateAuthData();
    
    if (!validation.hasConsistentData) {
      // Si los datos no son consistentes, limpiar todo
      clearAuthStorage();
      return true;
    }
    
    return true;
  } catch {
    // En caso de error, limpiar todo por seguridad
    clearAuthStorage();
    return false;
  }
}