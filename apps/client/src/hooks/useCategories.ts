import { useQuery } from '@tanstack/react-query';
import { getPublicCategories } from '@/services/categories/get-categories';
import type { PublicCategory } from '@/services/categories/get-categories';

export function useCategories() {
  const { data: categories = [], isLoading, isError, error } = useQuery<PublicCategory[]>({
    queryKey: ['public-categories'],
    queryFn: getPublicCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { categories, isLoading, isError, error };
}
