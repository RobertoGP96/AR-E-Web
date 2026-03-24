import { apiClient } from '@/lib/api-client';

export interface PublicShop {
  id: number;
  name: string;
  tax_rate: number;
}

export async function getPublicShops(): Promise<PublicShop[]> {
  return apiClient.get<PublicShop[]>('/api_data/public/shops/', { skipAuth: true });
}
