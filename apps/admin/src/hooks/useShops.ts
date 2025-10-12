/**
 * Custom hook para gestionar el estado y operaciones de tiendas
 * Maneja la lógica de negocio y comunicación con la API
 */

import { useState, useEffect, useCallback } from 'react';
import { getShopsService, updateShopService, deleteShopService } from '@/services/shops';
import type { Shop } from '@/types/models/shop';

interface UseShopsOptions {
  autoFetch?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export function useShops(options: UseShopsOptions = {}) {
  const { autoFetch = true, onError, onSuccess } = options;

  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Obtiene todas las tiendas desde la API
   */
  const fetchShops = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getShopsService.getAllShops({
        per_page: 100,
        ordering: 'name'
      });

      setShops(response.results || []);
      
      // Si hay una tienda seleccionada, actualizarla con los nuevos datos
      if (selectedShop) {
        const updatedSelected = response.results?.find(s => s.id === selectedShop.id);
        setSelectedShop(updatedSelected || null);
      }

      return response.results || [];
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al cargar las tiendas');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedShop, onError]);

  /**
   * Agrega una nueva tienda al estado local
   */
  const addShop = useCallback((shop: Shop) => {
    setShops(prev => [...prev, shop].sort((a, b) => a.name.localeCompare(b.name)));
    // No mostrar toast aquí, lo hace el componente
  }, []);

  /**
   * Actualiza una tienda existente
   */
  const updateShop = useCallback(async (name: string, data: Partial<Shop>) => {
    try {
      const updatedShop = await updateShopService.updateShop(name, data);
      
      setShops(prev => prev.map(shop =>
        shop.name === name ? updatedShop : shop
      ));

      if (selectedShop?.name === name) {
        setSelectedShop(updatedShop);
      }

      // No mostrar toast aquí, lo hace el componente
      return updatedShop;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al actualizar la tienda');
      onError?.(error);
      throw error;
    }
  }, [selectedShop, onError]);

  /**
   * Elimina una tienda
   */
  const deleteShop = useCallback(async (id: number) => {
    try {
      await deleteShopService.deleteShopSafe(id);
      
      const deletedShop = shops.find(s => s.id === id);
      setShops(prev => prev.filter(shop => shop.id !== id));

      if (selectedShop?.id === id) {
        setSelectedShop(null);
      }

      onSuccess?.(`Tienda "${deletedShop?.name || 'desconocida'}" eliminada exitosamente`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al eliminar la tienda');
      onError?.(error);
      throw error;
    }
  }, [shops, selectedShop, onError, onSuccess]);

  /**
   * Actualiza las cuentas de compra de una tienda específica
   */
  const updateShopAccounts = useCallback(() => {
    // Recargar todas las tiendas para obtener las cuentas actualizadas
    fetchShops();
  }, [fetchShops]);

  /**
   * Selecciona una tienda
   */
  const selectShop = useCallback((shop: Shop | null) => {
    setSelectedShop(shop);
  }, []);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchShops();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar en el montaje

  return {
    // Estado
    shops,
    selectedShop,
    isLoading,
    error,

    // Acciones
    fetchShops,
    addShop,
    updateShop,
    deleteShop,
    selectShop,
    updateShopAccounts,

    // Utilidades
    refetch: fetchShops,
    clearError: () => setError(null),
  };
}
