import { useState, useEffect, useCallback } from 'react'

/**
 * Hook personalizado para manejar el estado sincronizado con localStorage
 * @param key - Clave para localStorage
 * @param initialValue - Valor inicial si no existe en localStorage
 * @returns [value, setValue, removeValue] - Estado actual, función para actualizar y función para eliminar
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  // Estado para almacenar el valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Verificar si estamos en el cliente (no SSR)
      if (typeof window === 'undefined') {
        return initialValue
      }

      // Obtener el item de localStorage
      const item = window.localStorage.getItem(key)
      
      // Parsear el JSON almacenado o devolver el valor inicial
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // Si hay error, devolver el valor inicial
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Función para actualizar tanto el estado como localStorage
  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    try {
      // Permitir que value sea una función para que tenga la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Guardar en el estado
      setStoredValue(valueToStore)
      
      // Verificar si estamos en el cliente
      if (typeof window !== 'undefined') {
        // Guardar en localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        
        // Disparar evento personalizado para sincronizar entre pestañas
        window.dispatchEvent(new CustomEvent('localStorage-change', {
          detail: { key, value: valueToStore }
        }))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Función para eliminar el valor de localStorage
  const removeValue = useCallback(() => {
    try {
      // Resetear al valor inicial
      setStoredValue(initialValue)
      
      // Verificar si estamos en el cliente
      if (typeof window !== 'undefined') {
        // Eliminar de localStorage
        window.localStorage.removeItem(key)
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('localStorage-change', {
          detail: { key, value: undefined }
        }))
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Escuchar cambios en localStorage de otras pestañas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error)
        }
      }
    }

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value !== undefined ? e.detail.value : initialValue)
      }
    }

    // Escuchar eventos de cambio de localStorage
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('localStorage-change', handleCustomStorageChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorage-change', handleCustomStorageChange as EventListener)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * Hook específico para manejar productos en localStorage
 */
export function useProductStorage() {
  type ProductWithId = import('@/types/product').CreateProduc & { id: string }
  return useLocalStorage<ProductWithId[]>('user-products', [])
}