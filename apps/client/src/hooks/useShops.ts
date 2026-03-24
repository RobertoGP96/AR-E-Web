import { useQuery } from '@tanstack/react-query';
import { getPublicShops } from '@/services/shops/get-shops';
import type { PublicShop } from '@/services/shops/get-shops';

export function useShops() {
  const { data: shops = [], isLoading, isError, error } = useQuery<PublicShop[]>({
    queryKey: ['public-shops'],
    queryFn: getPublicShops,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { shops, isLoading, isError, error };
}
