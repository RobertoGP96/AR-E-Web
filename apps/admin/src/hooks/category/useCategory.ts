/**
 * Hook personalizado para gestionar categorías con TanStack Query
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  getCategories,
  getCategoryById,
  searchCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../services/category';
import type { CreateCategoryData } from '../../services/category/create-category';
import type { UpdateCategoryData } from '../../services/category/update-category';
import type { Category } from '../../types/models/category';

/**
 * Query key factory para categorías
 */
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

/**
 * Hook para obtener lista de categorías
 */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener una categoría por ID
 */
export function useCategory(id: number) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategoryById(id),
    enabled: !!id,
  });
}

/**
 * Hook para buscar categorías
 */
export function useSearchCategories(searchTerm: string) {
  return useQuery({
    queryKey: [...categoryKeys.lists(), 'search', searchTerm],
    queryFn: () => searchCategories(searchTerm),
    enabled: searchTerm.length > 0,
  });
}

/**
 * Hook para invalidar cache de categorías
 */
export function useInvalidateCategories() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: categoryKeys.lists() }),
    invalidateCategory: (id: number) => queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) }),
  };
}

/**
 * Hook para crear una nueva categoría
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryData: CreateCategoryData) => createCategory(categoryData),
    onSuccess: () => {
      // Invalidar el cache de la lista de categorías
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Hook para actualizar una categoría
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryData }) => updateCategory(id, data),
    onSuccess: (data) => {
      // Invalidar el cache de la categoría específica y las listas
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Hook para eliminar una categoría
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: number) => deleteCategory(categoryId),
    onSuccess: () => {
      // Invalidar el cache de las listas de categorías
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}